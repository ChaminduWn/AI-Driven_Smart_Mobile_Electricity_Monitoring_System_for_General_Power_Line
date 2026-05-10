import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Queue for failed requests during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = authHelpers.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('Request error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiration and refresh
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✓ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`✗ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, error.response?.status);
    }

    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = authHelpers.getRefreshToken();

      if (!refreshToken) {
        // No refresh token available, logout
        isRefreshing = false;
        authHelpers.logout();
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken, user } = response.data;

        // Store new tokens
        authHelpers.storeAuthData(access_token, user, newRefreshToken);

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Process queued requests
        processQueue(null, access_token);
        isRefreshing = false;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError, null);
        isRefreshing = false;
        authHelpers.logout();
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      console.error('Access forbidden - insufficient permissions');
    }

    if (error.response?.status >= 500) {
      console.error('Server error - please try again later');
    }

    return Promise.reject(error);
  }
);

// Helper functions for authentication
export const authHelpers = {
  /**
   * Check if user is authenticated and token is valid
   */
  isAuthenticated: () => {
    const token = authHelpers.getToken();
    if (!token) return false;

    try {
      // Decode JWT and check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        // Token expired, check if we have refresh token
        const refreshToken = authHelpers.getRefreshToken();
        return !!refreshToken;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      authHelpers.clearAuthData();
      return null;
    }
  },

  /**
   * Get auth token
   */
  getToken: () => {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
  },

  /**
   * Get refresh token
   */
  getRefreshToken: () => {
    return localStorage.getItem('refresh_token');
  },

  /**
   * Get token expiration time
   */
  getTokenExpiration: () => {
    const token = authHelpers.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  },

  /**
   * Check if token is about to expire (within 5 minutes)
   */
  isTokenExpiringSoon: () => {
    const expiration = authHelpers.getTokenExpiration();
    if (!expiration) return false;

    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    return expiration < fiveMinutesFromNow;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      // Optional: Call backend logout endpoint
      const token = authHelpers.getToken();
      if (token) {
        await apiClient.post('/api/v1/auth/logout').catch(() => {
          // Ignore errors on logout
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authHelpers.clearAuthData();
      
      // Redirect to login if not already there
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/login', '/register'];
      
      if (!publicPaths.includes(currentPath)) {
        window.location.href = '/';
      }
    }
  },

  /**
   * Store auth data after login/register
   */
  storeAuthData: (accessToken, user, refreshToken = null) => {
    if (!accessToken) {
      console.error('Attempted to store invalid token');
      return false;
    }

    try {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('token', accessToken); // Backward compatibility
      
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      return true;
    } catch (error) {
      console.error('Error storing auth data:', error);
      return false;
    }
  },

  /**
   * Clear all auth data from localStorage
   */
  clearAuthData: () => {
    const keysToRemove = ['token', 'access_token', 'refresh_token', 'user'];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  /**
   * Refresh access token manually
   */
  refreshAccessToken: async () => {
    const refreshToken = authHelpers.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefreshToken, user } = response.data;
      authHelpers.storeAuthData(access_token, user, newRefreshToken);

      return access_token;
    } catch (error) {
      authHelpers.logout();
      throw error;
    }
  },
};

export default apiClient;