"""
src/services/recommendation_engine.py
AI-driven appliance recommendation engine
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime
from src.services.nilm_disaggregation import NILMDisaggregationService

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    Analyzes consumption variance and generates actionable appliance-wise tips.
    """
    
    def __init__(self):
        self.nilm_service = NILMDisaggregationService()
        
    def generate_recommendations(
        self, 
        current_status: Dict, 
        projection: Dict, 
        user_appliances: List[Dict],
        account_number: str
    ) -> List[Dict]:
        """
        Main entry point for generating recommendations.
        
        Args:
            current_status: Current progress status (days_elapsed, units_used, etc.)
            projection: Projected total units and cost
            user_appliances: List of appliances for this account
            account_number: Account number for data context
            
        Returns:
            List of recommendation objects with appliance details and reduction targets.
        """
        recommendations = []
        
        # 1. Identify if we are over budget
        variance_units = current_status.get('variance_units', 0)
        status = current_status.get('status', 'on_track')
        
        if status != 'over_budget' and variance_units <= 0:
            return [] # No specific reduction needed if on track
            
        # 2. Get NILM breakdown to see where the energy is going
        # We'll use the current units_used as the basis for disaggregation
        total_kwh = current_status.get('units_used', 0)
        days_elapsed = current_status.get('days_elapsed', 1)
        if days_elapsed == 0: days_elapsed = 1
        
        daily_avg_kwh = total_kwh / days_elapsed
        
        # Disaggregate based on daily average to find typical patterns
        nilm_result = self.nilm_service.disaggregate_daily_consumption(
            total_kwh=daily_avg_kwh,
            date=datetime.now(),
            user_appliances=user_appliances
        )
        
        # 3. Calculate target reduction
        # How much do we need to reduce DAILY to get back to budget?
        days_remaining = projection.get('days_remaining', 30)
        budget_variance = projection.get('budget_variance', 0) # Cost-based variance
        
        if budget_variance <= 0:
            return []
            
        # Estimate units reduction needed based on cost variance (rough estimate)
        # Assuming average rate from NILM or current status
        avg_rate = current_status.get('actual_cost', 0) / total_kwh if total_kwh > 0 else 1.0
        units_reduction_needed = budget_variance / avg_rate if avg_rate > 0 else 0
        daily_units_reduction = units_reduction_needed / days_remaining if days_remaining > 0 else 0
        
        # 4. Filter appliances that have the highest impact and are "reducible"
        breakdown = nilm_result.get('breakdown', [])
        
        # Sort by estimated_kwh (highest first)
        sorted_breakdown = sorted(breakdown, key=lambda x: x.get('estimated_kwh', 0), reverse=True)
        
        for item in sorted_breakdown:
            category = (item.get('category') or '').lower()
            if category == 'unknown': continue
            
            # Simple reducibility heuristic
            # ACs, Heaters, Irons are highly reducible/controllable
            # Refrigerators are less reducible but can be optimized
            reducibility_factor = 0.7 if category in ['cooling', 'heating', 'cooking'] else 0.3
            
            # Potential saving for this appliance
            # We want to distribute the daily_units_reduction across major appliances
            impact_share = item.get('percentage', 0) / 100
            target_appliance_reduction = daily_units_reduction * (impact_share * 2) # Weighted heavily towards larger loads
            
            # Limit reduction to a reasonable amount of the appliance's own consumption
            max_appliance_reduction = item.get('estimated_kwh', 0) * 0.4 # Max 40% reduction
            actual_target_reduction = min(target_appliance_reduction, max_appliance_reduction)
            
            if actual_target_reduction > 0.05: # Only show significant tips
                # Convert kWh to hours for better user understanding
                # Units (kWh) = (Watts * Hours) / 1000  => Hours = (Units * 1000) / Watts
                wattage = 1000 # Default if not known
                for ua in user_appliances:
                    if ua.get('id') == item.get('appliance_id'):
                        wattage = ua.get('wattage', 1000)
                        break
                
                reduction_hours = (actual_target_reduction * 1000) / wattage if wattage > 0 else 0
                
                recommendations.append({
                    'appliance_id': item.get('appliance_id'),
                    'appliance_name': item.get('appliance_name'),
                    'category': item.get('category'),
                    'impact_percentage': item.get('percentage'),
                    'suggested_reduction_kwh': round(actual_target_reduction, 2),
                    'suggested_reduction_hours': round(reduction_hours, 1),
                    'potential_monthly_saving': round(actual_target_reduction * 30 * avg_rate, 2), # Simplified cost estimate
                    'actionable_tip': self._get_actionable_tip(item.get('appliance_name'), reduction_hours)
                })
        
        return recommendations[:4] # Return top 4 most impactful recommendations

    def _get_actionable_tip(self, appliance_name: str, reduction_hours: float) -> str:
        """Generates a human-friendly sentence for the reduction."""
        app_lower = appliance_name.lower()
        hours_str = f"{reduction_hours:.1f}" if reduction_hours >= 1 else f"{int(reduction_hours * 60)} minutes"
        
        if 'air conditioner' in app_lower or 'ac' in app_lower:
            return f"Set a timer to turn off your AC {hours_str} earlier each day."
        elif 'heater' in app_lower or 'geyser' in app_lower:
            return f"Reduce water heater usage by {hours_str} daily for significant savings."
        elif 'fan' in app_lower:
            return f"Turn off {appliance_name} {hours_str} earlier, or switch to a lower speed."
        elif 'iron' in app_lower:
            return f"Try to batch your ironing to reduce usage by ~{hours_str}."
        elif 'refrigerator' in app_lower:
            return f"Optimize temperature settings and minimize door openings to save energy."
        else:
            return f"Reducing usage of {appliance_name} by just {hours_str} per day will meet your goal."
