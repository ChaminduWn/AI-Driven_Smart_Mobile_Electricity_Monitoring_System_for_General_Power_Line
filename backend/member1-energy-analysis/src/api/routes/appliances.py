"""
src/api/routes/appliances.py
PHASE 3: Appliance Management System
"""

from fastapi import UploadFile, File
import shutil
from pathlib import Path
from src.services.appliance_recognition import get_recognition_service
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
from src.database import get_db
from src.models.budget_plan import HouseholdAppliance
from src.services.bill_analysis import BillAnalysisService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/appliances", tags=["Appliance Management"])
analysis_service = BillAnalysisService()


# ========== REQUEST/RESPONSE MODELS ==========

class ApplianceCreate(BaseModel):
    account_number: str = Field(..., description="Account number")
    appliance_name: str = Field(..., min_length=1, max_length=255, description="Name of appliance")
    appliance_category: Optional[str] = Field(None, description="Category (cooling, heating, entertainment, etc.)")
    wattage: int = Field(..., gt=0, description="Power consumption in Watts")
    usage_duration_minutes: int = Field(60, gt=0, description="Duration per use in minutes")
    usage_times_per_day: int = Field(1, gt=0, description="How many times used per day")
    usage_frequency: str = Field('daily', description="Frequency: daily, weekly, monthly")


class ApplianceUpdate(BaseModel):
    appliance_name: Optional[str] = None
    appliance_category: Optional[str] = None
    wattage: Optional[int] = None
    usage_duration_minutes: Optional[int] = None
    usage_times_per_day: Optional[int] = None
    usage_frequency: Optional[str] = None
    is_active: Optional[bool] = None


class ApplianceResponse(BaseModel):
    id: int
    appliance_name: str
    appliance_category: Optional[str]
    wattage: int
    usage_frequency: str
    usage_duration_minutes: int
    usage_times_per_day: int
    daily_kwh: Optional[float]
    monthly_kwh: Optional[float]
    estimated_monthly_cost: Optional[float]
    is_active: bool

    class Config:
        from_attributes = True


# ========== ENDPOINTS ==========

