"""
create_tables.py
Script to create all database tables
Run from project root: python create_tables.py
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.database import Base, engine
from src.models import (
    ElectricityBill,
    User,
    UserProfile,
    Notification,
    BudgetPlan,
    MeterReading,
    HouseholdAppliance,
    HouseholdMember,
    TariffStructure,
    LiveMeterReading,
    ApplianceEvent,
    IoTReading,
    DeviceSession,
    DeviceReading,
    DeviceApplianceEvent,
)

def create_all_tables():
    """Create all tables in the database"""
    print("Creating database tables...")
    print("=" * 60)
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✓ Successfully created the following tables:")
        print("  - users")
        print("  - user_profiles")
        print("  - notifications")
        print("  - electricity_bills")
        print("  - budget_plans")
        print("  - meter_readings")
        print("  - household_appliances")
        print("  - household_members")
        print("  - tariff_structures")
        print("  - live_meter_readings")
        print("  - appliance_events")
        print("  - iot_readings")
        print("  - device_sessions")
        print("  - device_readings")
        print("  - device_appliance_events")
        print("\n" + "=" * 60)
        print("✅ Database setup complete!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = create_all_tables()
    sys.exit(0 if success else 1)