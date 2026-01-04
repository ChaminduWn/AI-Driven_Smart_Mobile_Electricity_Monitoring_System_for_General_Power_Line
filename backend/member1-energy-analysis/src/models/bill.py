from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, Text
from sqlalchemy.sql import func
from src.database import Base

class ElectricityBill(Base):
    __tablename__ = "electricity_bills"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # File Information
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_type = Column(String(50), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Bill Details
    account_number = Column(String(100), index=True)
    bill_reference = Column(String(100), unique=True, index=True)
    bill_date = Column(DateTime, nullable=True)
    
    # Consumption Data
    units_consumed = Column(Integer, nullable=True)
    units_exported = Column(Integer, default=0)
    billing_period_days = Column(Integer, nullable=True)
    
    # Meter Readings
    previous_reading = Column(Integer, nullable=True)
    current_reading = Column(Integer, nullable=True)
    previous_reading_date = Column(DateTime, nullable=True)
    current_reading_date = Column(DateTime, nullable=True)
    
    # Financial Data (Simplified - No dues tracking)
    fixed_charge = Column(Float, default=0.0, comment="Fixed monthly charge")
    unit_charge = Column(Float, default=0.0, comment="Charge for units consumed")
    total_charge = Column(Float, nullable=True, comment="Total monthly bill amount (This Month Charge / Total with Tax)")
    
    # Note: Removed previous_due and total_due fields
    # total_charge now represents the actual monthly bill amount only
    # This is extracted from either "This Month Charge" or "Total with Tax (Rs.)"
    
    # Customer Information
    customer_name = Column(String(255), nullable=True)
    customer_address = Column(Text, nullable=True)
    tariff_type = Column(String(100), nullable=True)
    connection_type = Column(String(50), nullable=True)
    
    # Metadata
    raw_text = Column(Text, nullable=True)
    extracted_data = Column(JSON, nullable=True)
    confidence_score = Column(Float, default=0.0)
    processing_status = Column(String(50), default="pending")
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<ElectricityBill(id={self.id}, account={self.account_number}, units={self.units_consumed}, charge={self.total_charge})>"
    
    @property
    def average_cost_per_unit(self) -> float:
        """Calculate average cost per unit"""
        if self.units_consumed and self.units_consumed > 0 and self.total_charge:
            return round(self.total_charge / self.units_consumed, 2)
        return 0.0
    
    @property
    def daily_average_units(self) -> float:
        """Calculate average daily consumption"""
        if self.billing_period_days and self.billing_period_days > 0 and self.units_consumed:
            return round(self.units_consumed / self.billing_period_days, 2)
        return 0.0
    
    @property
    def normalized_units_30days(self) -> float:
        """Normalize consumption to 30-day period"""
        if self.billing_period_days and self.billing_period_days > 0 and self.units_consumed:
            return round((self.units_consumed / self.billing_period_days) * 30, 2)
        return 0.0