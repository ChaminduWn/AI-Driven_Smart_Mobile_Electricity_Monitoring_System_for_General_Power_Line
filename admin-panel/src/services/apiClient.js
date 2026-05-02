import axios from 'axios';
import storage from '../utils/storage';
import { API_BASE } from '../config';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request: attach Bearer token ────────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) { /* ignore */ }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response: handle 401 with refresh ──────────────────────────────────────
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    const isAuth = orig?.url?.includes('/auth/login') ||
      orig?.url?.includes('/auth/register') ||
      orig?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !orig._retry && !isAuth) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(token => {
          orig.headers.Authorization = `Bearer ${token}`;
          return apiClient(orig);
        });
      }

      orig._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await apiClient.post('/api/v1/auth/refresh', { refresh_token: refreshToken });
        const newAccess = res.data.access_token || res.data.accessToken || res.data.token;
        const newRefresh = res.data.refresh_token || res.data.refreshToken || refreshToken;

        if (!newAccess) throw new Error('Refresh missing access token');

        await storage.multiSet([['accessToken', newAccess], ['refreshToken', newRefresh]]);
        processQueue(null, newAccess);
        orig.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(orig);
      } catch (err) {
        processQueue(err, null);
        await storage.multiRemove(['accessToken', 'refreshToken', 'user', 'selectedAccount']);
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
