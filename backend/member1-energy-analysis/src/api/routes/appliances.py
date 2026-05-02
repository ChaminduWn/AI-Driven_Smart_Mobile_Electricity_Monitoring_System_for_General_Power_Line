"""
src/api/routes/appliances.py
PHASE 3: Appliance Management System
"""

from fastapi import UploadFile, File
import shutil
from pathlib import Path
from src.services.appliance_recognition_v2 import GeminiVisionRecognitionService
from src.services.appliance_recognition import ApplianceRecognitionService
from src.config import settings
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
from src.database import get_db
from src.models.budget_plan import HouseholdAppliance
from src.models.user import User
from src.api.routes.auth import get_user_from_token
from src.services.bill_analysis import BillAnalysisService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/appliances", tags=["Appliance Management"])
analysis_service = BillAnalysisService()


# ========== REQUEST/RESPONSE MODELS ==========

class ApplianceCreate(BaseModel):
    account_number: Optional[str] = Field(None, description="Account number")
    appliance_name: str = Field(..., min_length=1, max_length=255, description="Name of appliance")
    appliance_category: Optional[str] = Field(None, description="Category (cooling, heating, entertainment, etc.)")
    wattage: int = Field(..., gt=0, description="Power consumption in Watts")
    quantity: int = Field(1, gt=0, description="Number of units")
    usage_duration_minutes: int = Field(60, gt=0, description="Duration per use in minutes")
    usage_times_per_day: int = Field(1, gt=0, description="How many times used per day")
    usage_frequency: str = Field('daily', description="Frequency: daily, weekly, monthly")
    bill_id: Optional[int] = Field(None, description="Optional link to a specific bill")


class ApplianceUpdate(BaseModel):
    appliance_name: Optional[str] = None
    appliance_category: Optional[str] = None
    wattage: Optional[int] = None
    quantity: Optional[int] = None
    usage_duration_minutes: Optional[int] = None
    usage_times_per_day: Optional[int] = None
    usage_frequency: Optional[str] = None
    is_active: Optional[bool] = None


