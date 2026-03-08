import apiClient from './apiClient';

export const appliancesAPI = {
  getByAccount: (accountNumber, activeOnly = true) =>
    apiClient.get(`/appliances/account/${accountNumber}`, {
      params: { active_only: activeOnly },
    }),

  add: (data) =>
    apiClient.post('/appliances/', data),

  update: (id, data) =>
    apiClient.put(`/appliances/${id}`, data),

  delete: (id, softDelete = true) =>
    apiClient.delete(`/appliances/${id}`, { params: { soft_delete: softDelete } }),

  analyze: (accountNumber) =>
    apiClient.get(`/appliances/analysis/${accountNumber}`),

  getRecommendations: (accountNumber) =>
    apiClient.get(`/appliances/recommendations/${accountNumber}`),

  getCategories: () =>
    apiClient.get('/appliances/categories'),

  getCommonAppliances: () =>
    apiClient.get('/appliances/common-appliances'),

  recognizeFromImage: (formData) =>
    apiClient.post('/appliances/recognize-from-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
};