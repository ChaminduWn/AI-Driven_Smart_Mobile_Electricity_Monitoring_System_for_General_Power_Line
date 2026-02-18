import { CATEGORY_COLORS, COLORS } from './theme';

export const formatCurrency = (amount, decimals = 2) => {
  if (amount == null || isNaN(amount)) return 'Rs. 0.00';
  return `Rs. ${Number(amount).toLocaleString('en-LK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export const formatKwh = (kwh, decimals = 2) => {
  if (kwh == null || isNaN(kwh)) return '0.00 kWh';
  return `${Number(kwh).toFixed(decimals)} kWh`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatMonthYear = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const getCategoryColor = (category) => {
  if (!category) return COLORS.other;
  return CATEGORY_COLORS[category] || COLORS.other;
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'on_track': return COLORS.success;
    case 'under_budget': return COLORS.primaryLight;
    case 'over_budget': return COLORS.danger;
    default: return COLORS.textSecondary;
  }
};

export const getStatusLabel = (status) => {
  switch (status) {
    case 'on_track': return 'On Track ✓';
    case 'under_budget': return 'Under Budget 🎉';
    case 'over_budget': return 'Over Budget ⚠️';
    default: return status || '—';
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return COLORS.danger;
    case 'medium': return COLORS.warning;
    case 'low': return COLORS.success;
    default: return COLORS.textSecondary;
  }
};

// Extract account numbers from bills list
export const extractAccountNumbers = (bills = []) => {
  const seen = new Set();
  return bills.filter((b) => {
    if (!b.account_number || seen.has(b.account_number)) return false;
    seen.add(b.account_number);
    return true;
  }).map((b) => b.account_number);
};

// NILM explanation helper
export const getNILMExplanation = () => ({
  title: 'What is NILM Disaggregation?',
  body: `Non-Intrusive Load Monitoring (NILM) is an AI technique that breaks down your total electricity consumption into individual appliance contributions — without installing any extra hardware.

How it works:
• Your total monthly kWh is known from your electricity bill.
• The AI knows your registered appliances (wattage, usage patterns).
• Using Bayesian inference + Machine Learning, it estimates how much each appliance consumed.

Why it's useful:
• Pinpoint which appliances cost you the most.
• Discover usage patterns you weren't aware of.
• Get targeted recommendations to reduce your bill.

Accuracy improves when you register more appliances.`,
});