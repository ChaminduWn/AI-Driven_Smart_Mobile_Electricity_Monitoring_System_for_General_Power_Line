from typing import Dict, Tuple
from sqlalchemy.orm import Session
from src.models.tariff import CEBTariff
from datetime import datetime


class TariffCalculator:
    """Calculate electricity costs using CEB tariff structure"""
    
    def __init__(self, db: Session):
        self.db = db
        self.tariff_data = self._get_active_tariff()
    
    def _get_active_tariff(self) -> Dict:
        """Get currently active CEB tariff"""
        tariff = self.db.query(CEBTariff).filter(
            CEBTariff.is_active == True,
            CEBTariff.category == "Domestic"
        ).first()
        
        if tariff:
            return tariff.tariff_structure
        
        # Return October 2025 tariff as default
        return self._get_oct_2025_tariff()
    
    def _get_oct_2025_tariff(self) -> Dict:
        """CEB October 2025 Domestic Tariff"""
        return {
            "low_consumption": {
                "threshold": 60,
                "tiers": [
                    {"min": 0, "max": 30, "rate": 4.50, "fixed_charge": 80.00},
                    {"min": 31, "max": 60, "rate": 8.00, "fixed_charge": 210.00}
                ]
            },
            "normal_consumption": {
                "tiers": [
                    {"min": 0, "max": 60, "rate": 12.75, "fixed_charge": 400.00},
                    {"min": 61, "max": 90, "rate": 18.50, "fixed_charge": 400.00},
                    {"min": 91, "max": 120, "rate": 24.00, "fixed_charge": 1000.00},
                    {"min": 121, "max": 180, "rate": 41.00, "fixed_charge": 1500.00},
                    {"min": 181, "max": None, "rate": 61.00, "fixed_charge": 2100.00}
                ]
            },
            "sscl_rate": 0.025  # 2.5% SSCL tax
        }
    
    def calculate_cost(self, units: float) -> Dict[str, float]:
        """
        Calculate total cost for given units
        
        Args:
            units: Total electricity units consumed
            
        Returns:
            {
                'unit_charge': float,
                'fixed_charge': float,
                'subtotal': float,
                'sscl_tax': float,  # 2.5%
                'total_cost': float,
                'effective_rate': float  # per kWh
            }
        """
        tariff = self.tariff_data
        
        # Determine which category
        if units <= tariff["low_consumption"]["threshold"]:
            # Low consumption (0-60 kWh)
            result = self._calculate_low_consumption(units, tariff)
        else:
            # Normal consumption (above 60 kWh)
            result = self._calculate_normal_consumption(units, tariff)
        
        # Add SSCL tax (2.5%)
        sscl_rate = tariff.get("sscl_rate", 0.025)
        subtotal = result['unit_charge'] + result['fixed_charge']
        sscl_tax = subtotal * sscl_rate
        total_cost = subtotal + sscl_tax
        
        return {
            'unit_charge': round(result['unit_charge'], 2),
            'fixed_charge': result['fixed_charge'],
            'subtotal': round(subtotal, 2),
            'sscl_tax': round(sscl_tax, 2),
            'total_cost': round(total_cost, 2),
            'effective_rate': round(total_cost / units if units > 0 else 0, 2),
            'tier_breakdown': result.get('tier_breakdown', [])
        }
    
    def _calculate_low_consumption(self, units: float, tariff: Dict) -> Dict:
        """Calculate for 0-60 kWh consumption"""
        tiers = tariff["low_consumption"]["tiers"]
        unit_charge = 0.0
        fixed_charge = 0.0
        tier_breakdown = []
        remaining_units = units
        
        for tier in tiers:
            if remaining_units <= 0:
                break
            
            tier_min = tier['min']
            tier_max = tier['max']
            rate = tier['rate']
            
            # Units in this tier
            tier_units = min(remaining_units, tier_max - tier_min + 1)
            tier_cost = tier_units * rate
            unit_charge += tier_cost
            
            # Fixed charge for this tier
            fixed_charge = tier['fixed_charge']
            
            tier_breakdown.append({
                'range': f"{tier_min}-{tier_max} kWh",
                'units': round(tier_units, 2),
                'rate': rate,
                'cost': round(tier_cost, 2)
            })
            
            remaining_units -= tier_units
        
        return {
            'unit_charge': unit_charge,
            'fixed_charge': fixed_charge,
            'tier_breakdown': tier_breakdown
        }
    
    def _calculate_normal_consumption(self, units: float, tariff: Dict) -> Dict:
        """Calculate for above 60 kWh consumption"""
        tiers = tariff["normal_consumption"]["tiers"]
        unit_charge = 0.0
        fixed_charge = 0.0
        tier_breakdown = []
        remaining_units = units
        
        for tier in tiers:
            if remaining_units <= 0:
                break
            
            tier_min = tier['min']
            tier_max = tier['max']
            rate = tier['rate']
            
            # Calculate units in this tier
            if tier_max is None:
                # Last tier (above 180)
                tier_units = remaining_units
            else:
                tier_range = tier_max - tier_min + 1
                tier_units = min(remaining_units, tier_range)
            
            tier_cost = tier_units * rate
            unit_charge += tier_cost
            
            # Update fixed charge (use highest tier reached)
            fixed_charge = tier['fixed_charge']
            
            tier_breakdown.append({
                'range': f"{tier_min}-{tier_max or '∞'} kWh",
                'units': round(tier_units, 2),
                'rate': rate,
                'cost': round(tier_cost, 2)
            })
            
            remaining_units -= tier_units
        
        return {
            'unit_charge': unit_charge,
            'fixed_charge': fixed_charge,
            'tier_breakdown': tier_breakdown
        }