class ApplianceResponse(BaseModel):
    id: int
    appliance_name: str
    appliance_category: Optional[str]
    wattage: int
    quantity: int = 1
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
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
            user_id=current_user.id,
            account_number=appliance.account_number,
            bill_id=appliance.bill_id,
            appliance_name=appliance.appliance_name,
            appliance_category=appliance.appliance_category,
            wattage=appliance.wattage,
            quantity=appliance.quantity,
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
    account_number: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """Get all appliances for a user"""
    query = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.user_id == current_user.id
    )

    if account_number:
        query = query.filter(HouseholdAppliance.account_number == account_number)

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
                'quantity': a.quantity or 1,
                'usage': f"{a.quantity if a.quantity and a.quantity > 1 else ''} {a.usage_times_per_day}x per day, {a.usage_duration_minutes} min each",
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
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
    query = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.user_id == current_user.id,
        HouseholdAppliance.is_active == True
    )
    if account_number:
        query = query.filter(HouseholdAppliance.account_number == account_number)

    appliances = query.all()

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """
    Get smart recommendations for reducing consumption

    Analyzes:
    - High-consumption appliances
    - Usage patterns
    - Potential savings
    """
    query = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.user_id == current_user.id,
        HouseholdAppliance.is_active == True
    )
    if account_number:
        query = query.filter(HouseholdAppliance.account_number == account_number)

    appliances = query.all()

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """Update appliance details"""
    appliance = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.id == appliance_id,
        HouseholdAppliance.user_id == current_user.id
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """Delete an appliance (soft delete by default)"""
    appliance = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.id == appliance_id,
        HouseholdAppliance.user_id == current_user.id
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

        # Check if appliance count fell below 5
        from src.models.budget_plan import BudgetPlan

        remaining_count = db.query(HouseholdAppliance).filter(
            HouseholdAppliance.user_id == current_user.id,
            HouseholdAppliance.account_number == appliance.account_number,
            HouseholdAppliance.is_active == True
        ).count()

        plans_stopped = 0
        warning = None

        if remaining_count < 5:
            # Auto-stop active budget plans for this account
            active_plans = db.query(BudgetPlan).filter(
                BudgetPlan.user_id == current_user.id,
                BudgetPlan.account_number == appliance.account_number,
                BudgetPlan.is_active == True
            ).all()

            for plan in active_plans:
                plan.is_active = False
                plan.status = 'stopped_insufficient_appliances'
                plans_stopped += 1

            db.commit()

            if plans_stopped > 0:
                warning = f"Appliance count is now {remaining_count} (below minimum of 5). {plans_stopped} active budget plan(s) have been stopped."
            else:
                warning = f"Appliance count is now {remaining_count}. You need at least 5 appliances to start a new budget plan."

        return {
            'success': True,
            'message': message,
            'remaining_count': remaining_count,
            'warning': warning,
            'plans_stopped': plans_stopped
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories", response_model=dict)
def get_appliance_categories():
    """Get list of common appliance categories"""
    categories = [
        {'name': 'Cooling', 'examples': ['Refrigerator', 'Freezer', 'Air Conditioner', 'Fan']},
        {'name': 'Heating', 'examples': ['Electric Heater', 'Water Heater', 'Iron']},
        {'name': 'Cooking', 'examples': ['Electric Stove', 'Microwave', 'Rice Cooker', 'Toaster', 'Air Fryer', 'Oven']},
        {'name': 'Laundry', 'examples': ['Washing Machine', 'Dryer']},
        {'name': 'Cleaning', 'examples': ['Vacuum Cleaner', 'Dishwasher', 'Steam Mop']},
        {'name': 'Entertainment', 'examples': ['TV', 'Sound System', 'Gaming Console']},
        {'name': 'Lighting', 'examples': ['LED Bulbs', 'Tube Lights', 'Decorative Lights']},
        {'name': 'Office', 'examples': ['Desktop Computer', 'Laptop', 'Printer', 'Monitor', 'Router']},
        {'name': 'Water', 'examples': ['Water Pump', 'Water Filter', 'UV Purifier']},
        {'name': 'Safety', 'examples': ['Security Camera', 'Gate Motor', 'Alarm System']},
        {'name': 'Health/Beauty', 'examples': ['Hair Dryer', 'Straightener', 'Electric Shaver']},
        {'name': 'Outdoor/Garden', 'examples': ['Lawn Mower', 'Pool Pump', 'Garden Lighting']},
        {'name': 'Other', 'examples': ['Phone Charger', 'UPS', 'Electric Toothbrush']}
    ]

    return {
        'success': True,
        'categories': categories
    }


@router.get("/common-appliances", response_model=dict)
def get_common_appliances():
    """Get list of common appliances with typical wattages"""
    common = [
        # Essential Top 10 Common Appliances
        {'name': 'Refrigerator', 'category': 'Cooling', 'typical_wattage': 150, 'usage': '24 hours'},
        {'name': 'Ceiling Fan', 'category': 'Cooling', 'typical_wattage': 75, 'usage': '12 hours'},
        {'name': 'LED Bulb (9W)', 'category': 'Lighting', 'typical_wattage': 9, 'usage': '8 hours'},
        {'name': 'Smart TV', 'category': 'Entertainment', 'typical_wattage': 100, 'usage': '5 hours'},
        {'name': 'Washing Machine', 'category': 'Laundry', 'typical_wattage': 500, 'usage': '1 hour'},
        {'name': 'Electric Iron', 'category': 'Laundry', 'typical_wattage': 1000, 'usage': '20 min'},
        {'name': 'Rice Cooker', 'category': 'Cooking', 'typical_wattage': 700, 'usage': '45 min'},
        {'name': 'Air Conditioner', 'category': 'Cooling', 'typical_wattage': 1500, 'usage': '6 hours'},
        {'name': 'Electric Kettle', 'category': 'Cooking', 'typical_wattage': 2000, 'usage': '10 min'},
        {'name': 'Laptop', 'category': 'Office', 'typical_wattage': 65, 'usage': '8 hours'},
    ]

    return {
        'success': True,
        'count': len(common),
        'appliances': common,
        'note': 'Top 10 most common household appliances.'
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

    # Save uploaded file with a UUID to avoid filename collisions
    import uuid
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_name = f"{timestamp}_{uuid.uuid4()}.{file_ext}"
    file_path = temp_dir / unique_name

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        recognition_result = None
        attempted_v2 = False
        
        # --- ATTEMPT 1: CLIP Local Model (V1) ---
        try:
            logger.info("Attempting local appliance recognition with CLIP (V1)...")
            clip_v1 = ApplianceRecognitionService()
            v1_result = clip_v1.recognize_appliance(str(file_path))
            
            # Use CLIP if it succeeded AND has high confidence (>= 0.6)
            if v1_result.get('success') and v1_result.get('confidence', 0) >= 0.6:
                recognition_result = v1_result
                logger.info(f"CLIP V1 succeeded with {v1_result['confidence']*100}% confidence")
            else:
                logger.warning(f"CLIP V1 failed or has low confidence: {v1_result.get('error') or 'low confidence'}")
        except Exception as e:
            logger.error(f"CLIP V1 critical error: {e}")

        # --- ATTEMPT 2: Fallback to Gemini AI (V2) ---
        if not recognition_result and settings.GEMINI_API_KEY:
            try:
                logger.info("Falling back to Gemini AI (V2)...")
                gemini_v2 = GeminiVisionRecognitionService()
                v2_result = gemini_v2.recognize_appliance(str(file_path))
                
                if v2_result.get('success'):
                    recognition_result = v2_result
                    attempted_v2 = True
                    logger.info(f"Gemini V2 fallback succeeded with {v2_result.get('confidence', 0)*100}% confidence")
                else:
                    logger.warning(f"Gemini V2 fallback also failed: {v2_result.get('error')}")
            except Exception as e:
                logger.error(f"Gemini V2 fallback critical error: {e}")

        if not recognition_result or not recognition_result.get('success'):
            return {
                'success': False,
                'message': 'Could not recognize appliance with any model',
                'suggestion': 'Try a clearer photo or manually select from templates.'
            }

        # Normalize result for frontend
        app_name = recognition_result.get('appliance_name', 'Unknown')
        cat = recognition_result.get('category', 'Other')
        wattage = recognition_result.get('recommended_wattage', 100)
        source = recognition_result.get('wattage_source', 'estimated')

        return {
            'success': True,
            'message': 'Appliance recognized successfully',
            'data': {
                'appliance_name': app_name,
                'category': cat,
                'wattage': wattage,
                'wattage_source': source,
                'confidence': recognition_result.get('confidence', 0),
                'method': 'gemini_v2' if attempted_v2 and recognition_result == v2_result else 'clip_v1',
            },
            'suggested_values': {
                'appliance_name': app_name,
                'appliance_category': cat,
                'wattage': wattage,
                'usage_duration_minutes': 60,
                'usage_times_per_day': 1,
                'usage_frequency': 'daily'
            }
        }

    except Exception as e:
        logger.error(f"Error recognizing appliance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # ✅ Windows-safe cleanup: PIL releases handle via .copy() in the service,
        # but we still guard here with a fallback gc.collect() just in case.
        if file_path.exists():
            try:
                file_path.unlink()
            except PermissionError:
                import gc
                gc.collect()
                try:
                    file_path.unlink()
                except PermissionError:
                    # File will be cleaned up on next server restart
                    logger.warning(f"Could not delete temp file (still locked): {file_path}")

class AIAnalysisRequest(BaseModel):
    user_prompt: str

@router.post("/ai-analysis/{account_number}")
async def analyze_appliance_data_ai(
    account_number: str,
    request: AIAnalysisRequest,
    db: Session = Depends(get_db)
):
    import httpx
    import os
    
    # 1. Gather context
    appliances = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.account_number == account_number,
        HouseholdAppliance.is_active == True
    ).all()
    
    context = "User Appliances:\n"
    for a in appliances:
        daily_kwh = a.daily_kwh if a.daily_kwh is not None else 0
        context += f"- {a.appliance_name} ({a.wattage}W, uses {daily_kwh:.2f} kWh/day)\n"
    
    prompt = f"Context:\n{context}\n\nUser Question: {request.user_prompt}\n\nRespond briefly with actionable energy-saving advice."
    
    # 2. Call Gemini
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        return {"success": False, "answer": "AI API Key is missing on the server. Please contact logic administrator."}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}",
                json={"contents": [{"parts": [{"text": prompt}]}]}
            )
            data = response.json()
            if "candidates" in data and data["candidates"]:
                answer = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"success": True, "answer": answer}
            else:
                return {"success": False, "answer": "I received an unexpected response structure from Gemini."}
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return {"success": False, "answer": "I'm having trouble connecting to my AI brain right now. Try again later!"}