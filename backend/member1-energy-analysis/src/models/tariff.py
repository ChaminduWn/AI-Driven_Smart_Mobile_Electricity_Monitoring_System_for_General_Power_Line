from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from src.database import Base


class CEBTariff(Base):
    """CEB Domestic Electricity Tariff Structure"""
    __tablename__ = "ceb_tariffs"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), default="Domestic", nullable=False)
    effective_from = Column(DateTime, nullable=False)
    effective_to = Column(DateTime, nullable=True)
    
    # Tariff structure (JSON for flexibility)
    # Format: {
    #   "low_consumption": {  # 0-60 kWh
    #     "tiers": [
    #       {"min": 0, "max": 30, "rate": 4.50, "fixed_charge": 80},
    #       {"min": 31, "max": 60, "rate": 8.00, "fixed_charge": 210}
    #     ]
    #   },
    #   "normal_consumption": {  # Above 60 kWh
    #     "tiers": [
    #       {"min": 0, "max": 60, "rate": 12.75, "fixed_charge": 400},
    #       {"min": 61, "max": 90, "rate": 18.50, "fixed_charge": 400},
    #       {"min": 91, "max": 120, "rate": 24.00, "fixed_charge": 1000},
    #       {"min": 121, "max": 180, "rate": 41.00, "fixed_charge": 1500},
    #       {"min": 181, "max": null, "rate": 61.00, "fixed_charge": 2100}
    #     ]
    #   },
    #   "sscl_rate": 0.025  # 2.5% Social Security Contribution Levy
    # }
    tariff_structure = Column(JSON, nullable=False)
    
    # Metadata
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())