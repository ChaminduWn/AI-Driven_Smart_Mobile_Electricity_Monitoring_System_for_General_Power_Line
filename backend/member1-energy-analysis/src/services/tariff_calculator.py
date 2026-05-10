"""
services/tariff_calculator.py
 Correct CEB slab scaling for non-30-day billing periods
Verified against real CEB bills:
  - Bill 1: 31 units, 29 days → Rs. 356.50 (pre-SSCL) → Rs. 365.64 total
  - Bill 2: 62 units, 29 days → Rs. 1,213.50 (pre-SSCL) → Rs. 1,244.62 total

HOW CEB CALCULATES:
1. Normalize units to 30-day equivalent to determine CATEGORY (0-60 vs above 60)
2. Scale each slab's 30-day limit by (billing_days / 30) to get actual-period limits
3. Apply energy rate to units falling in each scaled slab
4. Fixed charge = based on the highest slab reached (using normalized units)
5. SSCL = 2.565% on (energy_charge + fixed_charge)
"""
from typing import Dict, List


class CEBTariffCalculator:
    """CEB Domestic Tariff Calculator - October 2025"""

    # 30-day slab definitions
    SLABS_LOW = [
        {'limit_30d': 30,  'rate': 4.50,  'fixed': 80.00},
        {'limit_30d': 60,  'rate': 8.00,  'fixed': 210.00},
    ]

    SLABS_HIGH = [
        {'limit_30d': 60,  'rate': 12.75, 'fixed': None},
        {'limit_30d': 90,  'rate': 18.50, 'fixed': 400.00},
        {'limit_30d': 120, 'rate': 24.00, 'fixed': 1000.00},
        {'limit_30d': 180, 'rate': 41.00, 'fixed': 1500.00},
        {'limit_30d': None,'rate': 61.00, 'fixed': 2100.00},  # None = unlimited
    ]

    SSCL_RATE = 0.02565

    def calculate_bill(self, units: int, billing_days: int = 30) -> Dict:
        """
        Calculate CEB electricity bill.

        Args:
            units: Actual units consumed in billing period
            billing_days: Actual number of days in billing period

        Returns:
            Dict with full bill breakdown
        """
        # Step 1: Normalize to 30 days to determine CATEGORY only
        normalized_units = (units / billing_days) * 30

        if normalized_units <= 60:
            slabs = self.SLABS_LOW
            # Fixed charge = highest slab reached (by normalized consumption)
            fixed_charge = 80.00 if normalized_units <= 30 else 210.00
            category = 1
            category_name = '0-60 kWh (Low Consumption)'
        else:
            slabs = self.SLABS_HIGH
            if normalized_units <= 90:
                fixed_charge = 400.00
            elif normalized_units <= 120:
                fixed_charge = 1000.00
            elif normalized_units <= 180:
                fixed_charge = 1500.00
            else:
                fixed_charge = 2100.00
            category = 2
            category_name = 'Above 60 kWh (High Consumption)'

        # Step 2: Scale slab limits to actual billing period and calculate energy charge
        energy_charge = 0.0
        breakdown = []
        remaining = units
        prev_scaled_limit = 0

        for slab in slabs:
            if remaining <= 0:
                break

            if slab['limit_30d'] is None:
                # Final unlimited slab
                units_in_slab = remaining
                range_label = f"{prev_scaled_limit + 1}+ kWh"
            else:
                # Scale the 30-day slab limit to current billing period
                scaled_limit = int(slab['limit_30d'] * billing_days / 30)
                units_in_slab = max(0, min(remaining, scaled_limit - prev_scaled_limit))
                range_label = f"{prev_scaled_limit + 1}-{scaled_limit} kWh"
                if prev_scaled_limit == 0:
                    range_label = f"0-{scaled_limit} kWh"
                prev_scaled_limit = scaled_limit

            if units_in_slab <= 0:
                continue

            amount = units_in_slab * slab['rate']
            energy_charge += amount
            breakdown.append({
                'block': range_label,
                'rate': slab['rate'],
                'units': round(units_in_slab, 2),
                'amount': round(amount, 2),
                'calculation': f"{slab['rate']:.2f} × {units_in_slab} = {amount:.2f}",
            })
            remaining -= units_in_slab

        # Step 3: Totals
        subtotal = energy_charge + fixed_charge
        sscl = subtotal * self.SSCL_RATE
        total = subtotal + sscl

        return {
            'category': category,
            'category_name': category_name,
            'energy_charge': round(energy_charge, 2),
            'fixed_charge': round(fixed_charge, 2),
            'subtotal': round(subtotal, 2),
            'sscl': round(sscl, 2),
            'total': round(total, 2),
            'breakdown': breakdown,
            'billing_days': billing_days,
            'units_consumed': units,
            'normalized_units': round(normalized_units, 2),
        }


# ========== TESTS ==========
if __name__ == "__main__":
    calc = CEBTariffCalculator()

    print("=" * 60)
    print("CEB TARIFF CALCULATOR - VERIFICATION TESTS")
    print("=" * 60)

    # --- Bill 1: W.D. NIROSHAN, 31 units, 29 days ---
    # Expected: energy=146.50, fixed=210.00, subtotal=356.50, SSCL=9.14, total=365.64
    r1 = calc.calculate_bill(31, 29)
    print("\n📋 Bill 1: W.D. NIROSHAN (31 units, 29 days)")
    for b in r1['breakdown']:
        print(f"   {b['calculation']}")
    print(f"   Energy: Rs.{r1['energy_charge']}  Fixed: Rs.{r1['fixed_charge']}")
    print(f"   SSCL: Rs.{r1['sscl']}  TOTAL: Rs.{r1['total']}")
    print(f"   Expected: Rs.365.64  Match: {'✅' if abs(r1['total'] - 365.64) < 0.05 else '❌'}")

    # --- Bill 2: D C R DASANAYAKE, 62 units, 29 days ---
    # Expected: energy=813.50, fixed=400.00, subtotal=1213.50, SSCL=31.12, total=1244.62
    r2 = calc.calculate_bill(62, 29)
    print("\n📋 Bill 2: D C R DASANAYAKE (62 units, 29 days)")
    for b in r2['breakdown']:
        print(f"   {b['calculation']}")
    print(f"   Energy: Rs.{r2['energy_charge']}  Fixed: Rs.{r2['fixed_charge']}")
    print(f"   SSCL: Rs.{r2['sscl']}  TOTAL: Rs.{r2['total']}")
    print(f"   Expected: Rs.1,244.62  Match: {'✅' if abs(r2['total'] - 1244.62) < 0.05 else '❌'}")

    print("\n" + "=" * 60)
    print("✅ DONE")
    print("=" * 60)