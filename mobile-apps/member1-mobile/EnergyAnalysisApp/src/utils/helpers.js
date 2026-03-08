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

/**
 * CEB TARIFF CALCULATION (verified against real bills)
 * Scales slab limits based on billing period days.
 */
export function calcCEB(units, days) {
  if (!units || !days || units <= 0 || days <= 0) return null;
  const norm = (units / days) * 30;
  let fixed, slabs, category, label;

  if (norm <= 60) {
    fixed = norm <= 30 ? 80 : 210;
    slabs = [{ lim: 30, rate: 4.50 }, { lim: 60, rate: 8.00 }];
    category = 1;
    label = '0 – 60 kWh';
  } else {
    fixed = norm <= 90 ? 400 : norm <= 120 ? 1000 : norm <= 180 ? 1500 : 2100;
    slabs = [
      { lim: 60, rate: 12.75 }, { lim: 90, rate: 18.50 },
      { lim: 120, rate: 24.00 }, { lim: 180, rate: 41.00 },
      { lim: null, rate: 61.00 },
    ];
    category = 2;
    label = 'Above 60 kWh';
  }

  const breakdown = [];
  let energy = 0, remaining = units, prev = 0;
  for (const { lim, rate } of slabs) {
    if (remaining <= 0) break;
    let inSlab, rangeLabel;
    if (lim === null) {
      inSlab = remaining;
      rangeLabel = `${prev + 1}+`;
    } else {
      const scaled = Math.floor(lim * days / 30);
      inSlab = Math.max(0, Math.min(remaining, scaled - prev));
      rangeLabel = prev === 0 ? `0 – ${scaled}` : `${prev + 1} – ${scaled}`;
      prev = scaled;
    }
    if (inSlab <= 0) continue;
    const amt = +(inSlab * rate).toFixed(2);
    energy += amt;
    breakdown.push({ range: rangeLabel, units: inSlab, rate, amt });
    remaining -= inSlab;
  }

  energy = +energy.toFixed(2);
  const subtotal = energy + fixed;
  const sscl = +(subtotal * 0.02565).toFixed(2);
  const total = +(subtotal + sscl).toFixed(2);
  return { category, label, energy, fixed, subtotal, sscl, total, breakdown, norm: +norm.toFixed(1) };
}
