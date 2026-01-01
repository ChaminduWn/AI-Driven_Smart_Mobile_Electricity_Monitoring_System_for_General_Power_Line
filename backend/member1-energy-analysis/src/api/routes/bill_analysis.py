"""
api/routes/bill_analysis.py
API routes for bill analysis and budget planning
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

from src.database import get_db
from src.services.bill_analysis import BillAnalysisService
from src.models.bill import ElectricityBill


router = APIRouter(prefix="/analysis", tags=["Bill Analysis"])
analysis_service = BillAnalysisService()


# Request/Response Models
class BudgetPlanRequest(BaseModel):
    bill_id: int = Field(description="Past bill ID to base planning on")
    target_budget: float = Field(gt=0, description="Target budget in Rs.")
    planning_days: int = Field(default=30, ge=28, le=35, description="Days to plan for")


class MeterReadingRequest(BaseModel):
    plan_id: int = Field(description="Budget plan ID")
    current_reading: int = Field(ge=0, description="Current meter reading")
    reading_date: datetime = Field(description="Date and time of reading")


class ManualBillDataRequest(BaseModel):
    """For users without past bills in system"""
    current_meter_reading: int = Field(ge=0)
    past_bill_date: datetime
    past_bill_amount: float = Field(gt=0)
    past_bill_units: int = Field(gt=0)
    past_bill_days: int = Field(default=30, ge=28, le=35)


# Routes
@router.get("/past-month/{bill_id}")
def analyze_past_month_bill(
    bill_id: int,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive analysis of a past month bill
    
    Returns:
    - Daily and weekly consumption averages
    - Week-by-week breakdown
    - Cost analysis
    - Tariff details
    """
    bill = db.query(ElectricityBill).filter(ElectricityBill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    if not bill.units_consumed or not bill.billing_period_days:
        raise HTTPException(
            status_code=400, 
            detail="Bill missing required data (units_consumed, billing_period_days)"
        )
    
    bill_data = {
        'units_consumed': bill.units_consumed,
        'billing_period_days': bill.billing_period_days,
        'total_due': bill.total_due or 0,
        'bill_date': bill.bill_date
    }
    
    analysis = analysis_service.analyze_past_month(bill_data)
    
    return {
        'success': True,
        'bill_id': bill_id,
        'account_number': bill.account_number,
        'bill_date': bill.bill_date,
        'analysis': analysis
    }


@router.post("/create-budget-plan")
def create_budget_plan(
    request: BudgetPlanRequest,
    db: Session = Depends(get_db)
):
    """
    Create a budget plan for next billing period
    
    - Validates budget is within 50%-150% of past bill
    - Creates daily and weekly targets
    - Generates monitoring schedule
    - Provides recommendations
    """
    bill = db.query(ElectricityBill).filter(
        ElectricityBill.id == request.bill_id
    ).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    bill_data = {
        'units_consumed': bill.units_consumed,
        'billing_period_days': bill.billing_period_days,
        'total_due': bill.total_due or 0
    }
    
    plan = analysis_service.create_budget_plan(
        bill_data,
        request.target_budget,
        request.planning_days
    )
    
    # Check for errors
    if 'error' in plan:
        raise HTTPException(status_code=400, detail=plan['message'])
    
    # TODO: Save plan to database for tracking
    # For now, return the plan
    
    return {
        'success': True,
        'message': 'Budget plan created successfully',
        'bill_id': request.bill_id,
        'plan': plan
    }


@router.post("/track-progress")
def track_budget_progress(
    request: MeterReadingRequest,
    db: Session = Depends(get_db)
):
    """
    Track progress against budget plan using current meter reading
    
    - Compares actual vs expected consumption
    - Shows if on track, over, or under budget
    - Projects final cost
    - Provides actionable recommendations
    """
    # TODO: Retrieve plan from database using plan_id
    # For now, this is a placeholder showing the flow
    
    # This would retrieve the saved plan and bill data
    # plan_data = get_plan_from_db(request.plan_id)
    # bill = get_bill_from_plan(plan_data)
    
    # Placeholder response
    raise HTTPException(
        status_code=501,
        detail="Progress tracking requires storing plans in database. "
               "Please implement BudgetPlan model first."
    )


@router.post("/manual-analysis")
def analyze_manual_data(
    request: ManualBillDataRequest
):
    """
    Analyze manually entered bill data (for users without bills in system)
    
    Useful when:
    - User hasn't uploaded past bill yet
    - User wants quick analysis
    """
    bill_data = {
        'units_consumed': request.past_bill_units,
        'billing_period_days': request.past_bill_days,
        'total_due': request.past_bill_amount,
        'bill_date': request.past_bill_date
    }
    
    analysis = analysis_service.analyze_past_month(bill_data)
    
    return {
        'success': True,
        'message': 'Analysis completed for manual data',
        'analysis': analysis
    }


@router.get("/tariff-calculator")
def calculate_tariff(
    units: int = Field(ge=0, description="Units consumed"),
    days: int = Field(default=30, ge=28, le=35, description="Billing period days")
):
    """
    Calculate bill using CEB tariff structure
    
    Useful for:
    - What-if scenarios
    - Understanding bill components
    - Planning consumption
    """
    result = analysis_service.tariff_calculator.calculate_bill(units, days)
    
    return {
        'success': True,
        'calculation': result
    }


@router.get("/compare-periods")
def compare_billing_periods(
    bill_id_1: int,
    bill_id_2: int,
    db: Session = Depends(get_db)
):
    """
    Compare two billing periods to identify trends
    """
    bill1 = db.query(ElectricityBill).filter(ElectricityBill.id == bill_id_1).first()
    bill2 = db.query(ElectricityBill).filter(ElectricityBill.id == bill_id_2).first()
    
    if not bill1 or not bill2:
        raise HTTPException(status_code=404, detail="One or both bills not found")
    
    # Normalize to 30-day period for fair comparison
    bill1_daily = bill1.units_consumed / bill1.billing_period_days
    bill2_daily = bill2.units_consumed / bill2.billing_period_days
    
    bill1_normalized = bill1_daily * 30
    bill2_normalized = bill2_daily * 30
    
    difference_units = bill2_normalized - bill1_normalized
    difference_percent = (difference_units / bill1_normalized) * 100 if bill1_normalized > 0 else 0
    
    cost1_normalized = (bill1.total_due / bill1.billing_period_days) * 30
    cost2_normalized = (bill2.total_due / bill2.billing_period_days) * 30
    
    cost_difference = cost2_normalized - cost1_normalized
    cost_percent = (cost_difference / cost1_normalized) * 100 if cost1_normalized > 0 else 0
    
    return {
        'success': True,
        'comparison': {
            'period_1': {
                'bill_id': bill_id_1,
                'date': bill1.bill_date,
                'units': bill1.units_consumed,
                'days': bill1.billing_period_days,
                'cost': bill1.total_due,
                'normalized_units_30d': round(bill1_normalized, 2),
                'normalized_cost_30d': round(cost1_normalized, 2)
            },
            'period_2': {
                'bill_id': bill_id_2,
                'date': bill2.bill_date,
                'units': bill2.units_consumed,
                'days': bill2.billing_period_days,
                'cost': bill2.total_due,
                'normalized_units_30d': round(bill2_normalized, 2),
                'normalized_cost_30d': round(cost2_normalized, 2)
            },
            'differences': {
                'units_change': round(difference_units, 2),
                'units_change_percent': round(difference_percent, 2),
                'cost_change': round(cost_difference, 2),
                'cost_change_percent': round(cost_percent, 2),
                'trend': 'increasing' if difference_units > 0 else 'decreasing'
            }
        }
    }


@router.get("/budget-recommendations/{bill_id}")
def get_budget_recommendations(
    bill_id: int,
    db: Session = Depends(get_db)
):
    """
    Get smart budget recommendations based on past bill
    
    Suggests:
    - Realistic budget ranges
    - Potential savings opportunities
    - Consumption reduction strategies
    """
    bill = db.query(ElectricityBill).filter(ElectricityBill.id == bill_id).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    past_cost = bill.total_due or 0
    past_units = bill.units_consumed or 0
    days = bill.billing_period_days or 30
    
    # Calculate threshold impact
    adjusted_threshold = 60 * (days / 30)
    
    recommendations = []
    
    if past_units > adjusted_threshold:
        # Calculate savings if stayed under threshold
        under_threshold_calc = analysis_service.tariff_calculator.calculate_bill(
            int(adjusted_threshold) - 1, days
        )
        potential_savings = past_cost - under_threshold_calc['total']
        
        recommendations.append({
            'type': 'threshold_optimization',
            'priority': 'high',
            'title': 'Stay Below 60 kWh Threshold',
            'description': f'You exceeded the {adjusted_threshold:.0f} kWh threshold. '
                          f'Staying just below could save Rs. {potential_savings:.2f}',
            'action': f'Reduce consumption to {int(adjusted_threshold) - 1} kWh',
            'savings': round(potential_savings, 2)
        })
    
    # Budget range suggestions
    conservative_budget = past_cost * 0.9  # 10% reduction
    moderate_budget = past_cost * 0.8  # 20% reduction
    aggressive_budget = past_cost * 0.7  # 30% reduction (if above threshold)
    
    recommendations.append({
        'type': 'budget_options',
        'priority': 'medium',
        'title': 'Suggested Budget Ranges',
        'options': [
            {
                'level': 'conservative',
                'budget': round(conservative_budget, 2),
                'reduction': '10%',
                'difficulty': 'easy'
            },
            {
                'level': 'moderate',
                'budget': round(moderate_budget, 2),
                'reduction': '20%',
                'difficulty': 'medium'
            },
            {
                'level': 'aggressive',
                'budget': round(aggressive_budget, 2),
                'reduction': '30%',
                'difficulty': 'hard'
            }
        ]
    })
    
    return {
        'success': True,
        'bill_id': bill_id,
        'current_cost': past_cost,
        'current_units': past_units,
        'recommendations': recommendations
    }