"""
models/budget_plan.py
Database models for budget planning and tracking
FIXED: Proper import of ElectricityBill for foreign key
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database import Base

# This ensures ElectricityBill is loaded before BudgetPlan
from src.models.bill import ElectricityBill


class BudgetPlan(Base):
    """Budget plans for upcoming billing periods"""
    __tablename__ = "budget_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Reference to past bill
    reference_bill_id = Column(Integer, ForeignKey('electricity_bills.id'), nullable=False)
    reference_bill = relationship("ElectricityBill", foreign_keys=[reference_bill_id])
    
    # User information
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    bill_id = Column(Integer, ForeignKey('electricity_bills.id', ondelete="CASCADE"), nullable=True) # For direct linking if requested
    
    account_number = Column(String(100), index=True, nullable=False)
    
    # Plan details
    plan_name = Column(String(255), default="Budget Plan")
    target_budget = Column(Float, nullable=False)
    planning_days = Column(Integer, default=30)
    plan_start_date = Column(DateTime, nullable=False)
    plan_end_date = Column(DateTime, nullable=False)
    
    # Targets
    target_daily_units = Column(Float, nullable=False)
    target_daily_cost = Column(Float, nullable=False)
    target_weekly_units = Column(Float, nullable=False)
    target_weekly_cost = Column(Float, nullable=False)
    target_total_units = Column(Float, nullable=False)
    
    # Past bill reference data
    past_bill_amount = Column(Float, nullable=False)
    past_bill_units = Column(Integer, nullable=False)
    past_billing_days = Column(Integer, nullable=False)
    
    # Plan data (JSON)
    weekly_targets = Column(JSON, nullable=True)
    monitoring_schedule = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    
    # Status
    status = Column(String(50), default='active')
    is_active = Column(Boolean, default=True)
    
    # Tracking
    last_check_date = Column(DateTime, nullable=True)
    current_progress_status = Column(String(50), default='on_track')
    
    # Analytics & Priority
    is_priority = Column(Boolean, default=False)
    priority_set_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    meter_readings = relationship("MeterReading", back_populates="budget_plan", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<BudgetPlan(id={self.id}, budget={self.target_budget}, days={self.planning_days})>"


class MeterReading(Base):
    """Meter readings for tracking progress"""
    __tablename__ = "meter_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Link to budget plan
    budget_plan_id = Column(Integer, ForeignKey('budget_plans.id'), nullable=False)
    budget_plan = relationship("BudgetPlan", back_populates="meter_readings")
    
    # Direct link to bill
    bill_id = Column(Integer, ForeignKey('electricity_bills.id', ondelete="CASCADE"), nullable=True)
    bill = relationship("ElectricityBill")
    
    # Reading information
    reading_value = Column(Integer, nullable=False)
    reading_date = Column(DateTime, nullable=False)
    reading_time = Column(String(10), nullable=True)
    
    # Calculated at time of reading
    units_consumed_so_far = Column(Integer, nullable=False)
    days_elapsed = Column(Integer, nullable=False)
    actual_cost_so_far = Column(Float, nullable=False)
    expected_cost_so_far = Column(Float, nullable=False)
    
    # Variance
    variance_units = Column(Float, nullable=False)
    variance_cost = Column(Float, nullable=False)
    variance_percentage = Column(Float, nullable=False)
    
    # Status at time of reading
    status = Column(String(50), nullable=False)
    
    # Projection
    projected_total_units = Column(Float, nullable=True)
    projected_total_cost = Column(Float, nullable=True)
    projected_budget_variance = Column(Float, nullable=True)
    
    # Analysis data
    analysis_data = Column(JSON, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<MeterReading(id={self.id}, plan_id={self.budget_plan_id}, reading={self.reading_value})>"


class HouseholdAppliance(Base):
    """Appliances in household for detailed consumption analysis"""
    __tablename__ = "household_appliances"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User/household information
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    bill_id = Column(Integer, ForeignKey('electricity_bills.id', ondelete="CASCADE"), nullable=True)
    
    account_number = Column(String(100), index=True, nullable=False)
    
    user = relationship("User")
    bill = relationship("ElectricityBill")
    
    # Appliance details
    appliance_name = Column(String(255), nullable=False)
    appliance_category = Column(String(100), nullable=True)
    wattage = Column(Integer, nullable=False)
    quantity = Column(Integer, default=1)
    
    # Usage pattern
    daily_usage_hours = Column(Float, default=0)
    usage_frequency = Column(String(50), default='daily')
    usage_times_per_day = Column(Integer, default=1)
    usage_duration_minutes = Column(Integer, default=60)
    
    # Calculated consumption
    daily_kwh = Column(Float, nullable=True)
    monthly_kwh = Column(Float, nullable=True)
    estimated_monthly_cost = Column(Float, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def calculate_consumption(self):
        """Calculate daily and monthly kWh consumption"""
        # Total wattage for all units
        total_wattage = self.wattage * (self.quantity or 1)
        
        if self.usage_frequency == 'daily':
            hours_per_day = (self.usage_duration_minutes * self.usage_times_per_day) / 60
            self.daily_kwh = (total_wattage * hours_per_day) / 1000
            self.monthly_kwh = self.daily_kwh * 30
        elif self.usage_frequency == 'weekly':
            hours_per_week = (self.usage_duration_minutes * self.usage_times_per_day) / 60
            kwh_per_week = (total_wattage * hours_per_week) / 1000
            self.daily_kwh = kwh_per_week / 7
            self.monthly_kwh = kwh_per_week * 4.3
        else:
            total_minutes = self.usage_duration_minutes * self.usage_times_per_day
            self.monthly_kwh = (total_wattage * (total_minutes / 60)) / 1000
            self.daily_kwh = self.monthly_kwh / 30
    
    def __repr__(self):
        return f"<HouseholdAppliance(id={self.id}, name={self.appliance_name}, wattage={self.wattage}W)>"


class HouseholdMember(Base):
    """Household members for pattern-based consumption analysis"""
    __tablename__ = "household_members"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User/household information
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    bill_id = Column(Integer, ForeignKey('electricity_bills.id', ondelete="CASCADE"), nullable=True)
    
    account_number = Column(String(100), index=True, nullable=False)
    
    user = relationship("User")
    bill = relationship("ElectricityBill")
    
    # Member details
    member_type = Column(String(50), nullable=False)
    age = Column(Integer, nullable=True)
    occupation_status = Column(String(100), nullable=True)
    
    # Time at home patterns
    weekday_hours_at_home = Column(Float, default=12)
    weekend_hours_at_home = Column(Float, default=24)
    
    # Consumption patterns (estimated multipliers)
    consumption_multiplier = Column(Float, default=1.0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<HouseholdMember(id={self.id}, type={self.member_type}, age={self.age})>"


class TariffStructure(Base):
    """CEB Tariff structure (for admin management)"""
    __tablename__ = "tariff_structures"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Tariff identification
    tariff_name = Column(String(255), nullable=False)
    category = Column(String(100), default='domestic')
    effective_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    
    # Tariff data (JSON structure)
    rate_structure = Column(JSON, nullable=False)
    fixed_charges = Column(JSON, nullable=False)
    sscl_rate = Column(Float, default=0.02565)  # 2.565%
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    uploaded_by = Column(String(100), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<TariffStructure(id={self.id}, name={self.tariff_name}, active={self.is_active})>"