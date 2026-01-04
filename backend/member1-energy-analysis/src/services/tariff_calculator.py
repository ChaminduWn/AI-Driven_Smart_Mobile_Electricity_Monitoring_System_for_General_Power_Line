"""
CEB Domestic Tariff Calculator - OFFICIAL October 2025 Rates
Based on actual CEB tariff document
"""
from typing import Dict, List
from datetime import datetime


class CEBTariffCalculator:
    """
    Calculate electricity costs based on CEB domestic tariff rates
    Official rates from October 15, 2025 tariff revision
    """
    
    # CORRECT DOMESTIC TARIFF RATES (from official PDF)
    # For consumption 0-60 kWh
    LOW_CONSUMPTION_SLABS = [
        {'min': 0, 'max': 30, 'rate': 4.50, 'fixed': 80.00},
        {'min': 31, 'max': 60, 'rate': 8.00, 'fixed': 210.00}
    ]
    
    # For consumption ABOVE 60 kWh
    HIGH_CONSUMPTION_SLABS = [
        {'min': 0, 'max': 60, 'rate': 12.75, 'fixed': 0},      # No separate fixed for this block
        {'min': 61, 'max': 90, 'rate': 18.50, 'fixed': 400.00},
        {'min': 91, 'max': 120, 'rate': 24.00, 'fixed': 1000.00},
        {'min': 121, 'max': 180, 'rate': 41.00, 'fixed': 1500.00},
        {'min': 181, 'max': float('inf'), 'rate': 61.00, 'fixed': 2100.00}
    ]
    
    SSCL_RATE = 0.025  # 2.5% Social Security Contribution Levy
    
    def calculate_bill(self, units: int, days: int = 30) -> Dict:
        """
        Calculate electricity bill based on consumption
        
        Args:
            units: Total units consumed (kWh)
            days: Number of days in billing period
            
        Returns:
            Dictionary with detailed bill breakdown
        """
        
        # Normalize to 30-day period for tariff calculation
        normalized_units = (units / days) * 30
        
        # Determine which tariff structure to use
        if normalized_units <= 60:
            # Use low consumption tariff
            result = self._calculate_low_consumption(normalized_units)
        else:
            # Use high consumption tariff
            result = self._calculate_high_consumption(normalized_units)
        
        # Add metadata
        result['original_units'] = units
        result['original_days'] = days
        result['normalized_units'] = round(normalized_units, 2)
        
        return result
    
    def _calculate_low_consumption(self, units: float) -> Dict:
        """Calculate for consumption <= 60 kWh"""
        energy_charge = 0.0
        fixed_charge = 0.0
        breakdown = []
        
        for slab in self.LOW_CONSUMPTION_SLABS:
            if units <= 0:
                break
            
            # Calculate units in this slab
            units_in_slab = 0
            if units <= slab['max']:
                # All remaining units fit in this slab
                units_in_slab = units - slab['min'] + 1 if units > slab['min'] else units
            else:
                # Fill this slab completely
                units_in_slab = slab['max'] - slab['min'] + 1
            
            # Calculate charge for this slab
            slab_charge = units_in_slab * slab['rate']
            energy_charge += slab_charge
            
            # Fixed charge is for the highest slab reached
            if units >= slab['min']:
                fixed_charge = slab['fixed']
            
            breakdown.append({
                'slab': f"Block: {slab['min']}-{slab['max']} kWh",
                'units': round(units_in_slab, 2),
                'rate': slab['rate'],
                'amount': round(slab_charge, 2)
            })
            
            units -= units_in_slab
        
        subtotal = energy_charge + fixed_charge
        sscl = subtotal * self.SSCL_RATE
        total = subtotal + sscl
        
        return {
            'category': '0-60 kWh (Low Consumption)',
            'energy_charge': round(energy_charge, 2),
            'fixed_charge': round(fixed_charge, 2),
            'subtotal': round(subtotal, 2),
            'sscl': round(sscl, 2),
            'total': round(total, 2),
            'breakdown': breakdown
        }
    
    def _calculate_high_consumption(self, units: float) -> Dict:
        """Calculate for consumption > 60 kWh"""
        energy_charge = 0.0
        fixed_charge = 0.0
        breakdown = []
        remaining_units = units
        
        for slab in self.HIGH_CONSUMPTION_SLABS:
            if remaining_units <= 0:
                break
            
            # Calculate units in this slab
            units_in_slab = 0
            
            if slab['max'] == float('inf'):
                # Last slab - all remaining units
                units_in_slab = remaining_units
            else:
                # Calculate units that fit in this slab
                slab_size = slab['max'] - slab['min'] + 1
                units_in_slab = min(remaining_units, slab_size)
            
            # Only process if there are units in this slab
            if units_in_slab > 0:
                slab_charge = units_in_slab * slab['rate']
                energy_charge += slab_charge
                
                # Fixed charge for the applicable slab
                if units >= slab['min'] and slab['fixed'] > 0:
                    fixed_charge = slab['fixed']
                
                breakdown.append({
                    'slab': f"Block: {slab['min']}-{int(slab['max']) if slab['max'] != float('inf') else '∞'} kWh",
                    'units': round(units_in_slab, 2),
                    'rate': slab['rate'],
                    'amount': round(slab_charge, 2)
                })
                
                remaining_units -= units_in_slab
        
        subtotal = energy_charge + fixed_charge
        sscl = subtotal * self.SSCL_RATE
        total = subtotal + sscl
        
        return {
            'category': 'Above 60 kWh (High Consumption)',
            'energy_charge': round(energy_charge, 2),
            'fixed_charge': round(fixed_charge, 2),
            'subtotal': round(subtotal, 2),
            'sscl': round(sscl, 2),
            'total': round(total, 2),
            'breakdown': breakdown
        }
    
    def verify_bill(self, units: int, days: int, actual_bill_amount: float) -> Dict:
        """
        Verify if calculated bill matches actual bill
        Used for testing and validation
        """
        calculated = self.calculate_bill(units, days)
        difference = abs(calculated['total'] - actual_bill_amount)
        percentage_diff = (difference / actual_bill_amount * 100) if actual_bill_amount > 0 else 0
        
        return {
            'units': units,
            'days': days,
            'calculated_total': calculated['total'],
            'actual_bill': actual_bill_amount,
            'difference': round(difference, 2),
            'percentage_difference': round(percentage_diff, 2),
            'match': difference < 5.0,  # Within Rs. 5 tolerance
            'details': calculated
        }


