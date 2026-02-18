import apiClient from './apiClient';

export const billsAPI = {
  getAll: (accountNumber) => {
    const params = accountNumber ? { account_number: accountNumber } : {};
    return apiClient.get('/bills', { params });
  },

  getById: (billId) =>
    apiClient.get(`/bills/${billId}`),

  getByAccount: (accountNumber) =>
    apiClient.get(`/bills/account/${accountNumber}`),

  upload: (formData) =>
    apiClient.post('/bills/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),

  update: (billId, data) =>
    apiClient.patch(`/bills/${billId}`, data),

  delete: (billId) =>
    apiClient.delete(`/bills/${billId}`),

  getStats: () =>
    apiClient.get('/bills/stats/summary'),
};