"""
services/bill_analysis.py
FIXED: Uses total_charge instead of total_due throughout
Uses correct CEB tariff rates from October 2025
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from src.services.tariff_calculator import CEBTariffCalculator

import math


class CEBTariffCalculator:
    """CEB Domestic Tariff Calculator - October 2025 Rates"""
    
    # Correct tariff slabs based on actual CEB bill
    TARIFF_SLABS = [
        {'min': 0, 'max': 60, 'rate': 12.75},
        {'min': 61, 'max': 90, 'rate': 18.50},
        {'min': 91, 'max': 120, 'rate': 27.75},
        {'min': 121, 'max': 180, 'rate': 32.50},
        {'min': 181, 'max': float('inf'), 'rate': 45.00}
    ]
    
    # Fixed charges based on consumption
    FIXED_CHARGE_SLABS = [
        {'min': 0, 'max': 60, 'charge': 200.00},
        {'min': 61, 'max': float('inf'), 'charge': 400.00}
    ]
    
    SSCL_RATE = 0.025  # 2.5%
    
    def calculate_bill(self, units: int, billing_days: int = 30) -> Dict:
        """Calculate electricity bill with detailed breakdown"""
        
        # Normalize to 30 days for tariff calculation
        normalized_units = (units / billing_days) * 30
        
        # Calculate unit charges
        unit_charge = 0.0
        breakdown = []
        remaining_units = normalized_units
        
        for slab in self.TARIFF_SLABS:
            if remaining_units <= 0:
                break
            
            slab_min = slab['min']
            slab_max = slab['max']
            
            # Calculate units in this slab
            if normalized_units < slab_min:
                continue
            
            units_in_slab = 0
            if slab_max == float('inf'):
                units_in_slab = max(0, normalized_units - slab_min + 1)
            else:
                if normalized_units <= slab_max:
                    units_in_slab = min(remaining_units, normalized_units - slab_min + 1)
                else:
                    units_in_slab = slab_max - slab_min + 1
            
            amount = units_in_slab * slab['rate']
            unit_charge += amount
            
            breakdown.append({
                'block': f"{slab_min}-{int(slab_max) if slab_max != float('inf') else '∞'} kWh",
                'units': round(units_in_slab, 2),
                'rate': slab['rate'],
                'amount': round(amount, 2)
            })
            
            remaining_units -= units_in_slab
        
        # Get fixed charge based on normalized units
        fixed_charge = self._get_fixed_charge(normalized_units)
        
        # Calculate subtotal and tax
        subtotal = unit_charge + fixed_charge
        sscl = subtotal * self.SSCL_RATE
        total = subtotal + sscl
        
        return {
            'category': 2 if normalized_units > 60 else 1,
            'energy_charge': round(unit_charge, 2),
            'fixed_charge': fixed_charge,
            'subtotal': round(subtotal, 2),
            'sscl': round(sscl, 2),
            'total': round(total, 2),
            'breakdown': breakdown,
            'billing_days': billing_days,
            'units_consumed': units,
            'normalized_units': round(normalized_units, 2)
        }
    
    def _get_fixed_charge(self, units: float) -> float:
        """Get fixed charge based on consumption"""
        for slab in self.FIXED_CHARGE_SLABS:
            if slab['min'] <= units <= slab['max']:
                return slab['charge']
        return self.FIXED_CHARGE_SLABS[-1]['charge']


class BillAnalysisService:
    """Analyze past bills and create consumption insights"""
    
    # def __init__(self):
    #     self.tariff_calculator = CEBTariffCalculator()
    def __init__(self):
        self.tariff_calculator = CEBTariffCalculator()
    
    def analyze_past_month(self, bill_data: Dict) -> Dict:
        """
        Comprehensive analysis of past month bill
        
        Args:
            bill_data: Dictionary containing bill information
                - units_consumed: int
                - billing_period_days: int
                - total_charge: float  # ✅ Changed from total_due
                - bill_date: datetime
        
        Returns:
            Detailed analysis including daily/weekly averages and projections
        """
        units = bill_data.get('units_consumed', 0)
        days = bill_data.get('billing_period_days', 30)
        total_paid = bill_data.get('total_charge', 0)  # ✅ Changed from total_due
        
        # Daily analysis
        daily_units = units / days
        daily_cost = total_paid / days
        
        # Weekly analysis
        weekly_units = daily_units * 7
        weekly_cost = daily_cost * 7
        
        # Week-by-week breakdown
        week_breakdown = self._calculate_week_breakdown(
            units, total_paid, days
        )
        
        # Tariff analysis
        tariff_details = self.tariff_calculator.calculate_bill(units, days)
        
        return {
            'summary': {
                'total_units': units,
                'total_cost': round(total_paid, 2),
                'billing_days': days,
                'daily_average_units': round(daily_units, 2),
                'daily_average_cost': round(daily_cost, 2),
                'weekly_average_units': round(weekly_units, 2),
                'weekly_average_cost': round(weekly_cost, 2)
            },
            'week_breakdown': week_breakdown,
            'tariff_details': tariff_details,
            'cost_per_unit': round(total_paid / units, 2) if units > 0 else 0
        }
    
    def _calculate_week_breakdown(
        self, 
        total_units: int, 
        total_cost: float, 
        days: int
    ) -> List[Dict]:
        """Calculate week-by-week consumption and cost"""
        daily_units = total_units / days
        daily_cost = total_cost / days
        
        weeks = []
        current_day = 0
        week_number = 1
        
        while current_day < days:
            week_days = min(7, days - current_day)
            week_units = daily_units * week_days
            week_cost = daily_cost * week_days
            
            weeks.append({
                'week': week_number,
                'days': week_days,
                'units': round(week_units, 2),
                'cost': round(week_cost, 2),
                'daily_avg_units': round(daily_units, 2),
                'daily_avg_cost': round(daily_cost, 2)
            })
            
            current_day += week_days
            week_number += 1
        
        return weeks
    
    def create_budget_plan(
        self, 
        past_bill_data: Dict, 
        target_budget: float,
        planning_days: int = 30
    ) -> Dict:
        """
        Create a roadmap plan for next billing period
        
        Args:
            past_bill_data: Past month bill analysis
            target_budget: User's budget for next period (Rs.)
            planning_days: Number of days to plan for (28-35)
        
        Returns:
            Detailed plan with daily/weekly targets and alerts
        """
        # ✅ Changed from total_due to total_charge
        past_cost = past_bill_data.get('total_charge', 0)
        min_budget = past_cost * 0.5
        max_budget = past_cost * 1.5
        
        if target_budget < min_budget or target_budget > max_budget:
            return {
                'error': 'Invalid budget',
                'message': f'Budget must be between Rs. {min_budget:.2f} and Rs. {max_budget:.2f}',
                'min_budget': round(min_budget, 2),
                'max_budget': round(max_budget, 2)
            }
        
        # Calculate target daily and weekly consumption
        past_daily_cost = past_cost / past_bill_data.get('billing_period_days', 30)
        target_daily_cost = target_budget / planning_days
        target_weekly_cost = target_daily_cost * 7
        
        # Estimate units based on past cost per unit
        past_units = past_bill_data.get('units_consumed', 0)
        cost_per_unit = past_cost / past_units if past_units > 0 else 0
        
        target_daily_units = target_daily_cost / cost_per_unit if cost_per_unit > 0 else 0
        target_weekly_units = target_daily_units * 7
        target_total_units = target_daily_units * planning_days
        
        # Calculate using tariff for accuracy
        tariff_calc = self.tariff_calculator.calculate_bill(
            int(target_total_units), planning_days
        )
        
        # Create monitoring schedule
        monitoring_schedule = self._create_monitoring_schedule(planning_days)
        
        # Week-by-week targets
        weekly_targets = self._create_weekly_targets(
            target_daily_units, target_daily_cost, planning_days
        )
        
        return {
            'budget_info': {
                'target_budget': round(target_budget, 2),
                'past_bill': round(past_cost, 2),
                'savings_target': round(past_cost - target_budget, 2),
                'percentage_change': round(((target_budget - past_cost) / past_cost) * 100, 2)
            },
            'daily_targets': {
                'units': round(target_daily_units, 2),
                'cost': round(target_daily_cost, 2)
            },
            'weekly_targets': weekly_targets,
            'total_targets': {
                'units': round(target_total_units, 2),
                'cost': round(tariff_calc['total'], 2),
                'days': planning_days
            },
            'monitoring_schedule': monitoring_schedule,
            'tariff_projection': tariff_calc,
            'recommendations': self._generate_recommendations(
                past_bill_data, target_budget, planning_days
            )
        }
    
    def _create_monitoring_schedule(self, days: int) -> List[Dict]:
        """Create schedule for meter reading checks"""
        interval = 4
        schedule = []
        
        for day in range(interval, days + 1, interval):
            schedule.append({
                'day': day,
                'action': 'Check meter reading',
                'purpose': 'Track if consumption is on target'
            })
        
        return schedule
    
    def _create_weekly_targets(
        self, 
        daily_units: float, 
        daily_cost: float, 
        total_days: int
    ) -> List[Dict]:
        """Create week-by-week targets"""
        weeks = []
        current_day = 0
        week_number = 1
        
        while current_day < total_days:
            week_days = min(7, total_days - current_day)
            
            weeks.append({
                'week': week_number,
                'days': week_days,
                'target_units': round(daily_units * week_days, 2),
                'target_cost': round(daily_cost * week_days, 2),
                'cumulative_units': round(daily_units * (current_day + week_days), 2),
                'cumulative_cost': round(daily_cost * (current_day + week_days), 2)
            })
            
            current_day += week_days
            week_number += 1
        
        return weeks
    
    def _generate_recommendations(
        self, 
        past_data: Dict, 
        budget: float, 
        days: int
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        past_cost = past_data.get('total_charge', 0)  # ✅ Changed
        
        if budget < past_cost:
            reduction_needed = past_cost - budget
            percentage = (reduction_needed / past_cost) * 100
            recommendations.append(
                f"You need to reduce consumption by {percentage:.1f}% "
                f"(Rs. {reduction_needed:.2f}) to meet your budget"
            )
        
        # Threshold awareness
        past_units = past_data.get('units_consumed', 0)
        past_days = past_data.get('billing_period_days', 30)
        adjusted_threshold = 60 * (days / 30)
        
        if past_units > adjusted_threshold:
            recommendations.append(
                f"You exceeded the 60 kWh threshold (adjusted: {adjusted_threshold:.0f} kWh). "
                "Staying below this threshold can save on tariff rates"
            )
        
        recommendations.append(
            "Monitor your meter reading every 4-5 days to stay on track"
        )
        
        return recommendations
    
    def track_progress(
        self, 
        plan_data: Dict, 
        current_reading: int,
        reading_date: datetime,
        start_reading: int,
        start_date: datetime
    ) -> Dict:
        """
        Track progress against the plan
        """
        # Calculate actual consumption
        units_used = current_reading - start_reading
        days_elapsed = (reading_date - start_date).days
        
        # Calculate expected consumption
        daily_target = plan_data['daily_targets']['units']
        expected_units = daily_target * days_elapsed
        
        # Calculate costs
        actual_cost = self.tariff_calculator.calculate_bill(
            units_used, days_elapsed
        )['total']
        
        expected_cost = plan_data['daily_targets']['cost'] * days_elapsed
        
        # Status determination
        variance_units = units_used - expected_units
        variance_cost = actual_cost - expected_cost
        
        status = 'on_track'
        if variance_cost > expected_cost * 0.1:
            status = 'over_budget'
        elif variance_cost < -expected_cost * 0.1:
            status = 'under_budget'
        
        # Projection
        planning_days = plan_data['total_targets']['days']
        days_remaining = planning_days - days_elapsed
        
        if days_remaining > 0:
            daily_rate = units_used / days_elapsed if days_elapsed > 0 else 0
            projected_total_units = units_used + (daily_rate * days_remaining)
            projected_total_cost = self.tariff_calculator.calculate_bill(
                int(projected_total_units), planning_days
            )['total']
        else:
            projected_total_units = units_used
            projected_total_cost = actual_cost
        
        return {
            'current_status': {
                'days_elapsed': days_elapsed,
                'days_remaining': days_remaining,
                'units_used': units_used,
                'actual_cost': round(actual_cost, 2),
                'expected_units': round(expected_units, 2),
                'expected_cost': round(expected_cost, 2),
                'variance_units': round(variance_units, 2),
                'variance_cost': round(variance_cost, 2),
                'status': status
            },
            'projection': {
                'projected_total_units': round(projected_total_units, 2),
                'projected_total_cost': round(projected_total_cost, 2),
                'target_budget': plan_data['budget_info']['target_budget'],
                'budget_variance': round(
                    projected_total_cost - plan_data['budget_info']['target_budget'], 2
                )
            },
            'recommendations': self._get_tracking_recommendations(
                status, days_remaining, variance_cost, 
                plan_data['budget_info']['target_budget'], projected_total_cost
            )
        }
    
    def _get_tracking_recommendations(
        self, 
        status: str, 
        days_remaining: int,
        variance: float,
        target_budget: float,
        projected_cost: float
    ) -> List[str]:
        """Generate recommendations based on tracking"""
        recs = []
        
        if status == 'over_budget':
            daily_reduction_needed = variance / days_remaining if days_remaining > 0 else 0
            recs.append(
                f"⚠️ You're over budget! Reduce daily spending by "
                f"Rs. {daily_reduction_needed:.2f} to stay on track"
            )
        elif status == 'under_budget':
            recs.append("✅ Great! You're under budget. Keep up the good work!")
        else:
            recs.append("✓ You're on track with your budget plan")
        
        if projected_cost > target_budget:
            excess = projected_cost - target_budget
            recs.append(
                f"Warning: Current usage projects Rs. {excess:.2f} over budget"
            )
        
        return recs