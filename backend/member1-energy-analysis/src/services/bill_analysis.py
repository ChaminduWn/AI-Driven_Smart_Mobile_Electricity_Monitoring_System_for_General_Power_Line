"""
services/bill_analysis.py
Advanced bill analysis service for consumption patterns and planning
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import math


class CEBTariffCalculator:
    """CEB Domestic Tariff Calculator based on official rates"""
    
    # Category 1: 0-60 kWh (adjusted for billing period)
    CATEGORY_1_RATES = [
        {'min': 0, 'max': 60, 'rate': 4.50},
        {'min': 61, 'max': 90, 'rate': 8.00}
    ]
    
    # Category 2: Above 60 kWh threshold (adjusted)
    CATEGORY_2_RATES = [
        {'min': 0, 'max': 60, 'rate': 12.75},
        {'min': 61, 'max': 90, 'rate': 18.50},
        {'min': 91, 'max': 120, 'rate': 27.75},
        {'min': 121, 'max': 180, 'rate': 32.00},
        {'min': 181, 'max': float('inf'), 'rate': 45.00}
    ]
    
    # Fixed charges (NOT adjusted for billing period)
    FIXED_CHARGES = {
        (0, 30): 0,
        (31, 60): 200,
        (61, 90): 400,
        (91, 120): 750,
        (121, 180): 1500,
        (181, float('inf')): 2000
    }
    
    SSCL_RATE = 0.025  # 2.5%
    STANDARD_BILLING_DAYS = 30
    
    def calculate_bill(self, units: int, billing_days: int = 30) -> Dict:
        """Calculate electricity bill with detailed breakdown"""
        
        # Step 1: Adjust thresholds for billing period
        adjustment_factor = billing_days / self.STANDARD_BILLING_DAYS
        adjusted_threshold = 60 * adjustment_factor
        
        # Step 2: Determine category
        category = 2 if units > adjusted_threshold else 1
        rates = self.CATEGORY_2_RATES if category == 2 else self.CATEGORY_1_RATES
        
        # Step 3: Calculate energy charges
        energy_charge = 0
        breakdown = []
        remaining_units = units
        
        for block in rates:
            block_min = math.ceil(block['min'] * adjustment_factor)
            block_max = math.ceil(block['max'] * adjustment_factor)
            
            if remaining_units <= 0:
                break
                
            units_in_block = min(remaining_units, block_max - block_min + 1)
            if block_min == 0:
                units_in_block = min(remaining_units, block_max)
            
            charge = units_in_block * block['rate']
            energy_charge += charge
            
            breakdown.append({
                'block': f"{block_min}-{block_max} kWh",
                'units': units_in_block,
                'rate': block['rate'],
                'amount': round(charge, 2)
            })
            
            remaining_units -= units_in_block
        
        # Step 4: Get fixed charge (NOT adjusted)
        fixed_charge = self._get_fixed_charge(units)
        
        # Step 5: Calculate subtotal
        subtotal = energy_charge + fixed_charge
        
        # Step 6: Apply SSCL
        sscl = subtotal * self.SSCL_RATE
        
        # Final total
        total = subtotal + sscl
        
        return {
            'category': category,
            'energy_charge': round(energy_charge, 2),
            'fixed_charge': fixed_charge,
            'subtotal': round(subtotal, 2),
            'sscl': round(sscl, 2),
            'total': round(total, 2),
            'breakdown': breakdown,
            'billing_days': billing_days,
            'adjustment_factor': round(adjustment_factor, 4),
            'adjusted_threshold': round(adjusted_threshold, 2)
        }
    
    def _get_fixed_charge(self, units: int) -> float:
        """Get fixed charge based on consumption"""
        for (min_units, max_units), charge in self.FIXED_CHARGES.items():
            if min_units <= units <= max_units:
                return charge
        return 2000  # Maximum fixed charge


class BillAnalysisService:
    """Analyze past bills and create consumption insights"""
    
    def __init__(self):
        self.tariff_calculator = CEBTariffCalculator()
    
    def analyze_past_month(self, bill_data: Dict) -> Dict:
        """
        Comprehensive analysis of past month bill
        
        Args:
            bill_data: Dictionary containing bill information
                - units_consumed: int
                - billing_period_days: int
                - total_due: float
                - bill_date: datetime
                - meter_readings: List[Dict] (optional)
        
        Returns:
            Detailed analysis including daily/weekly averages and projections
        """
        units = bill_data.get('units_consumed', 0)
        days = bill_data.get('billing_period_days', 30)
        total_paid = bill_data.get('total_due', 0)
        
        # Daily analysis
        daily_units = units / days
        daily_cost = total_paid / days
        
        # Weekly analysis
        weekly_units = daily_units * 7
        weekly_cost = daily_cost * 7
        
        # Week-by-week breakdown (assuming 4-5 weeks)
        weeks_in_period = days / 7
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
        # Validate budget (must be 50% - 150% of past bill)
        past_cost = past_bill_data.get('total_due', 0)
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
        
        # Create monitoring schedule (every 4-5 days)
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
        interval = 4  # Check every 4-5 days
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
        past_cost = past_data.get('total_due', 0)
        
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
                "Staying below this threshold can save ~Rs. 800+"
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
        
        Args:
            plan_data: The budget plan created earlier
            current_reading: Current meter reading
            reading_date: Date of current reading
            start_reading: Starting meter reading
            start_date: Bill start date
        
        Returns:
            Progress analysis with status and recommendations
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
        if variance_cost > expected_cost * 0.1:  # 10% over
            status = 'over_budget'
        elif variance_cost < -expected_cost * 0.1:  # 10% under
            status = 'under_budget'
        
        # Projection for remaining days
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