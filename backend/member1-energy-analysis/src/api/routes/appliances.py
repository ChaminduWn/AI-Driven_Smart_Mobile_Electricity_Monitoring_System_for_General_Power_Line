"""
api/routes/appliances.py
Appliance tracking and analysis endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional

from src.database import get_db
from src.services.bill_analysis import BillAnalysisService

# ✅ CREATE THE ROUTER - This was missing!
router = APIRouter(prefix="/appliances", tags=["Appliances"])
analysis_service = BillAnalysisService()


# ========== REQUEST MODELS ==========

class ApplianceCreate(BaseModel):
    account_number: str
    name: str
    category: str
    wattage: int = Field(gt=0)
    usage_duration: int = Field(gt=0, description="Usage duration in minutes")
    usage_times: int = Field(default=1, ge=1, description="Times used per day")
    frequency: str = Field(default="daily", description="daily, weekly, etc.")


# ========== ENDPOINTS ==========

@router.post("/")
def add_appliance(appliance: ApplianceCreate, db: Session = Depends(get_db)):
    """Add household appliance"""
    from src.models.budget_plan import HouseholdAppliance
    
    appliance_record = HouseholdAppliance(
        account_number=appliance.account_number,
        appliance_name=appliance.name,
        appliance_category=appliance.category,
        wattage=appliance.wattage,
        usage_duration_minutes=appliance.usage_duration,
        usage_times_per_day=appliance.usage_times,
        usage_frequency=appliance.frequency
    )
    
    # Calculate consumption
    appliance_record.calculate_consumption()
    
    db.add(appliance_record)
    db.commit()
    db.refresh(appliance_record)
    
    return {
        'success': True, 
        'appliance_id': appliance_record.id,
        'daily_kwh': appliance_record.daily_kwh,
        'monthly_kwh': appliance_record.monthly_kwh
    }


@router.get("/analysis/{account_number}")
def analyze_appliances(account_number: str, db: Session = Depends(get_db)):
    """Get appliance-wise consumption breakdown"""
    from src.models.budget_plan import HouseholdAppliance
    
    appliances = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.account_number == account_number,
        HouseholdAppliance.is_active == True
    ).all()
    
    if not appliances:
        return {
            'success': True,
            'total_appliances': 0,
            'message': 'No appliances found for this account',
            'breakdown': []
        }
    
    total_daily_kwh = sum(a.daily_kwh or 0 for a in appliances)
    total_monthly_kwh = sum(a.monthly_kwh or 0 for a in appliances)
    
    # Calculate costs using tariff
    monthly_cost_calc = analysis_service.tariff_calculator.calculate_bill(
        int(total_monthly_kwh), 30
    )
    
    breakdown = []
    for appliance in appliances:
        percentage = (appliance.monthly_kwh / total_monthly_kwh * 100) if total_monthly_kwh > 0 else 0
        estimated_cost = (appliance.monthly_kwh / total_monthly_kwh * monthly_cost_calc['total']) if total_monthly_kwh > 0 else 0
        
        breakdown.append({
            'id': appliance.id,
            'name': appliance.appliance_name,
            'category': appliance.appliance_category,
            'wattage': appliance.wattage,
            'daily_kwh': round(appliance.daily_kwh, 3),
            'monthly_kwh': round(appliance.monthly_kwh, 2),
            'percentage': round(percentage, 2),
            'estimated_monthly_cost': round(estimated_cost, 2)
        })
    
    # Sort by monthly consumption (highest first)
    breakdown.sort(key=lambda x: x['monthly_kwh'], reverse=True)
    
    return {
        'success': True,
        'account_number': account_number,
        'total_appliances': len(appliances),
        'total_daily_kwh': round(total_daily_kwh, 2),
        'total_monthly_kwh': round(total_monthly_kwh, 2),
        'estimated_monthly_cost': round(monthly_cost_calc['total'], 2),
        'breakdown': breakdown
    }


@router.get("/{account_number}")
def get_appliances(account_number: str, db: Session = Depends(get_db)):
    """Get all appliances for an account"""
    from src.models.budget_plan import HouseholdAppliance
    
    appliances = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.account_number == account_number,
        HouseholdAppliance.is_active == True
    ).all()
    
    return {
        'success': True,
        'count': len(appliances),
        'appliances': [
            {
                'id': a.id,
                'name': a.appliance_name,
                'category': a.appliance_category,
                'wattage': a.wattage,
                'daily_kwh': a.daily_kwh,
                'monthly_kwh': a.monthly_kwh
            }
            for a in appliances
        ]
    }


@router.delete("/{appliance_id}")
def delete_appliance(appliance_id: int, db: Session = Depends(get_db)):
    """Delete/deactivate an appliance"""
    from src.models.budget_plan import HouseholdAppliance
    
    appliance = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.id == appliance_id
    ).first()
    
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    
    appliance.is_active = False
    db.commit()
    
    return {
        'success': True,
        'message': 'Appliance deleted successfully'
    }