@router.post("/", response_model=dict)
def add_appliance(
    appliance: ApplianceCreate,
    db: Session = Depends(get_db)
):
    """
    Add a new household appliance
    
    Automatically calculates:
    - Daily kWh consumption
    - Monthly kWh consumption
    - Estimated monthly cost
    """
    try:
        appliance_record = HouseholdAppliance(
            account_number=appliance.account_number,
            appliance_name=appliance.appliance_name,
            appliance_category=appliance.appliance_category,
            wattage=appliance.wattage,
            usage_duration_minutes=appliance.usage_duration_minutes,
            usage_times_per_day=appliance.usage_times_per_day,
            usage_frequency=appliance.usage_frequency
        )
        
        # Calculate consumption
        appliance_record.calculate_consumption()
        
        # Calculate estimated cost using tariff
        if appliance_record.monthly_kwh:
            tariff_calc = analysis_service.tariff_calculator.calculate_bill(
                int(appliance_record.monthly_kwh), 30
            )
            appliance_record.estimated_monthly_cost = tariff_calc['total']
        
        db.add(appliance_record)
        db.commit()
        db.refresh(appliance_record)
        
        return {
            'success': True,
            'message': 'Appliance added successfully',
            'appliance_id': appliance_record.id,
            'daily_kwh': appliance_record.daily_kwh,
            'monthly_kwh': appliance_record.monthly_kwh,
            'estimated_cost': appliance_record.estimated_monthly_cost
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/account/{account_number}", response_model=dict)
def get_appliances_by_account(
    account_number: str,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all appliances for an account"""
    query = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.account_number == account_number
    )
    
    if active_only:
        query = query.filter(HouseholdAppliance.is_active == True)
    
    appliances = query.all()
    
    return {
        'success': True,
        'count': len(appliances),
        'appliances': [
            {
                'id': a.id,
                'name': a.appliance_name,
                'category': a.appliance_category,
                'wattage': a.wattage,
                'usage': f"{a.usage_times_per_day}x per day, {a.usage_duration_minutes} min each",
                'frequency': a.usage_frequency,
                'daily_kwh': round(a.daily_kwh, 3) if a.daily_kwh else 0,
                'monthly_kwh': round(a.monthly_kwh, 2) if a.monthly_kwh else 0,
                'estimated_cost': round(a.estimated_monthly_cost, 2) if a.estimated_monthly_cost else 0,
                'is_active': a.is_active
            }
            for a in appliances
        ]
    }


@router.get("/analysis/{account_number}", response_model=dict)
def analyze_appliances(
    account_number: str,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive appliance-wise consumption breakdown
    
    Returns:
    - Total daily/monthly consumption
    - Breakdown by appliance with percentages
    - Category-wise breakdown
    - Cost estimates
    - High-consumption appliances
    """
    appliances = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.account_number == account_number,
        HouseholdAppliance.is_active == True
    ).all()
    
    if not appliances:
        return {
            'success': True,
            'message': 'No appliances found for this account',
            'appliances_count': 0
        }
    
    # Calculate totals
    total_daily_kwh = sum(a.daily_kwh or 0 for a in appliances)
    total_monthly_kwh = sum(a.monthly_kwh or 0 for a in appliances)
    
    # Calculate total cost using tariff
    monthly_cost_calc = analysis_service.tariff_calculator.calculate_bill(
        int(total_monthly_kwh), 30
    )
    total_monthly_cost = monthly_cost_calc['total']
    
    # Breakdown by appliance
    breakdown = []
    for appliance in appliances:
        percentage = (appliance.monthly_kwh / total_monthly_kwh * 100) if total_monthly_kwh > 0 else 0
        estimated_cost = (appliance.monthly_kwh / total_monthly_kwh * total_monthly_cost) if total_monthly_kwh > 0 else 0
        
        breakdown.append({
            'id': appliance.id,
            'name': appliance.appliance_name,
            'category': appliance.appliance_category,
            'wattage': appliance.wattage,
            'daily_kwh': round(appliance.daily_kwh, 3) if appliance.daily_kwh else 0,
            'monthly_kwh': round(appliance.monthly_kwh, 2) if appliance.monthly_kwh else 0,
            'percentage': round(percentage, 2),
            'estimated_monthly_cost': round(estimated_cost, 2),
            'cost_per_day': round(estimated_cost / 30, 2) if estimated_cost else 0
        })
    
    # Sort by consumption (highest first)
    breakdown.sort(key=lambda x: x['monthly_kwh'], reverse=True)
    
    # Category-wise breakdown
    category_breakdown = {}
    for appliance in appliances:
        category = appliance.appliance_category or 'Uncategorized'
        if category not in category_breakdown:
            category_breakdown[category] = {
                'count': 0,
                'total_kwh': 0,
                'total_cost': 0
            }
        
        category_breakdown[category]['count'] += 1
        category_breakdown[category]['total_kwh'] += appliance.monthly_kwh or 0
        
        percentage = (appliance.monthly_kwh / total_monthly_kwh) if total_monthly_kwh > 0 else 0
        category_breakdown[category]['total_cost'] += (percentage * total_monthly_cost)
    
    # Format category breakdown
    categories = [
        {
            'category': cat,
            'count': data['count'],
            'monthly_kwh': round(data['total_kwh'], 2),
            'monthly_cost': round(data['total_cost'], 2),
            'percentage': round((data['total_kwh'] / total_monthly_kwh * 100) if total_monthly_kwh > 0 else 0, 2)
        }
        for cat, data in category_breakdown.items()
    ]
    categories.sort(key=lambda x: x['monthly_kwh'], reverse=True)
    
    # High-consumption appliances (top 20% consumers)
    threshold_kwh = total_monthly_kwh * 0.2
    high_consumers = [a for a in breakdown if a['monthly_kwh'] >= threshold_kwh]
    
    return {
        'success': True,
        'summary': {
            'total_appliances': len(appliances),
            'total_daily_kwh': round(total_daily_kwh, 2),
            'total_monthly_kwh': round(total_monthly_kwh, 2),
            'estimated_monthly_cost': round(total_monthly_cost, 2),
            'average_cost_per_day': round(total_monthly_cost / 30, 2)
        },
        'breakdown': breakdown,
        'by_category': categories,
        'high_consumers': {
            'count': len(high_consumers),
            'threshold_kwh': round(threshold_kwh, 2),
            'appliances': high_consumers
        },
        'tariff_details': monthly_cost_calc
    }


@router.get("/recommendations/{account_number}", response_model=dict)
def get_recommendations(
    account_number: str,
    db: Session = Depends(get_db)
):
    """
    Get smart recommendations for reducing consumption
    
    Analyzes:
    - High-consumption appliances
    - Usage patterns
    - Potential savings
    """
    appliances = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.account_number == account_number,
        HouseholdAppliance.is_active == True
    ).all()
    
    if not appliances:
        return {'success': True, 'recommendations': []}
    
    total_monthly_kwh = sum(a.monthly_kwh or 0 for a in appliances)
    
    recommendations = []
    
    # Check for high wattage appliances
    high_wattage = [a for a in appliances if a.wattage > 1500]
    if high_wattage:
        for appliance in high_wattage:
            savings_potential = (appliance.monthly_kwh or 0) * 0.2  # 20% reduction potential
            recommendations.append({
                'type': 'high_wattage',
                'priority': 'high',
                'appliance': appliance.appliance_name,
                'message': f'{appliance.appliance_name} ({appliance.wattage}W) is a high-consumption appliance',
                'suggestion': f'Reduce usage by 20% to save ~{savings_potential:.1f} kWh/month',
                'potential_savings_kwh': round(savings_potential, 2)
            })
    
    # Check for always-on appliances
    continuous = [a for a in appliances if a.usage_frequency == 'daily' and a.usage_duration_minutes > 300]
    if continuous:
        for appliance in continuous:
            recommendations.append({
                'type': 'continuous_usage',
                'priority': 'medium',
                'appliance': appliance.appliance_name,
                'message': f'{appliance.appliance_name} runs for long periods',
                'suggestion': 'Consider using timer switches or reducing runtime'
            })
    
    # Check for multiple similar appliances
    from collections import Counter
    categories = [a.appliance_category for a in appliances if a.appliance_category]
    category_counts = Counter(categories)
    
    for category, count in category_counts.items():
        if count >= 3:
            recommendations.append({
                'type': 'multiple_appliances',
                'priority': 'low',
                'category': category,
                'message': f'You have {count} {category} appliances',
                'suggestion': 'Consider consolidating usage or replacing with more efficient models'
            })
    
    # General recommendations
    if total_monthly_kwh > 200:
        recommendations.append({
            'type': 'overall_consumption',
            'priority': 'high',
            'message': f'Total appliance consumption is {total_monthly_kwh:.0f} kWh/month',
            'suggestion': 'Consider upgrading to energy-efficient appliances (look for A+++ ratings)'
        })
    
    return {
        'success': True,
        'total_recommendations': len(recommendations),
        'recommendations': recommendations
    }


