import apiClient from './apiClient';

export const authAPI = {
  login: (email, password) => apiClient.post('/api/v1/auth/login', { email, password }),
  register: (data) => apiClient.post('/api/v1/auth/register', data),
  logout: () => apiClient.post('/api/v1/auth/logout'),
  getMe: () => apiClient.get('/api/v1/auth/me'),
  updateProfile: (payload) => apiClient.put('/api/v1/auth/profile', payload),
};

export const accountsAPI = {
  getAll: () => apiClient.get('/api/v1/accounts'),
};

export const billsAPI = {
  getByAccount: (acc) => apiClient.get(`/api/v1/bills?account_number=${acc}`),
  getById: (id) => apiClient.get(`/api/v1/bills/${id}`),
  create: (data) => apiClient.post('/api/v1/bills', data),
  update: (id, data) => apiClient.patch(`/api/v1/bills/${id}`, data),
  delete: (id) => apiClient.delete(`/api/v1/bills/${id}`),
};

export const analysisAPI = {
  calculateTariff: (units, days) => apiClient.get(`/api/v1/analysis/calculate-tariff?units=${units}&days=${days}`),
  analyzePastMonth: (billId) => apiClient.get(`/api/v1/analysis/analyze-past-month/${billId}`),
  comparePeriods: (id1, id2) => apiClient.get(`/api/v1/analysis/compare-periods?bill1=${id1}&bill2=${id2}`),
  getBudgetRecommendations: (billId) => apiClient.get(`/api/v1/analysis/budget-recommendations/${billId}`),
  getPlansByAccount: (acc, archived) => apiClient.get(`/api/v1/analysis/plans?account_number=${acc}&archived=${archived}`),
  getPlanReadings: (planId) => apiClient.get(`/api/v1/analysis/readings/plan/${planId}`),
  createBudgetPlan: (billId, target, days, startDate) => apiClient.post('/api/v1/analysis/plans', {
    bill_id: billId,
    target_budget: target,
    planning_days: days,
    plan_start_date: startDate,
  }),
  endPlan: (planId) => apiClient.post(`/api/v1/analysis/plans/${planId}/end`),
  deletePlan: (planId) => apiClient.delete(`/api/v1/analysis/plans/${planId}`),
  setPlanPriority: (planId) => apiClient.post(`/api/v1/analysis/plans/${planId}/set-priority`),
  trackProgress: (planId, reading, date, notes) => apiClient.post('/api/v1/analysis/track-progress', {
    plan_id: planId,
    current_reading: reading,
    reading_date: date,
    notes,
  }),
};

export const appliancesAPI = {
  getByAccount: (acc, includePower) => apiClient.get(`/api/v1/appliances?account_number=${acc}&include_power=${includePower}`),
  add: (data) => apiClient.post('/api/v1/appliances', data),
  update: (id, data) => apiClient.put(`/api/v1/appliances/${id}`, data),
  delete: (id) => apiClient.delete(`/api/v1/appliances/${id}`),
};

export const iotAPI = {
  getDevices: (acc) => apiClient.get(`/api/v1/iot/devices?account_number=${acc}`),
  getLatest: (id) => apiClient.get(`/api/v1/iot/latest/${id}`),
  getSession: (id) => apiClient.get(`/api/v1/iot/sessions/${id}`),
  startSession: (devId, mins) => apiClient.post('/api/v1/iot/sessions/start', { devId, duration: mins }),
  stopSession: (id) => apiClient.post(`/api/v1/iot/sessions/${id}/stop`),
  controlRelay: (devId, state) => apiClient.post(`/api/v1/iot/control/${devId}/relay`, { state }),
};

export const safetyAPI = {
  getRiskScore: (acc) => apiClient.get(`/api/v1/safety/risk-score?account_number=${acc}`),
  getProtocol: (type) => apiClient.get(`/api/v1/safety/protocol/${type}`),
  getWeather: (loc) => apiClient.get(`/api/v1/safety/weather?location=${loc}`),
};

export const nilmAPI = {
  verifySetup: (acc) => apiClient.get(`/api/v1/nilm/setup/${acc}`),
  getAccuracyReport: (acc) => apiClient.get(`/api/v1/nilm/accuracy/${acc}`),
  disaggregate: (acc) => apiClient.post(`/api/v1/nilm/disaggregate/${acc}`),
};

export const plansAPI = {}; // Placeholder if imported but not specifically used as plansAPI.method

export default apiClient;

