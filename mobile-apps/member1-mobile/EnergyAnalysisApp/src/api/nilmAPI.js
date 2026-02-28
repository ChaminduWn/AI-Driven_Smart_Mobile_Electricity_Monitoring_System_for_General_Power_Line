import apiClient from './apiClient';

export const nilmAPI = {
  disaggregate: (accountNumber, totalKwh = null, date = null) =>
    apiClient.post('/nilm/disaggregate', {
      account_number: accountNumber,
      total_kwh: totalKwh,
      date,
    }),

  disaggregateEnhanced: (accountNumber, householdMembers, totalKwh = null, date = null) =>
    apiClient.post('/nilm/disaggregate-enhanced', {
      account_number: accountNumber,
      household_members: householdMembers,
      total_kwh: totalKwh,
      date,
    }),

  verifySetup: (accountNumber) =>
    apiClient.get(`/nilm/verify-setup/${accountNumber}`),

  getAccuracyReport: (accountNumber) =>
    apiClient.get(`/nilm/accuracy-report/${accountNumber}`),

  getHistoricalBreakdown: (accountNumber, days = 30) =>
    apiClient.get(`/nilm/historical-breakdown/${accountNumber}`, {
      params: { days },
    }),
};

export const mlAPI = {
  predictConsumption: (householdData) =>
    apiClient.post('/ml/predict-consumption', householdData),

  getModelInfo: () =>
    apiClient.get('/ml/model-info'),
};