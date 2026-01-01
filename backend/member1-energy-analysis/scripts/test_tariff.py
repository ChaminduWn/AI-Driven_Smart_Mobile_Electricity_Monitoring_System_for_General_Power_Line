
"""
Test CEB tariff calculator
Run: python scripts/test_tariff.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database import SessionLocal
from src.services.tariff_calculator import TariffCalculator


def test_calculator():
    """Test tariff calculator with sample bills"""
    db = SessionLocal()
    calc = TariffCalculator(db)
    
    test_cases = [
        25,   # Low consumption
        50,   # Low consumption
        77,   # Your bill example
        100,  # Normal consumption
        150,  # Normal consumption
        200,  # High consumption
    ]
    
    print("=" * 80)
    print("CEB TARIFF CALCULATOR TEST")
    print("=" * 80)
    
    for units in test_cases:
        result = calc.calculate_cost(units)
        
        print(f"\n📊 {units} kWh Consumption:")
        print(f"   Unit Charge:    Rs. {result['unit_charge']:,}")
        print(f"   Fixed Charge:   Rs. {result['fixed_charge']:,}")
        print(f"   Subtotal:       Rs. {result['subtotal']:,}")
        print(f"   SSCL Tax (2.5%): Rs. {result['sscl_tax']:,}")
        print(f"   💰 TOTAL:       Rs. {result['total_cost']:,}")
        print(f"   Effective Rate: Rs. {result['effective_rate']}/kWh")
        
        if 'tier_breakdown' in result:
            print("   Tier Breakdown:")
            for tier in result['tier_breakdown']:
                print(f"     • {tier['range']}: {tier['units']} units @ Rs. {tier['rate']} = Rs. {tier['cost']}")
    
    print("\n" + "=" * 80)
    db.close()


if __name__ == "__main__":
    test_calculator()

