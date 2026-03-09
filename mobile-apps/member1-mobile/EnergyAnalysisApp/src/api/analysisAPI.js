import apiClient from './apiClient';

export const analysisAPI = {
  // ── Past Bill Analysis ──────────────────────────────────────────────────
  analyzePastMonth: (billId) =>
    apiClient.get(`/analysis/past-month/${billId}`),

  calculateTariff: (units, days = 30) =>
    apiClient.get('/analysis/tariff-calculator', { params: { units, days } }),

  getBudgetRecommendations: (billId) =>
    apiClient.get(`/analysis/budget-recommendations/${billId}`),

  comparePeriods: (billId1, billId2) =>
    apiClient.get('/analysis/compare-periods', {
      params: { bill_id_1: billId1, bill_id_2: billId2 },
    }),

  saveManualBill: (data) =>
    apiClient.post('/analysis/save-manual-bill', data),

  // ── Budget Plans ────────────────────────────────────────────────────────
  createBudgetPlan: (billId, targetBudget, planningDays = 30) =>
    apiClient.post('/analysis/create-budget-plan', {
      bill_id: billId,
      target_budget: targetBudget,
      planning_days: planningDays,
    }),

  getPlanById: (planId) =>
    apiClient.get(`/analysis/plans/${planId}`),

  getPlansByAccount: (accountNumber, activeOnly = true) =>
    apiClient.get(`/analysis/plans/account/${accountNumber}`, {
      params: { active_only: activeOnly },
    }),

  updatePlan: (planId, data) =>
    apiClient.put(`/analysis/plans/${planId}`, data),

  deletePlan: (planId) =>
    apiClient.delete(`/analysis/plans/${planId}`),

  endPlan: (planId) =>
    apiClient.post(`/analysis/plans/${planId}/end`),

  // ── Meter Readings / Progress Tracking ─────────────────────────────────
  trackProgress: (planId, currentReading, readingDate, notes = null) =>
    apiClient.post('/analysis/track-progress', {
      plan_id: planId,
      current_reading: currentReading,
      reading_date: readingDate,
      notes,
    }),

  getPlanReadings: (planId) =>
    apiClient.get(`/analysis/readings/plan/${planId}`),

  updateReading: (readingId, data) =>
    apiClient.put(`/analysis/readings/${readingId}`, data),

  deleteReading: (readingId) =>
    apiClient.delete(`/analysis/readings/${readingId}`),
};