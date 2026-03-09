"""
src/models/__init__.py
Import all models to ensure they're registered with SQLAlchemy
"""

# Import base first
from src.database import Base

# Import models in dependency order (tables that are referenced by foreign keys first)
from src.models.bill import ElectricityBill
from src.models.user import User, UserProfile, Notification
from src.models.budget_plan import (
    BudgetPlan,
    MeterReading,
    HouseholdAppliance,
    HouseholdMember,
    TariffStructure
)
from src.models.iot_reading import LiveMeterReading, ApplianceEvent, IoTReading
from src.models.device_session import DeviceSession, DeviceReading, DeviceApplianceEvent  # ← ADDED

# Export all models
__all__ = [
    'Base',
    'ElectricityBill',
    'User',
    'UserProfile',
    'Notification',
    'BudgetPlan',
    'MeterReading',
    'HouseholdAppliance',
    'HouseholdMember',
    'TariffStructure',
    'LiveMeterReading',
    'ApplianceEvent',
    'IoTReading',
    'DeviceSession',            # ← ADDED
    'DeviceReading',            # ← ADDED
    'DeviceApplianceEvent',     # ← ADDED
]