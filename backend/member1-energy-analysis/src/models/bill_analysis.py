from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database import Base


class BillAnalysis(Base):
    """Analysis results for electricity bills"""
    __tablename__ = "bill_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("electricity_bills.id"), unique=True, index=True)
    
    # Daily Analysis
    daily_average_units = Column(Float, nullable=False)
    daily_average_cost = Column(Float, nullable=False)
    
    # Weekly Analysis
    total_weeks = Column(Integer, nullable=False)
    weekly_average_units = Column(Float, nullable=False)
    weekly_average_cost = Column(Float, nullable=False)
    week_breakdown = Column(JSON, nullable=False)  # List of week data
    
    # Trends
    consumption_trend = Column(String(50))  # increasing/stable/decreasing
    peak_week = Column(Integer)
    lowest_week = Column(Integer)
    consumption_variance = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    bill = relationship("ElectricityBill", back_populates="analysis")