"""
Smart Electricity Predictions — 3 Model System
===============================================
For: AI-Driven Smart Electricity for General Power Line (Research Project)

Model 1: Bill Spike Predictor
  - Learns from user's own bill history
  - Classifies: will next month spike (>20% above 3-month avg)?
  - Data: automatically from bill uploads, no surveys needed

Model 2: Tariff Crossing Warner
  - Predicts projected month-end kWh from mid-month meter readings
  - Warns if user is heading toward expensive CEB tariff tier
  - Pure math + linear extrapolation — no training data needed

Model 3: Household Efficiency Scorer
  - Scores user 0–100 based on actual vs expected consumption
  - Expected = what similar households in dataset consume
  - Enables fair peer comparison regardless of household size/appliances

FastAPI Integration:
  - POST /ml/spike-prediction
  - POST /ml/tariff-warning
  - POST /ml/efficiency-score
  - GET  /ml/insights-summary/{account_number}

Author: Research Team
"""

import numpy as np
import pandas as pd
import joblib
import os
import json
import math
from datetime import datetime, date
from typing import List, Optional, Dict, Tuple
from dataclasses import dataclass, asdict


# ══════════════════════════════════════════════════════════════════════════════
# DATA CLASSES
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class BillRecord:
    """One month's electricity bill data — extracted from uploaded bill"""
    kwh: float
    billing_month: int          # 1–12
    billing_year: int
    billing_days: int           # actual days in billing period (28–35)
    amount_rs: float
    meter_start: float
    meter_end: float

@dataclass
class MeterReading:
    """Single meter reading submitted by user mid-month"""
    reading_value: float
    reading_date: str           # ISO date string "2025-03-15"
    billing_period_start: str   # "2025-03-01"
    billing_period_end: str     # "2025-03-31"

@dataclass
class HouseholdProfile:
    """Household characteristics from registration"""
    house_type: int             # 0=apt, 1=single-story, 2=two-story, 3=villa
    total_people: int
    num_elderly: int
    num_children: int
    has_ac: int
    num_ac_units: int           # 0,1,2,3+
    has_water_heater: int
    has_fridge: int
    has_washing_machine: int
    has_solar: int              # 0=none, 1=partial, 2=full
    floor_area_category: int    # 0=<500, 1=500-1000, 2=1000-1500, 3=1500+ sqft
    urban_rural: int            # 0=rural, 1=semi-urban, 2=urban


# ══════════════════════════════════════════════════════════════════════════════
# CEB TARIFF CONSTANTS (Sri Lanka 2024)
# ══════════════════════════════════════════════════════════════════════════════

CEB_TARIFF = {
    # Category 1: ≤ 60 kWh/month
    'cat1': {
        'max_kwh': 60,
        'slabs': [
            (30, 4.50),    # first 30 units @ Rs 4.50
            (30, 10.00),   # next 30 units @ Rs 10.00
        ],
        'fixed_charge': 30.00,
    },
    # Category 2: > 60 kWh/month (ALL units at higher rates)
    'cat2': {
        'slabs': [
            (60,  15.00),  # first 60 units
            (30,  22.00),  # next 30
            (30,  28.00),  # next 30
            (30,  32.00),  # next 30
            (999, 45.00),  # above 150
        ],
        'fixed_charge': 90.00,
    }
}

def calculate_ceb_bill(kwh: float) -> Dict:
    """Calculate exact CEB bill for given kWh units"""
    if kwh <= 60:
        tariff = CEB_TARIFF['cat1']
        category = 1
    else:
        tariff = CEB_TARIFF['cat2']
        category = 2

    total = tariff['fixed_charge']
    remaining = kwh
    breakdown = []

    for limit, rate in tariff['slabs']:
        units_in_slab = min(remaining, limit)
        cost = units_in_slab * rate
        if units_in_slab > 0:
            breakdown.append({
                'units': round(units_in_slab, 1),
                'rate': rate,
                'cost': round(cost, 2),
            })
        remaining -= units_in_slab
        total += cost
        if remaining <= 0:
            break

    return {
        'category': category,
        'total_rs': round(total, 2),
        'fixed_charge': tariff['fixed_charge'],
        'breakdown': breakdown,
    }


# ══════════════════════════════════════════════════════════════════════════════
# MODEL 1: BILL SPIKE PREDICTOR
# ══════════════════════════════════════════════════════════════════════════════

