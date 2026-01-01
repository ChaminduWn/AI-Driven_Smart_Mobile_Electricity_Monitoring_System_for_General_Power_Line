"""
Seed CEB October 2025 tariff data
Run: python scripts/seed_ceb_tariff.py
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from src.database import SessionLocal
from src.models.tariff import CEBTariff


def seed_tariff():
    """Seed CEB October 2025 domestic tariff"""
    db = SessionLocal()
    
    try:
        # Check if tariff exists
        existing = db.query(CEBTariff).filter(
            CEBTariff.category == "Domestic",
            CEBTariff.is_active == True
        ).first()
        
        if existing:
            print("✅ Active tariff already exists!")
            print(f"   Effective from: {existing.effective_from}")
            return
        
        # Create October 2025 tariff
        tariff = CEBTariff(
            category="Domestic",
            effective_from=datetime(2025, 10, 15),
            tariff_structure={
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
            },
            is_active=True
        )
        
        db.add(tariff)
        db.commit()
        
        print("=" * 70)
        print("✅ CEB October 2025 Tariff Seeded Successfully!")
        print("=" * 70)
        print(f"Category: {tariff.category}")
        print(f"Effective From: {tariff.effective_from}")
        print(f"SSCL Rate: 2.5%")
        print("\nLow Consumption (0-60 kWh):")
        print("  - 0-30 kWh: Rs. 4.50/kWh + Rs. 80 fixed")
        print("  - 31-60 kWh: Rs. 8.00/kWh + Rs. 210 fixed")
        print("\nNormal Consumption (Above 60 kWh):")
        print("  - 0-60 kWh: Rs. 12.75/kWh")
        print("  - 61-90 kWh: Rs. 18.50/kWh")
        print("  - 91-120 kWh: Rs. 24.00/kWh")
        print("  - 121-180 kWh: Rs. 41.00/kWh")
        print("  - Above 180 kWh: Rs. 61.00/kWh")
        print("=" * 70)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_tariff()
