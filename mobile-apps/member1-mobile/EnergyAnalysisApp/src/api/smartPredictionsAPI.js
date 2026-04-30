import apiClient from './apiClient';

export const smartPredictionsAPI = {

  // ── Model 1: Bill Spike Prediction ──────────────────────────────────────
  // Predicts whether next month's bill will spike based on bill history
  getSpikePrediction: (bills) =>
    apiClient.post('/smart/spike-prediction', { bills }),

  // ── Model 2: Tariff Crossing Warning ────────────────────────────────────
  // Real-time warning if user is heading toward expensive tariff tier
  getTariffWarning: (readings, billingStartMeter) =>
    apiClient.post('/smart/tariff-warning', {
      readings,
      billing_start_meter: billingStartMeter,
    }),

  // ── Model 3: Efficiency Score ────────────────────────────────────────────
  // Scores household efficiency 0–100 vs similar households
  getEfficiencyScore: (profile, actualKwh, billingMonth = null) =>
    apiClient.post('/smart/efficiency-score', {
      profile,
      actual_kwh: actualKwh,
      billing_month: billingMonth,
    }),

  // ── All 3 in one call (used by SmartInsightsScreen) ─────────────────────
  getFullInsights: (accountNumber) =>
    apiClient.get(`/smart/insights-summary/${accountNumber}`),
};