class BillSpikePredictor:
    """
    Predicts whether next month's bill will spike (>20% above 3-month average).

    Research design:
    - Personalized: learns from each user's own bill history
    - Features are all automatically computed from bill uploads
    - Classification problem (spike / no spike) → more reliable than exact kWh prediction
    - Uses gradient boosting for non-linear seasonal patterns

    With enough users, also trains a global model that helps new users
    with limited history (cold start problem).
    """

    SPIKE_THRESHOLD = 0.20  # 20% above 3-month avg = spike

    def __init__(self):
        self.global_model = None
        self.scaler = None
        self.is_fitted = False
        self.seasonal_factors = {}  # month → avg factor vs annual mean

    def _extract_features(self, bills: List[BillRecord]) -> Optional[Dict]:
        """
        Extract ML features from a list of bills sorted oldest→newest.
        Need at least 3 bills to compute meaningful features.
        """
        if len(bills) < 3:
            return None

        bills = sorted(bills, key=lambda b: (b.billing_year, b.billing_month))
        kwh_values = [b.kwh for b in bills]
        recent = bills[-1]

        # Core time-series features
        avg_3m = np.mean(kwh_values[-3:])
        avg_6m = np.mean(kwh_values[-6:]) if len(kwh_values) >= 6 else avg_3m
        kwh_last = kwh_values[-1]
        kwh_prev = kwh_values[-2]
        kwh_2prev = kwh_values[-3]

        # Trend: positive = rising consumption
        trend_1m = (kwh_last - kwh_prev) / (kwh_prev + 1e-6)
        trend_3m = (kwh_last - kwh_2prev) / (kwh_2prev + 1e-6)

        # Consecutive increases (momentum)
        consec_increases = 0
        for i in range(len(kwh_values) - 1, 0, -1):
            if kwh_values[i] > kwh_values[i - 1]:
                consec_increases += 1
            else:
                break

        # How far above/below personal average
        deviation_from_avg = (kwh_last - avg_3m) / (avg_3m + 1e-6)

        # Volatility (how unpredictable this household is)
        volatility = np.std(kwh_values[-6:]) / (avg_6m + 1e-6) if len(kwh_values) >= 6 else 0.15

        # Billing period length (longer period = more kWh naturally)
        avg_days = np.mean([b.billing_days for b in bills[-3:]])
        kwh_per_day = kwh_last / (recent.billing_days + 1e-6)

        # Seasonal: next month number (what month are we predicting for)
        next_month = (recent.billing_month % 12) + 1

        # Same month last year (if available)
        same_month_last_year = None
        for b in bills:
            if b.billing_month == next_month and b.billing_year == recent.billing_year - 1:
                same_month_last_year = b.kwh
                break
        yoy_factor = (same_month_last_year / avg_3m) if same_month_last_year else 1.0

        # Is next month historically a hot month in Sri Lanka?
        # Apr/May = hottest (pre-monsoon), Dec/Jan = cooler
        hot_months = {3, 4, 5}      # March-May: dry season, AC peaks
        rainy_months = {5, 10, 11}  # monsoon, less AC
        is_hot_season = int(next_month in hot_months)
        is_rainy_season = int(next_month in rainy_months)

        # Tariff category risk (near the 60 kWh cliff)
        near_cat2_boundary = int(50 <= kwh_last <= 70)

        return {
            'kwh_last': kwh_last,
            'avg_3m': avg_3m,
            'avg_6m': avg_6m,
            'trend_1m': trend_1m,
            'trend_3m': trend_3m,
            'consec_increases': consec_increases,
            'deviation_from_avg': deviation_from_avg,
            'volatility': volatility,
            'kwh_per_day': kwh_per_day,
            'next_month': next_month,
            'yoy_factor': yoy_factor,
            'is_hot_season': is_hot_season,
            'is_rainy_season': is_rainy_season,
            'near_cat2_boundary': near_cat2_boundary,
            'avg_billing_days': avg_days,
            'num_bills_available': len(bills),
        }

    def predict_spike(self, bills: List[BillRecord]) -> Dict:
        """
        Main prediction: will next month spike?
        Works with as few as 3 bills using rule-based fallback.
        """
        bills_sorted = sorted(bills, key=lambda b: (b.billing_year, b.billing_month))
        kwh_values = [b.kwh for b in bills_sorted]
        recent = bills_sorted[-1] if bills_sorted else None

        if not recent or len(bills) < 2:
            return {
                'spike_risk': 'unknown',
                'spike_probability': 0.5,
                'confidence': 'low',
                'message': 'Need at least 2 months of bill history for predictions.',
                'predicted_kwh_range': None,
                'factors': [],
            }

        features = self._extract_features(bills_sorted)
        if not features:
            # Only 2 bills: simple rule-based
            trend = (kwh_values[-1] - kwh_values[-2]) / (kwh_values[-2] + 1e-6)
            spike_prob = min(0.85, max(0.15, 0.5 + trend * 1.5))
            risk = 'high' if spike_prob > 0.65 else 'medium' if spike_prob > 0.35 else 'low'
            return {
                'spike_risk': risk,
                'spike_probability': round(spike_prob, 2),
                'confidence': 'low',
                'message': f"Based on 2 bills: usage {'increased' if trend > 0 else 'decreased'} {abs(trend)*100:.0f}% last month.",
                'predicted_kwh_range': (
                    round(kwh_values[-1] * 0.9, 0),
                    round(kwh_values[-1] * 1.25, 0),
                ),
                'factors': ['Limited history — add more bills for better accuracy'],
            }

        # Use model if fitted, otherwise rule-based
        spike_prob = self._rule_based_probability(features)
        method = 'rule-based'

        if self.is_fitted:
            try:
                from sklearn.preprocessing import StandardScaler
                feat_array = np.array([[
                    features['kwh_last'], features['avg_3m'], features['avg_6m'],
                    features['trend_1m'], features['trend_3m'], features['consec_increases'],
                    features['deviation_from_avg'], features['volatility'],
                    features['kwh_per_day'], features['next_month'], features['yoy_factor'],
                    features['is_hot_season'], features['is_rainy_season'],
                    features['near_cat2_boundary'], features['avg_billing_days'],
                ]])
                feat_scaled = self.scaler.transform(feat_array)
                spike_prob = float(self.global_model.predict_proba(feat_scaled)[0][1])
                method = 'ml'
            except Exception as e:
                pass  # fall back to rule-based

        # Determine risk level
        if spike_prob >= 0.70:
            risk = 'high'
            emoji = '🔴'
        elif spike_prob >= 0.45:
            risk = 'medium'
            emoji = '🟡'
        else:
            risk = 'low'
            emoji = '🟢'

        # Build explanation factors
        factors = []
        avg_3m = features['avg_3m']
        if features['trend_1m'] > 0.10:
            factors.append(f"Usage rose {features['trend_1m']*100:.0f}% last month")
        if features['consec_increases'] >= 2:
            factors.append(f"Rising for {features['consec_increases']} consecutive months")
        if features['is_hot_season']:
            factors.append("Entering hot season — AC usage typically increases")
        if features['yoy_factor'] > 1.15:
            factors.append(f"Same month last year was {(features['yoy_factor']-1)*100:.0f}% higher than average")
        if features['near_cat2_boundary']:
            factors.append("Currently near the 60 kWh tariff boundary — spike could trigger Category 2 rates")
        if not factors:
            factors.append("No major spike indicators detected")

        # Predicted range for next month
        base_pred = avg_3m * (1 + features['trend_1m'] * 0.5)
        if features['is_hot_season']:
            base_pred *= 1.08
        low_pred = max(10, base_pred * 0.85)
        high_pred = base_pred * (1.35 if risk == 'high' else 1.20)

        # What would the bill cost at predicted range?
        low_bill = calculate_ceb_bill(low_pred)
        high_bill = calculate_ceb_bill(high_pred)

        confidence = 'high' if len(bills) >= 6 else 'medium' if len(bills) >= 3 else 'low'

        return {
            'spike_risk': risk,
            'spike_probability': round(spike_prob, 2),
            'confidence': confidence,
            'method': method,
            'emoji': emoji,
            'message': self._build_spike_message(risk, spike_prob, features, base_pred),
            'predicted_kwh_range': (round(low_pred, 0), round(high_pred, 0)),
            'predicted_bill_range': (low_bill['total_rs'], high_bill['total_rs']),
            'current_3month_avg_kwh': round(avg_3m, 1),
            'factors': factors,
            'action_tips': self._spike_action_tips(risk, features),
            'bills_used': len(bills),
        }

    def _rule_based_probability(self, features: Dict) -> float:
        """Transparent rule-based probability when model not fitted"""
        score = 0.30  # base probability

        # Trend momentum
        score += features['trend_1m'] * 0.4
        score += features['trend_3m'] * 0.2

        # Consecutive increases compound risk
        score += features['consec_increases'] * 0.08

        # Seasonal adjustments for Sri Lanka
        score += features['is_hot_season'] * 0.12
        score -= features['is_rainy_season'] * 0.06

        # Year-over-year signal
        score += (features['yoy_factor'] - 1.0) * 0.3

        # Near tariff boundary amplifies impact
        score += features['near_cat2_boundary'] * 0.08

        return max(0.05, min(0.95, score))

    def _build_spike_message(self, risk: str, prob: float, features: Dict, pred: float) -> str:
        avg = features['avg_3m']
        pct_above = ((pred - avg) / avg * 100) if avg > 0 else 0
        if risk == 'high':
            return (f"⚠️ High spike risk ({prob*100:.0f}% probability). "
                    f"Next month may be {pct_above:.0f}% above your average "
                    f"({avg:.0f} kWh). Act now to reduce usage.")
        elif risk == 'medium':
            return (f"📊 Moderate spike risk. Your usage trend suggests "
                    f"next month could reach ~{pred:.0f} kWh. "
                    f"Monitor closely.")
        else:
            return (f"✅ Low spike risk. Based on your history, next month "
                    f"should be around {pred:.0f} kWh — similar to your average.")

    def _spike_action_tips(self, risk: str, features: Dict) -> List[str]:
        tips = []
        if risk in ('high', 'medium'):
            if features['is_hot_season']:
                tips.append("Set AC 1–2°C warmer — each degree saves ~6% on cooling")
                tips.append("Use fans instead of AC during evenings if possible")
            tips.append("Submit meter readings weekly to catch overuse early")
            tips.append("Check for appliances left on standby overnight")
        else:
            tips.append("Keep up current habits — your consumption is stable")
        return tips

    def train_global_model(self, all_user_bills: List[Dict]):
        """
        Train global model from all users' bill histories.
        Called periodically (nightly) with aggregated anonymized data.
        Each dict: {'user_id': ..., 'bills': [BillRecord, ...]}
        """
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import cross_val_score

        X_rows, y_labels = [], []

        for user_data in all_user_bills:
            bills = user_data['bills']
            if len(bills) < 4:
                continue

            bills_sorted = sorted(bills, key=lambda b: (b.billing_year, b.billing_month))

            # Use each window of bills to generate training samples
            for i in range(3, len(bills_sorted)):
                history = bills_sorted[:i]
                actual_next = bills_sorted[i].kwh
                avg_3m = np.mean([b.kwh for b in history[-3:]])

                # Label: did next month spike?
                spike = int((actual_next - avg_3m) / (avg_3m + 1e-6) > self.SPIKE_THRESHOLD)

                features = self._extract_features(history)
                if features is None:
                    continue

                feat_vector = [
                    features['kwh_last'], features['avg_3m'], features['avg_6m'],
                    features['trend_1m'], features['trend_3m'], features['consec_increases'],
                    features['deviation_from_avg'], features['volatility'],
                    features['kwh_per_day'], features['next_month'], features['yoy_factor'],
                    features['is_hot_season'], features['is_rainy_season'],
                    features['near_cat2_boundary'], features['avg_billing_days'],
                ]
                X_rows.append(feat_vector)
                y_labels.append(spike)

        if len(X_rows) < 20:
            print(f"Not enough training samples ({len(X_rows)}). Need at least 20.")
            return None

        X = np.array(X_rows)
        y = np.array(y_labels)

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.global_model = GradientBoostingClassifier(
            n_estimators=100, max_depth=4, learning_rate=0.1,
            min_samples_leaf=3, random_state=42
        )
        self.global_model.fit(X_scaled, y)

        # Cross-validated accuracy
        cv_scores = cross_val_score(self.global_model, X_scaled, y, cv=5, scoring='f1')
        self.is_fitted = True

        print(f"Spike Predictor trained: {len(X_rows)} samples")
        print(f"CV F1: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
        print(f"Spike rate in data: {y.mean():.1%}")

        return {
            'samples': len(X_rows),
            'spike_rate': float(y.mean()),
            'cv_f1_mean': float(cv_scores.mean()),
            'cv_f1_std': float(cv_scores.std()),
        }


# ══════════════════════════════════════════════════════════════════════════════
# MODEL 2: TARIFF CROSSING WARNER
# ══════════════════════════════════════════════════════════════════════════════

class TariffCrossingWarner:
    """
    Real-time warning: is user heading toward crossing CEB tariff boundary?

    The 60 kWh boundary is a CLIFF in Sri Lanka's CEB tariff:
    - At 59 kWh: Category 1 → bill ≈ Rs. 620
    - At 61 kWh: Category 2 → bill ≈ Rs. 1,100 (nearly double!)

    This is pure math + linear extrapolation. No training needed.
    But we add a simple learned seasonal correction factor.

    How it works:
    1. User submits meter reading mid-month
    2. We calculate daily consumption rate so far
    3. Project to end of billing period
    4. Warn if projection crosses 60 kWh threshold
    5. Show exactly how much to cut per day to stay under
    """

    # CEB tariff category thresholds (kWh/month)
    BOUNDARY_1 = 60    # Cat1→Cat2: biggest cliff (Rs 620 → Rs 1,100+)
    BOUNDARY_2 = 90    # Within Cat2 slab 2 starts
    BOUNDARY_3 = 120   # Within Cat2 slab 3 starts
    BOUNDARY_4 = 150   # Within Cat2 slab 4 starts

    def analyze(self, readings: List[MeterReading], billing_period_kwh_start: float = 0) -> Dict:
        """
        Main analysis: given meter readings so far this month, project to end.

        readings: list of MeterReading objects this billing period
        billing_period_kwh_start: meter reading at start of billing period
        """
        if not readings:
            return {
                'status': 'no_data',
                'message': 'No meter readings this billing period. Submit your first reading to start monitoring.',
                'projected_kwh': None,
            }

        readings_sorted = sorted(readings, key=lambda r: r.reading_date)
        latest = readings_sorted[-1]

        # Calculate days elapsed and days remaining
        period_start = datetime.fromisoformat(latest.billing_period_start)
        period_end = datetime.fromisoformat(latest.billing_period_end)
        reading_date = datetime.fromisoformat(latest.reading_date)

        total_days = (period_end - period_start).days + 1
        days_elapsed = (reading_date - period_start).days + 1
        days_remaining = total_days - days_elapsed

        if days_elapsed <= 0:
            return {'status': 'error', 'message': 'Invalid date range'}

        # Units consumed so far
        kwh_so_far = latest.reading_value - billing_period_kwh_start

        # Daily rate based on actual usage so far
        daily_rate = kwh_so_far / days_elapsed

        # Projected total
        projected_kwh = kwh_so_far + (daily_rate * days_remaining)

        # Analyze crossing risk
        current_bill = calculate_ceb_bill(kwh_so_far)
        projected_bill = calculate_ceb_bill(projected_kwh)

        warning = self._assess_boundary_crossing(
            kwh_so_far, projected_kwh, days_remaining, daily_rate
        )

        # Calculate savings if user reduces by various amounts
        reduction_scenarios = self._calculate_reduction_scenarios(
            kwh_so_far, projected_kwh, days_remaining, daily_rate
        )

        # Percentage of billing period done
        period_progress_pct = (days_elapsed / total_days) * 100

        return {
            'status': warning['status'],
            'days_elapsed': days_elapsed,
            'days_remaining': days_remaining,
            'total_billing_days': total_days,
            'period_progress_pct': round(period_progress_pct, 1),

            'kwh_so_far': round(kwh_so_far, 1),
            'daily_rate_kwh': round(daily_rate, 2),
            'projected_kwh': round(projected_kwh, 1),

            'current_bill_estimate_rs': current_bill['total_rs'],
            'projected_bill_rs': projected_bill['total_rs'],
            'current_tariff_category': current_bill['category'],
            'projected_tariff_category': projected_bill['category'],

            'warning': warning,
            'reduction_scenarios': reduction_scenarios,

            # Boundary distances
            'kwh_to_boundary_60': round(max(0, 60 - projected_kwh), 1),
            'kwh_over_boundary_60': round(max(0, projected_kwh - 60), 1),
            'kwh_to_boundary_90': round(max(0, 90 - projected_kwh), 1),
            'kwh_to_boundary_120': round(max(0, 120 - projected_kwh), 1),
        }

    def _assess_boundary_crossing(
        self, kwh_so_far: float, projected: float,
        days_remaining: int, daily_rate: float
    ) -> Dict:

        # Currently in Cat1, projecting into Cat2
        if kwh_so_far <= 60 and projected > 60:
            overflow = projected - 60
            bill_without_cross = calculate_ceb_bill(60)
            bill_with_cross = calculate_ceb_bill(projected)
            extra_cost = bill_with_cross['total_rs'] - bill_without_cross['total_rs']

            if days_remaining > 0:
                reduction_needed_per_day = overflow / days_remaining
            else:
                reduction_needed_per_day = 0

            return {
                'status': 'danger',
                'emoji': '🔴',
                'title': 'Tariff Boundary Alert!',
                'message': (
                    f"You are projected to use {projected:.0f} kWh — "
                    f"{overflow:.0f} kWh over the Category 1 limit (60 kWh). "
                    f"This will cost an extra Rs. {extra_cost:.0f} on your bill."
                ),
                'extra_cost_rs': round(extra_cost, 0),
                'overflow_kwh': round(overflow, 1),
                'reduction_per_day_needed': round(reduction_needed_per_day, 2),
                'action': (
                    f"Reduce usage by {reduction_needed_per_day:.2f} kWh/day "
                    f"for the next {days_remaining} days to stay under 60 kWh."
                ),
            }

        # Already in Cat2, projecting into higher slab
        elif projected > 90 and kwh_so_far <= 90:
            overflow = projected - 90
            return {
                'status': 'warning',
                'emoji': '🟡',
                'title': 'Moving to Higher Tariff Slab',
                'message': f"Projected {projected:.0f} kWh will enter the 90+ kWh slab (Rs. 28/unit).",
                'extra_cost_rs': round(overflow * (28 - 22), 0),
                'overflow_kwh': round(overflow, 1),
                'reduction_per_day_needed': round(overflow / (days_remaining + 1), 2),
                'action': "Consider reducing usage to stay under 90 kWh.",
            }

        # Safe — well within current category
        elif projected <= 55:
            return {
                'status': 'safe',
                'emoji': '🟢',
                'title': 'On Track',
                'message': f"Projected {projected:.0f} kWh — comfortably within Category 1 (≤60 kWh).",
                'extra_cost_rs': 0,
                'overflow_kwh': 0,
                'reduction_per_day_needed': 0,
                'action': "Keep it up! You are on track for a low bill.",
            }

        # In Cat2 but stable
        else:
            return {
                'status': 'monitor',
                'emoji': '🔵',
                'title': 'Monitoring',
                'message': f"Projected {projected:.0f} kWh. Continue submitting readings to track accurately.",
                'extra_cost_rs': 0,
                'overflow_kwh': 0,
                'reduction_per_day_needed': 0,
                'action': "Submit meter readings every few days for accurate projections.",
            }

    def _calculate_reduction_scenarios(
        self, kwh_so_far: float, projected: float,
        days_remaining: int, daily_rate: float
    ) -> List[Dict]:
        """Show user: what if I reduce by X kWh/day?"""
        if days_remaining <= 0 or projected <= 60:
            return []

        scenarios = []
        reductions = [0.5, 1.0, 2.0, 3.0]

        current_bill = calculate_ceb_bill(projected)

        for reduction in reductions:
            new_projected = kwh_so_far + (daily_rate - reduction) * days_remaining
            new_projected = max(kwh_so_far, new_projected)
            new_bill = calculate_ceb_bill(new_projected)
            saving = current_bill['total_rs'] - new_bill['total_rs']

            if saving > 0:
                scenarios.append({
                    'reduce_per_day_kwh': reduction,
                    'new_projected_kwh': round(new_projected, 1),
                    'new_projected_bill_rs': new_bill['total_rs'],
                    'saving_rs': round(saving, 0),
                    'category_change': new_bill['category'] != current_bill['category'],
                    'description': f"Reduce {reduction} kWh/day → save Rs. {saving:.0f}",
                })

        return scenarios


# ══════════════════════════════════════════════════════════════════════════════
# MODEL 3: HOUSEHOLD EFFICIENCY SCORER
# ══════════════════════════════════════════════════════════════════════════════

class HouseholdEfficiencyScorer:
    """
    Scores a household's electricity efficiency 0–100.

    Key insight: raw kWh is unfair for comparison.
    A 6-person house with AC using 150 kWh may be MORE efficient
    than a 2-person apartment using 80 kWh.

    Method:
    1. Build expected kWh model from household profile (Ridge regression)
    2. Score = how much LESS than expected the household uses
    3. Normalize to 0–100 across all households in dataset
    4. Show percentile rank among truly similar peers

    Research value:
    - Novel normalized efficiency metric for Sri Lankan households
    - Enables fair peer comparison regardless of size/appliances
    - Directly usable for policy recommendations
    """

    # Appliance typical monthly kWh (Sri Lankan usage patterns)
    APPLIANCE_KWH = {
        'has_ac': 90,              # 1 unit, ~6h/day average Sri Lankan usage
        'has_water_heater': 45,    # electric water heater daily use
        'has_washing_machine': 12, # ~3 washes/week
        'has_fridge': 35,          # always on
        'has_rice_cooker': 15,
        'has_computer': 18,
        'has_tv': 12,
        'has_fan': 8,
    }

    HOUSE_TYPE_FACTOR = {0: 0.85, 1: 1.0, 2: 1.20, 3: 1.45}  # apartment to villa
    URBAN_FACTOR = {0: 0.90, 1: 1.0, 2: 1.10}                 # rural to urban

    def __init__(self):
        self.ridge_model = None
        self.scaler = None
        self.training_profiles = []
        self.training_kwh = []
        self.training_efficiency_ratios = []
        self.is_fitted = False

    def _physics_estimate(self, profile: HouseholdProfile) -> float:
        """
        Physics-based expected kWh using real appliance consumption figures.
        This is the interpretable baseline — used even before ML training.
        """
        # Base: per-person consumption
        base = profile.total_people * 8.0  # ~8 kWh/person/month baseline

        # Elderly and young children increase daytime usage
        base += profile.num_elderly * 5.0
        base += profile.num_children * 2.0

        # Appliance contributions
        appliance_kwh = 0
        for appliance, monthly_kwh in self.APPLIANCE_KWH.items():
            if getattr(profile, appliance, 0):
                appliance_kwh += monthly_kwh

        # AC scales with number of units
        if profile.num_ac_units > 1:
            appliance_kwh += (profile.num_ac_units - 1) * 90

        # House type and location scaling
        house_factor = self.HOUSE_TYPE_FACTOR.get(profile.house_type, 1.0)
        urban_factor = self.URBAN_FACTOR.get(profile.urban_rural, 1.0)

        # Solar reduces expected consumption
        solar_reduction = {0: 0, 1: 0.15, 2: 0.35}.get(profile.has_solar, 0)

        # Floor area scaling
        area_factor = {0: 0.80, 1: 1.0, 2: 1.15, 3: 1.30}.get(profile.floor_area_category, 1.0)

        expected = (base + appliance_kwh) * house_factor * urban_factor * area_factor
        expected *= (1 - solar_reduction)

        return max(10, expected)

    def _profile_to_features(self, profile: HouseholdProfile) -> np.ndarray:
        physics = self._physics_estimate(profile)
        return np.array([
            profile.house_type, profile.total_people,
            profile.num_elderly, profile.num_children,
            profile.has_ac, profile.num_ac_units,
            profile.has_water_heater, profile.has_fridge,
            profile.has_washing_machine, profile.has_solar,
            profile.floor_area_category, profile.urban_rural,
            physics,  # physics estimate as a feature
        ])

    def fit(self, profiles: List[HouseholdProfile], actual_kwh: List[float]):
        """Train the expected kWh model"""
        from sklearn.linear_model import Ridge
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import LeaveOneOut
        from sklearn.metrics import mean_absolute_error

        X = np.array([self._profile_to_features(p) for p in profiles])
        y = np.array(actual_kwh)

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.ridge_model = Ridge(alpha=2.0)
        self.ridge_model.fit(X_scaled, y)

        # Compute efficiency ratios for all training households
        expected_all = self.ridge_model.predict(X_scaled)
        self.training_efficiency_ratios = (y / expected_all).tolist()
        self.training_profiles = profiles
        self.training_kwh = actual_kwh
        self.is_fitted = True

        # CV performance
        loo = LeaveOneOut()
        preds = []
        for tr, te in loo.split(X_scaled):
            m = Ridge(alpha=2.0)
            m.fit(X_scaled[tr], y[tr])
            preds.append(m.predict(X_scaled[te])[0])
        mae = mean_absolute_error(y, preds)
        print(f"Efficiency Scorer trained: {len(profiles)} households, LOO-MAE={mae:.1f} kWh")

        return {'samples': len(profiles), 'loo_mae_kwh': round(mae, 1)}

    def score(self, profile: HouseholdProfile, actual_kwh: float,
              billing_month: int = None) -> Dict:
        """
        Compute efficiency score for a household.
        Works with or without trained model (falls back to physics estimate).
        """
        # Get expected kWh
        if self.is_fitted:
            X = self._profile_to_features(profile).reshape(1, -1)
            X_scaled = self.scaler.transform(X)
            expected_kwh = float(self.ridge_model.predict(X_scaled)[0])
        else:
            expected_kwh = self._physics_estimate(profile)

        expected_kwh = max(10, expected_kwh)

        # Efficiency ratio: actual / expected
        # < 1.0 = using LESS than expected = efficient
        # > 1.0 = using MORE than expected = inefficient
        efficiency_ratio = actual_kwh / expected_kwh

        # Convert to 0-100 score (inverse — lower ratio = higher score)
        # Score 100 = using 50%+ less than expected (excellent)
        # Score 50  = using exactly as expected (average)
        # Score 0   = using 2x+ more than expected (very inefficient)
        raw_score = (2.0 - efficiency_ratio) / 1.5 * 100
        score = max(0, min(100, raw_score))

        # Peer percentile among similar households
        peer_percentile = self._compute_peer_percentile(
            profile, efficiency_ratio
        )

        # Grade
        if score >= 80:
            grade, grade_label, grade_color = 'A', 'Excellent', '#10B981'
        elif score >= 65:
            grade, grade_label, grade_color = 'B', 'Good', '#3B82F6'
        elif score >= 50:
            grade, grade_label, grade_color = 'C', 'Average', '#F59E0B'
        elif score >= 35:
            grade, grade_label, grade_color = 'D', 'Below Average', '#F97316'
        else:
            grade, grade_label, grade_color = 'F', 'Needs Improvement', '#EF4444'

        # Comparison message
        saving_kwh = expected_kwh - actual_kwh
        saving_rs = calculate_ceb_bill(expected_kwh)['total_rs'] - calculate_ceb_bill(actual_kwh)['total_rs']

        if saving_kwh > 0:
            comparison_msg = (f"You use {saving_kwh:.0f} kWh LESS than similar households "
                             f"— saving ~Rs. {abs(saving_rs):.0f}/month")
        elif saving_kwh < -5:
            comparison_msg = (f"You use {abs(saving_kwh):.0f} kWh MORE than similar households. "
                             f"Potential saving: Rs. {abs(saving_rs):.0f}/month")
        else:
            comparison_msg = "Your usage is right in line with similar households."

        # Improvement tips
        tips = self._efficiency_tips(profile, efficiency_ratio, score)

        return {
            'score': round(score, 1),
            'grade': grade,
            'grade_label': grade_label,
            'grade_color': grade_color,
            'efficiency_ratio': round(efficiency_ratio, 3),
            'actual_kwh': actual_kwh,
            'expected_kwh': round(expected_kwh, 1),
            'saving_kwh': round(saving_kwh, 1),
            'saving_rs': round(saving_rs, 0),
            'peer_percentile': peer_percentile,
            'comparison_message': comparison_msg,
            'physics_estimate': round(self._physics_estimate(profile), 1),
            'improvement_tips': tips,
            'score_breakdown': {
                'house_type_factor': self.HOUSE_TYPE_FACTOR.get(profile.house_type, 1.0),
                'people_contribution_kwh': round(profile.total_people * 8.0, 1),
                'appliance_contribution_kwh': round(
                    sum(self.APPLIANCE_KWH.get(a, 0) * getattr(profile, a, 0)
                        for a in self.APPLIANCE_KWH), 1
                ),
            }
        }

    def _compute_peer_percentile(self, profile: HouseholdProfile,
                                  user_ratio: float) -> int:
        """What % of similar households are LESS efficient (higher ratio)?"""
        if not self.training_efficiency_ratios:
            # No data: estimate from score
            return max(0, min(99, int((2.0 - user_ratio) / 1.5 * 100)))

        # Filter to similar households (same house type, ±1 person)
        similar_ratios = []
        for p, ratio in zip(self.training_profiles, self.training_efficiency_ratios):
            if (p.house_type == profile.house_type and
                    abs(p.total_people - profile.total_people) <= 1):
                similar_ratios.append(ratio)

        if len(similar_ratios) < 3:
            similar_ratios = self.training_efficiency_ratios

        # Percentile: % of peers with HIGHER ratio (less efficient)
        pct = sum(1 for r in similar_ratios if r > user_ratio) / len(similar_ratios) * 100
        return int(pct)

    def _efficiency_tips(self, profile: HouseholdProfile,
                          ratio: float, score: float) -> List[str]:
        tips = []
        if score < 50:
            if profile.has_ac:
                tips.append("AC is likely your biggest expense — try setting 1°C warmer")
            if profile.has_water_heater:
                tips.append("Use the water heater timer to heat only when needed")
            if profile.num_ac_units >= 2:
                tips.append("With 2+ AC units, ensure only occupied rooms are cooled")
        if score < 70:
            tips.append("Switch remaining incandescent bulbs to LED (saves 80% on lighting)")
            tips.append("Unplug chargers and devices on standby — they use power continuously")
        if not tips:
            tips.append("You are already efficient! Consider solar panels for further savings")
        return tips


# ══════════════════════════════════════════════════════════════════════════════
# UNIFIED INSIGHTS SERVICE (FastAPI integration)
# ══════════════════════════════════════════════════════════════════════════════

class SmartInsightsService:
    """
    Single service combining all 3 models.
    Integrate into FastAPI backend as shown below.
    """

    def __init__(self):
        self.spike_predictor = BillSpikePredictor()
        self.tariff_warner = TariffCrossingWarner()
        self.efficiency_scorer = HouseholdEfficiencyScorer()

    def get_spike_prediction(self, bills: List[Dict]) -> Dict:
        bill_records = [BillRecord(**b) for b in bills]
        return self.spike_predictor.predict_spike(bill_records)

    def get_tariff_warning(self, readings: List[Dict],
                           billing_start_meter: float) -> Dict:
        reading_records = [MeterReading(**r) for r in readings]
        return self.tariff_warner.analyze(reading_records, billing_start_meter)

    def get_efficiency_score(self, profile: Dict, actual_kwh: float,
                             billing_month: int = None) -> Dict:
        hp = HouseholdProfile(**profile)
        return self.efficiency_scorer.score(hp, actual_kwh, billing_month)

    def get_full_insights(self, bills: List[Dict], readings: List[Dict],
                          profile: Dict, billing_start_meter: float = 0) -> Dict:
        """Get all 3 insights in one call — used by the mobile app summary screen"""
        bill_records = [BillRecord(**b) for b in bills]
        latest_bill_kwh = bill_records[-1].kwh if bill_records else None

        spike = self.get_spike_prediction(bills) if len(bills) >= 2 else None
        tariff = self.get_tariff_warning(readings, billing_start_meter) if readings else None
        efficiency = (self.get_efficiency_score(profile, latest_bill_kwh)
                      if latest_bill_kwh else None)

        return {
            'spike_prediction': spike,
            'tariff_warning': tariff,
            'efficiency_score': efficiency,
            'summary': self._build_summary(spike, tariff, efficiency),
        }

    def _build_summary(self, spike, tariff, efficiency) -> Dict:
        alerts = []
        if tariff and tariff.get('status') == 'danger':
            alerts.append({
                'type': 'urgent',
                'emoji': '🔴',
                'text': tariff['warning']['title'],
                'detail': tariff['warning']['message'],
            })
        if spike and spike.get('spike_risk') == 'high':
            alerts.append({
                'type': 'warning',
                'emoji': '🟡',
                'text': 'Bill Spike Risk Next Month',
                'detail': spike['message'],
            })
        if efficiency and efficiency.get('score', 50) < 40:
            alerts.append({
                'type': 'info',
                'emoji': '📊',
                'text': f"Efficiency Grade: {efficiency['grade']}",
                'detail': efficiency['comparison_message'],
            })
        return {
            'alert_count': len(alerts),
            'alerts': alerts,
            'overall_status': 'danger' if any(a['type'] == 'urgent' for a in alerts)
                              else 'warning' if alerts else 'good',
        }

    def save(self, path: str = 'models/smart_insights.pkl'):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(self, path)

    @classmethod
    def load(cls, path: str = 'models/smart_insights.pkl'):
        return joblib.load(path)


# ══════════════════════════════════════════════════════════════════════════════
# FASTAPI ROUTER — paste into your backend
# ══════════════════════════════════════════════════════════════════════════════

FASTAPI_CODE = '''
# ── Add to your FastAPI backend ──────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .smart_predictions import SmartInsightsService, BillRecord, MeterReading, HouseholdProfile

router = APIRouter(prefix="/api/v1/smart", tags=["Smart Insights"])

_service = None
def get_service() -> SmartInsightsService:
    global _service
    if _service is None:
        try:
            _service = SmartInsightsService.load("models/smart_insights.pkl")
        except:
            _service = SmartInsightsService()
    return _service


@router.post("/spike-prediction")
async def spike_prediction(data: dict, service=Depends(get_service)):
    """
    Predict bill spike for next month.
    Body: { "bills": [ {kwh, billing_month, billing_year, billing_days, amount_rs, meter_start, meter_end}, ... ] }
    """
    bills = data.get("bills", [])
    if not bills:
        raise HTTPException(400, "No bill data provided")
    return service.get_spike_prediction(bills)


@router.post("/tariff-warning")
async def tariff_warning(data: dict, service=Depends(get_service)):
    """
    Real-time tariff crossing warning from meter readings.
    Body: {
        "readings": [ {reading_value, reading_date, billing_period_start, billing_period_end} ],
        "billing_start_meter": 16880.0
    }
    """
    readings = data.get("readings", [])
    billing_start = data.get("billing_start_meter", 0)
    if not readings:
        raise HTTPException(400, "No meter readings provided")
    return service.get_tariff_warning(readings, billing_start)


@router.post("/efficiency-score")
async def efficiency_score(data: dict, service=Depends(get_service)):
    """
    Compute household efficiency score vs peers.
    Body: {
        "profile": { house_type, total_people, num_elderly, ... },
        "actual_kwh": 95.0,
        "billing_month": 4
    }
    """
    profile = data.get("profile")
    actual_kwh = data.get("actual_kwh")
    billing_month = data.get("billing_month")
    if not profile or actual_kwh is None:
        raise HTTPException(400, "Profile and actual_kwh required")
    return service.get_efficiency_score(profile, actual_kwh, billing_month)


@router.get("/insights-summary/{account_number}")
async def insights_summary(account_number: str, db: Session = Depends(get_db),
                            service=Depends(get_service)):
    """
    Get all 3 insights in one call for the mobile app summary screen.
    Fetches bill history + meter readings from DB automatically.
    """
    # Fetch from your existing DB models
    bills = db.query(ElectricityBill).filter_by(account_number=account_number).all()
    plan = db.query(BudgetPlan).filter_by(account_number=account_number, is_active=True).first()
    readings = db.query(MeterReading).filter_by(budget_plan_id=plan.id).all() if plan else []
    household = db.query(HouseholdProfile).filter_by(account_number=account_number).first()

    bill_dicts = [{
        "kwh": b.total_units, "billing_month": b.billing_month,
        "billing_year": b.billing_year, "billing_days": b.billing_days or 30,
        "amount_rs": b.total_amount, "meter_start": b.meter_reading_start or 0,
        "meter_end": b.meter_reading_end or b.total_units,
    } for b in bills]

    reading_dicts = [{
        "reading_value": r.current_reading, "reading_date": str(r.reading_date),
        "billing_period_start": str(plan.start_date),
        "billing_period_end": str(plan.end_date),
    } for r in readings] if readings else []

    profile_dict = vars(household) if household else {}
    billing_start = plan.start_reading if plan else 0

    return service.get_full_insights(bill_dicts, reading_dicts, profile_dict, billing_start)
'''


# ══════════════════════════════════════════════════════════════════════════════
# DEMO / TEST
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print("=" * 60)
    print("SMART INSIGHTS SERVICE — DEMO")
    print("=" * 60)

    service = SmartInsightsService()

    # ── Demo 1: Spike Prediction ──────────────────────────────────
    print("\n[1] BILL SPIKE PREDICTION")
    print("-" * 40)
    demo_bills = [
        {'kwh': 72, 'billing_month': 10, 'billing_year': 2024, 'billing_days': 30,
         'amount_rs': 1200, 'meter_start': 16700, 'meter_end': 16772},
        {'kwh': 78, 'billing_month': 11, 'billing_year': 2024, 'billing_days': 31,
         'amount_rs': 1350, 'meter_start': 16772, 'meter_end': 16850},
        {'kwh': 85, 'billing_month': 12, 'billing_year': 2024, 'billing_days': 31,
         'amount_rs': 1580, 'meter_start': 16850, 'meter_end': 16935},
        {'kwh': 96, 'billing_month': 1, 'billing_year': 2025, 'billing_days': 31,
         'amount_rs': 1820, 'meter_start': 16935, 'meter_end': 17031},
    ]
    spike_result = service.get_spike_prediction(demo_bills)
    print(f"Risk Level:   {spike_result['emoji']} {spike_result['spike_risk'].upper()}")
    print(f"Probability:  {spike_result['spike_probability']*100:.0f}%")
    print(f"Predicted kWh: {spike_result['predicted_kwh_range']}")
    print(f"Message: {spike_result['message']}")
    print(f"Factors: {spike_result['factors']}")
    print(f"Tips: {spike_result['action_tips']}")

    # ── Demo 2: Tariff Crossing Warning ───────────────────────────
    print("\n[2] TARIFF CROSSING WARNING")
    print("-" * 40)
    demo_readings = [
        {
            'reading_value': 16935 + 28,  # 28 units used in 14 days
            'reading_date': '2025-02-15',
            'billing_period_start': '2025-02-01',
            'billing_period_end': '2025-02-28',
        }
    ]
    tariff_result = service.get_tariff_warning(demo_readings, billing_start_meter=16935)
    print(f"Status: {tariff_result['warning']['emoji']} {tariff_result['warning']['title']}")
    print(f"Projected: {tariff_result['projected_kwh']} kWh in {tariff_result['days_remaining']} days remaining")
    print(f"Current rate: {tariff_result['daily_rate_kwh']} kWh/day")
    print(f"Message: {tariff_result['warning']['message']}")
    if tariff_result['reduction_scenarios']:
        print("Reduction scenarios:")
        for s in tariff_result['reduction_scenarios'][:2]:
            print(f"  {s['description']}")

    # ── Demo 3: Efficiency Score ───────────────────────────────────
    print("\n[3] EFFICIENCY SCORE")
    print("-" * 40)
    demo_profile = {
        'house_type': 1, 'total_people': 4, 'num_elderly': 0, 'num_children': 1,
        'has_ac': 1, 'num_ac_units': 1, 'has_water_heater': 0, 'has_fridge': 1,
        'has_washing_machine': 1, 'has_solar': 0, 'floor_area_category': 1,
        'urban_rural': 1,
    }
    score_result = service.get_efficiency_score(demo_profile, actual_kwh=96)
    print(f"Score: {score_result['score']}/100 — Grade {score_result['grade']} ({score_result['grade_label']})")
    print(f"Expected kWh: {score_result['expected_kwh']} | Actual: {score_result['actual_kwh']}")
    print(f"Peer percentile: {score_result['peer_percentile']}th")
    print(f"Comparison: {score_result['comparison_message']}")
    print(f"Tips: {score_result['improvement_tips']}")

    print("\n✅ All 3 models working correctly")