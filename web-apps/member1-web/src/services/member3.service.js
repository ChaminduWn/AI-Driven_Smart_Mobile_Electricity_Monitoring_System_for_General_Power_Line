import apiClient from './api';

const MEMBER3_BASE = '/api/member3';

export const member3Service = {
  // Weather & Climate
  getClimateData: (district, city) => apiClient.get(`${MEMBER3_BASE}/weather/climate`, {
    params: { district, city }
  }),
  getTemperaturePrediction: (location) => apiClient.post(`${MEMBER3_BASE}/weather/predict`, location),
  
  // Solar Feasibility
  checkFeasibility: (data) => apiClient.post(`${MEMBER3_BASE}/solar/feasibility`, data),
  
  // Cost Estimation
  getSolarCostEstimate: (data) => apiClient.post(`${MEMBER3_BASE}/solar/estimate`, data),
  
  // Recommendations
  getSolarRecommendations: (userId) => apiClient.get(`${MEMBER3_BASE}/solar/recommendations/${userId}`),
};