"""
src/models/__init__.py
Import all models to ensure they're registered with SQLAlchemy
"""

# Import base first
from src.database import Base

# Import models in dependency order (tables that are referenced by foreign keys first)
from src.models.bill import ElectricityBill
from src.models.budget_plan import (
    BudgetPlan,
    MeterReading,
    HouseholdAppliance,
    HouseholdMember,
    TariffStructure
)

# Export all models
__all__ = [
    'Base',
    'ElectricityBill',
    'BudgetPlan',
    'MeterReading',
    'HouseholdAppliance',
    'HouseholdMember',
    'TariffStructure'
]