# Test with your actual bill
if __name__ == "__main__":
    calculator = CEBTariffCalculator()
    
    # Your actual bill: 84 units over 34 days = Rs. 1,603.08
    print("="*70)
    print("TESTING WITH YOUR ACTUAL BILL")
    print("="*70)
    
    result = calculator.calculate_bill(units=84, days=34)
    
    print(f"\nUnits: {result['original_units']} kWh over {result['original_days']} days")
    print(f"Normalized (30 days): {result['normalized_units']} kWh")
    print(f"Category: {result['category']}")
    print(f"\nBreakdown:")
    for item in result['breakdown']:
        print(f"  {item['slab']}: {item['units']} units × Rs.{item['rate']} = Rs.{item['amount']}")
    print(f"\nEnergy Charge: Rs.{result['energy_charge']}")
    print(f"Fixed Charge: Rs.{result['fixed_charge']}")
    print(f"Subtotal: Rs.{result['subtotal']}")
    print(f"SSCL (2.5%): Rs.{result['sscl']}")
    print(f"="*70)
    print(f"TOTAL: Rs.{result['total']}")
    print(f"="*70)
    
    # Verify against actual bill
    print("\nVerification:")
    verification = calculator.verify_bill(84, 34, 1603.08)
    print(f"Calculated: Rs.{verification['calculated_total']}")
    print(f"Actual Bill: Rs.{verification['actual_bill']}")
    print(f"Difference: Rs.{verification['difference']} ({verification['percentage_difference']}%)")
    print(f"Match: {'✅ YES' if verification['match'] else '❌ NO'}")