from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database import Base


class ElectricityBill(Base):
    """
    Comprehensive electricity bill model
    Supports: File extraction, bill parsing, analysis, and arrears tracking
    """
    __tablename__ = "electricity_bills"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # ========================================================================
    # PHASE 0: FILE EXTRACTION FIELDS (Existing)
    # ========================================================================
    
    # File Information
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_type = Column(String(50), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Extraction Metadata
    raw_text = Column(Text, nullable=True)
    extracted_data = Column(JSON, nullable=True)
    confidence_score = Column(Float, default=0.0)
    processing_status = Column(String(50), default="pending")  # pending, processed, failed
    error_message = Column(Text, nullable=True)
    
    # ========================================================================
    # BILL IDENTIFICATION (Enhanced)
    # ========================================================================
    
    account_number = Column(String(100), index=True, nullable=False)
    bill_reference = Column(String(100), unique=True, index=True)  # bill_ref from CEB
    bill_date = Column(Date, nullable=True)  # Changed to Date for consistency
    
    # ========================================================================
    # BILLING PERIOD (Enhanced)
    # ========================================================================
    
    # Dates
    previous_reading_date = Column(Date, nullable=True)  # reading_date_from
    current_reading_date = Column(Date, nullable=True)   # reading_date_to
    billing_period_days = Column(Integer, nullable=True)
    
    # Meter Readings
    previous_reading = Column(Integer, nullable=True)
    current_reading = Column(Integer, nullable=True)
    
    # ========================================================================
    # CONSUMPTION DATA (Enhanced)
    # ========================================================================
    
    units_consumed = Column(Float, nullable=True)  # Changed to Float for accuracy
    units_exported = Column(Float, default=0.0)    # Changed to Float
    
    # ========================================================================
    # CUSTOMER INFORMATION
    # ========================================================================
    
    customer_name = Column(String(255), nullable=True)
    customer_address = Column(Text, nullable=True)
    mobile_number = Column(String(20), nullable=True)  # NEW: From Phase 1
    
    # Tariff & Connection
    tariff_type = Column(String(100), nullable=True)    # tariff_category
    connection_type = Column(String(50), nullable=True)
    
    # Office Information (NEW: From Phase 1)
    area_office = Column(String(100), nullable=True)
    walk_order = Column(String(50), nullable=True)
    premises_id = Column(String(50), nullable=True)
    
    # ========================================================================
    # PHASE 1: CURRENT MONTH CHARGES (NEW)
    # ========================================================================
    
    # Charge Breakdown (from tariff calculation)
    unit_charge = Column(Float, default=0.0)           # Charge for units consumed
    fixed_charge = Column(Float, default=0.0)          # Monthly fixed charge
    current_month_subtotal = Column(Float, nullable=True)  # unit_charge + fixed_charge
    sscl_tax = Column(Float, nullable=True)            # 2.5% SSCL
    current_month_charge = Column(Float, nullable=True)    # Subtotal + SSCL
    
    # Legacy field (keep for backward compatibility)
    total_charge = Column(Float, nullable=True)  # Can be same as current_month_charge
    
    # ========================================================================
    # PHASE 1: ARREARS & PAYMENT TRACKING (NEW)
    # ========================================================================
    
    # Arrears
    previous_due = Column(Float, default=0.0)      # Amount from previous bills
    credits = Column(Float, default=0.0)           # Payment credits/adjustments
    debits = Column(Float, default=0.0)            # Additional charges
    
    # Total Due (Current Month + Arrears)
    total_due = Column(Float, nullable=True)       # Final amount to pay
    
    # Payment History
    last_payment_amount = Column(Float, nullable=True)  # NEW
    last_payment_date = Column(Date, nullable=True)     # NEW
    due_date = Column(Date, nullable=True)              # NEW
    
    # ========================================================================
    # RELATIONSHIPS
    # ========================================================================
    
    # Phase 1: Bill Analysis
    analysis = relationship("BillAnalysis", back_populates="bill", uselist=False)
    
    # ========================================================================
    # TIMESTAMPS
    # ========================================================================
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ========================================================================
    # COMPUTED PROPERTIES
    # ========================================================================
    
    @property
    def has_arrears(self) -> bool:
        """Check if bill has outstanding arrears"""
        return (self.previous_due or 0) > 0 or (self.debits or 0) > 0
    
    @property
    def is_processed(self) -> bool:
        """Check if bill extraction completed successfully"""
        return self.processing_status == "processed"
    
    @property
    def effective_billing_days(self) -> int:
        """Get billing days, default to 30 if not set"""
        return self.billing_period_days or 30
    
    # ========================================================================
    # REPRESENTATION
    # ========================================================================
    
    def __repr__(self):
        return (
            f"<ElectricityBill(id={self.id}, "
            f"account={self.account_number}, "
            f"units={self.units_consumed}, "
            f"current_month={self.current_month_charge}, "
            f"total_due={self.total_due})>"
        )