@router.put("/{appliance_id}", response_model=dict)
def update_appliance(
    appliance_id: int,
    updates: ApplianceUpdate,
    db: Session = Depends(get_db)
):
    """Update appliance details"""
    appliance = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.id == appliance_id
    ).first()
    
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    
    try:
        # Update fields
        update_data = updates.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(appliance, field, value)
        
        # Recalculate consumption if relevant fields changed
        if any(key in update_data for key in ['wattage', 'usage_duration_minutes', 'usage_times_per_day', 'usage_frequency']):
            appliance.calculate_consumption()
            
            # Recalculate cost
            if appliance.monthly_kwh:
                tariff_calc = analysis_service.tariff_calculator.calculate_bill(
                    int(appliance.monthly_kwh), 30
                )
                appliance.estimated_monthly_cost = tariff_calc['total']
        
        db.commit()
        db.refresh(appliance)
        
        return {
            'success': True,
            'message': 'Appliance updated successfully',
            'appliance': {
                'id': appliance.id,
                'name': appliance.appliance_name,
                'daily_kwh': appliance.daily_kwh,
                'monthly_kwh': appliance.monthly_kwh,
                'estimated_cost': appliance.estimated_monthly_cost
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{appliance_id}", response_model=dict)
def delete_appliance(
    appliance_id: int,
    soft_delete: bool = True,
    db: Session = Depends(get_db)
):
    """Delete an appliance (soft delete by default)"""
    appliance = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.id == appliance_id
    ).first()
    
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    
    try:
        if soft_delete:
            appliance.is_active = False
            db.commit()
            message = "Appliance deactivated successfully"
        else:
            db.delete(appliance)
            db.commit()
            message = "Appliance deleted permanently"
        
        return {
            'success': True,
            'message': message
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories", response_model=dict)
def get_appliance_categories():
    """Get list of common appliance categories"""
    categories = [
        {'name': 'Cooling', 'examples': ['Refrigerator', 'Freezer', 'Air Conditioner', 'Fan']},
        {'name': 'Heating', 'examples': ['Electric Heater', 'Water Heater', 'Iron', 'Hair Dryer']},
        {'name': 'Cooking', 'examples': ['Electric Stove', 'Microwave', 'Rice Cooker', 'Toaster']},
        {'name': 'Cleaning', 'examples': ['Washing Machine', 'Dryer', 'Vacuum Cleaner', 'Dishwasher']},
        {'name': 'Entertainment', 'examples': ['TV', 'Sound System', 'Gaming Console', 'Computer']},
        {'name': 'Lighting', 'examples': ['LED Bulbs', 'Tube Lights', 'Decorative Lights']},
        {'name': 'Other', 'examples': ['Phone Charger', 'Router', 'Security Camera']}
    ]
    
    return {
        'success': True,
        'categories': categories
    }


@router.get("/common-appliances", response_model=dict)
def get_common_appliances():
    """Get list of common appliances with typical wattages"""
    common = [
        # Cooling
        {'name': 'Refrigerator', 'category': 'Cooling', 'typical_wattage': 150, 'usage': '24 hours'},
        {'name': 'Air Conditioner (1 Ton)', 'category': 'Cooling', 'typical_wattage': 1000, 'usage': '8-10 hours'},
        {'name': 'Ceiling Fan', 'category': 'Cooling', 'typical_wattage': 75, 'usage': '8-12 hours'},
        
        # Heating
        {'name': 'Electric Water Heater', 'category': 'Heating', 'typical_wattage': 2000, 'usage': '1-2 hours'},
        {'name': 'Iron', 'category': 'Heating', 'typical_wattage': 1000, 'usage': '30 min'},
        {'name': 'Hair Dryer', 'category': 'Heating', 'typical_wattage': 1500, 'usage': '15 min'},
        
        # Cooking
        {'name': 'Rice Cooker', 'category': 'Cooking', 'typical_wattage': 700, 'usage': '30 min, 3x/day'},
        {'name': 'Microwave', 'category': 'Cooking', 'typical_wattage': 1200, 'usage': '15 min, 2x/day'},
        {'name': 'Electric Kettle', 'category': 'Cooking', 'typical_wattage': 1500, 'usage': '5 min, 3x/day'},
        {'name': 'Air Fryer', 'category': 'Cooking', 'typical_wattage': 1500, 'usage': '20 min, 1x/day'},
        {'name': 'Electric Oven', 'category': 'Cooking', 'typical_wattage': 2000, 'usage': '45 min, 2x/week'},
        {'name': 'Induction Cooktop', 'category': 'Cooking', 'typical_wattage': 2000, 'usage': '30 min, 2x/day'},
        
        # Cleaning
        {'name': 'Washing Machine', 'category': 'Cleaning', 'typical_wattage': 500, 'usage': '1 hour, 2x/week'},
        {'name': 'Vacuum Cleaner', 'category': 'Cleaning', 'typical_wattage': 1200, 'usage': '30 min, 1x/week'},
        {'name': 'Dishwasher', 'category': 'Cleaning', 'typical_wattage': 1500, 'usage': '1 hour, 1x/day'},
        
        # Entertainment
        {'name': 'LED TV (42")', 'category': 'Entertainment', 'typical_wattage': 80, 'usage': '4-6 hours'},
        {'name': 'Desktop Computer', 'category': 'Entertainment', 'typical_wattage': 200, 'usage': '6-8 hours'},
        {'name': 'Laptop', 'category': 'Entertainment', 'typical_wattage': 50, 'usage': '6-8 hours'},
        {'name': 'Gaming Console', 'category': 'Entertainment', 'typical_wattage': 150, 'usage': '2-3 hours'},
        
        # Lighting
        {'name': 'LED Bulb (9W)', 'category': 'Lighting', 'typical_wattage': 9, 'usage': '6-8 hours'},
        {'name': 'Tube Light (20W)', 'category': 'Lighting', 'typical_wattage': 20, 'usage': '6-8 hours'},
        
        # Other
        {'name': 'WiFi Router', 'category': 'Other', 'typical_wattage': 10, 'usage': '24 hours'},
        {'name': 'Phone Charger', 'category': 'Other', 'typical_wattage': 5, 'usage': '2 hours'},
    ]
    
    return {
        'success': True,
        'count': len(common),
        'appliances': common,
        'note': 'Typical wattages are estimates. Check your appliance label for exact values.'
    }


@router.post("/recognize-from-image", response_model=dict)
async def recognize_appliance_from_image(
    file: UploadFile = File(..., description="Appliance image (JPG, PNG)"),
    db: Session = Depends(get_db)
):
    """
    Recognize appliance and extract power consumption from image
    
    Upload an image of:
    - The appliance itself (for classification)
    - The power label/specification sticker (for wattage extraction)
    
    Returns:
    - Appliance type classification
    - Extracted or estimated wattage
    - Category and typical usage patterns
    """
    # Validate file type
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ['jpg', 'jpeg', 'png', 'webp']:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: JPG, PNG, WEBP"
        )
    
    # Create temp directory
    temp_dir = Path("uploads/temp_appliances")
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    # Save uploaded file
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_path = temp_dir / f"{timestamp}_{file.filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Recognize appliance
        recognition_service = get_recognition_service()
        result = recognition_service.recognize_appliance(str(file_path))
        
        if not result['success']:
            return {
                'success': False,
                'message': 'Could not recognize appliance',
                'error': result.get('error'),
                'suggestion': 'Try uploading a clearer image or the power label'
            }
        
        # Return structured data for frontend
        return {
            'success': True,
            'message': 'Appliance recognized successfully',
            'data': {
                'appliance_name': result.get('appliance_name', 'Unknown Appliance'),
                'category': result.get('category', 'Other'),
                'wattage': result['recommended_wattage'],
                'wattage_source': result['wattage_source'],
                'confidence': result.get('confidence', 0),
                'classification_details': result.get('classification'),
                'power_extraction_details': result.get('power_extraction')
            },
            'suggested_values': {
                'appliance_name': result.get('appliance_name', ''),
                'appliance_category': result.get('category', 'Other'),
                'wattage': result['recommended_wattage'],
                'usage_duration_minutes': 60,
                'usage_times_per_day': 1,
                'usage_frequency': 'daily'
            }
        }
        
    except Exception as e:
        logger.error(f"Error recognizing appliance: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up temp file
        if file_path.exists():
            file_path.unlink()