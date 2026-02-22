import axios from 'axios';
import storage from '../utils/storage';
import { API_BASE } from '../config';

// ─── Base URL (centralized) ──────────────────────────────────────────────────
const BASE_URL = API_BASE;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach Bearer token ─────────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('accessToken');
      console.log(`📤 [${config.method?.toUpperCase()}] ${config.url}`);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`   ✓ Token attached (${token.slice(0, 20)}...)`);
      } else {
        console.warn('   ⚠️  No token found in storage');
      }
    } catch (e) {
      console.error('❌ Could not read token from storage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor: handle 401 with refresh ───────────────────────
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error(`❌ [${error.response?.status}] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`);

    // Don't retry auth endpoints to avoid infinite loops
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      console.log('🔄 401 Unauthorized - attempting token refresh...');
      
      if (isRefreshing) {
        console.log('   Already refresing token, queueing request');
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((token) => {
            console.log('   ✓ Retrying with new token');
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => {
            console.error('   ❌ Queued request failed:', err.message);
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token — user must log in again');
        }
        
        console.log('   Sending refresh request...');
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        // Handle different backend response shapes
        const newAccessToken =
          res.data.access_token ||
          res.data.accessToken ||
          res.data.token;

        const newRefreshToken =
          res.data.refresh_token ||
          res.data.refreshToken ||
          refreshToken; // fallback to old one if backend doesn't rotate

        if (!newAccessToken) throw new Error('Refresh response missing access token');

        console.log('   ✓ Token refreshed successfully');
        await storage.multiSet([
          ['accessToken', newAccessToken],
          ['refreshToken', newRefreshToken],
        ]);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        console.error('   ❌ Token refresh failed:', err.message);
        processQueue(err, null);
        await storage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // NOTE: Navigation to login happens via AuthContext watching isAuthenticated
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;