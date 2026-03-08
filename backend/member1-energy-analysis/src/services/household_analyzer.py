# src/services/household_analyzer.py

class HouseholdPatternAnalyzer:
    """Analyze consumption based on household composition"""
    
    # Average consumption patterns by member type (kWh per day)
    MEMBER_PATTERNS = {
        'male_working': {
            'base': 2.5,
            'peak_hours': [6, 7, 8, 18, 19, 20, 21, 22],
            'appliances': ['tv', 'computer', 'phone_charger']
        },
        'female_working': {
            'base': 3.0,
            'peak_hours': [6, 7, 8, 17, 18, 19, 20, 21],
            'appliances': ['tv', 'iron', 'hair_dryer', 'washing_machine']
        },
        'child_school': {
            'base': 1.5,
            'peak_hours': [15, 16, 17, 18, 19, 20],
            'appliances': ['tv', 'computer', 'phone_charger']
        },
        'elderly_home': {
            'base': 4.0,
            'peak_hours': list(range(6, 23)),  # Home most of day
            'appliances': ['tv', 'fan', 'refrigerator']
        }
    }
    
    def estimate_household_consumption(
        self, 
        members: List[Dict],
        appliances: List[Dict]
    ) -> Dict:
        """Estimate consumption based on household composition"""
        
        # Base consumption from members
        total_member_consumption = 0
        for member in members:
            pattern_key = f"{member['type']}_{member['status']}"
            pattern = self.MEMBER_PATTERNS.get(pattern_key, {'base': 2.0})
            total_member_consumption += pattern['base']
        
        # Appliance consumption
        total_appliance_consumption = sum(a.get('daily_kwh', 0) for a in appliances)
        
        # Synergy factor (shared appliances reduce per-person cost)
        household_size = len(members)
        synergy_factor = 1.0 - (0.05 * min(household_size - 1, 4))  # Max 20% reduction
        
        estimated_daily = (total_member_consumption + total_appliance_consumption) * synergy_factor
        estimated_monthly = estimated_daily * 30
        
        return {
            'estimated_daily_kwh': round(estimated_daily, 2),
            'estimated_monthly_kwh': round(estimated_monthly, 2),
            'member_contribution': round(total_member_consumption, 2),
            'appliance_contribution': round(total_appliance_consumption, 2),
            'household_size': household_size,
            'synergy_factor': synergy_factor
        }