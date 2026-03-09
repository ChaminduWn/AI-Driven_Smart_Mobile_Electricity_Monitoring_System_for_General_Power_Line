import apiClient from './apiClient';

export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  register: (payload) =>
    apiClient.post('/auth/register', payload),

  refresh: (refresh_token) =>
    apiClient.post('/auth/refresh', { refresh_token }),

  getMe: () =>
    apiClient.get('/auth/me'),

  logout: () =>
    apiClient.post('/auth/logout'),

  googleLogin: (id_token) =>
    apiClient.post('/auth/google', { id_token }),

  updateProfile: (payload) =>
    apiClient.put('/auth/profile', payload),
};
