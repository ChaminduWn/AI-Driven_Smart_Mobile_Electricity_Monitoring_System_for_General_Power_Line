import apiClient from './api';

const MEMBER1_BASE = '/api/member1';

export const member1Service = {
  // User Onboarding
  createHousehold: (data) => apiClient.post(`${MEMBER1_BASE}/households`, data),
  getHousehold: (id) => apiClient.get(`${MEMBER1_BASE}/households/${id}`),
  
  // Bill Management
  uploadBill: (formData) => apiClient.post(`${MEMBER1_BASE}/bills/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getBills: (householdId) => apiClient.get(`${MEMBER1_BASE}/bills/${householdId}`),
  updateBill: (billId, data) => apiClient.patch(`${MEMBER1_BASE}/bills/${billId}`, data),
  
  // NILM - Appliance Disaggregation
  getAppliances: (householdId) => apiClient.get(`${MEMBER1_BASE}/nilm/appliances/${householdId}`),
  runDisaggregation: (billId) => apiClient.post(`${MEMBER1_BASE}/nilm/disaggregate/${billId}`),
  
  // Real-time Monitoring
  getCurrentCost: (householdId) => apiClient.get(`${MEMBER1_BASE}/monitoring/current/${householdId}`),
  
  // Anomaly Detection
  getAnomalies: (householdId) => apiClient.get(`${MEMBER1_BASE}/anomaly/detect/${householdId}`),
  
  // Recommendations
  getRecommendations: (householdId) => apiClient.get(`${MEMBER1_BASE}/recommendations/${householdId}`),
};