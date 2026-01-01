"""
api/routes/bill_analysis.py
COMPLETE implementation with Phase 2 tracking
Add this to your src/api/routes/ directory
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from src.database import get_db
from src.services.bill_analysis import BillAnalysisService
from src.models.bill import ElectricityBill
from src.models.budget_plan import BudgetPlan, MeterReading
from fastapi import APIRouter, Depends, HTTPException, Query  # ✅ Add Query import at top


router = APIRouter(prefix="/analysis", tags=["Bill Analysis"])
analysis_service = BillAnalysisService()


# ========== REQUEST/RESPONSE MODELS ==========

class BudgetPlanRequest(BaseModel):
    bill_id: int = Field(description="Past bill ID to base planning on")
    target_budget: float = Field(gt=0, description="Target budget in Rs.")
    planning_days: int = Field(default=30, ge=28, le=35, description="Days to plan for")


class MeterReadingRequest(BaseModel):
    plan_id: int = Field(description="Budget plan ID")
    current_reading: int = Field(ge=0, description="Current meter reading")
    reading_date: datetime = Field(default_factory=datetime.now, description="Date and time of reading")
    notes: Optional[str] = Field(None, description="Optional notes")


class ManualBillDataRequest(BaseModel):
    """For users without past bills in system"""
    current_meter_reading: int = Field(ge=0)
    past_bill_date: datetime
    past_bill_amount: float = Field(gt=0)
    past_bill_units: int = Field(gt=0)
    past_bill_days: int = Field(default=30, ge=28, le=35)


# ========== PHASE 1 ENDPOINTS ==========

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


@router.post("/manual-analysis")
def analyze_manual_data(
    request: ManualBillDataRequest
):
    """
    Analyze manually entered bill data (for users without bills in system)
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
    units: int = Query(ge=0, description="Units consumed"),  # ✅ Changed Field to Query
    days: int = Query(default=30, ge=28, le=35, description="Billing period days")  # ✅ Changed Field to Query
):
    """
    Calculate bill using CEB tariff structure
    """
    result = analysis_service.tariff_calculator.calculate_bill(units, days)
    
    return {
        'success': True,
        'calculation': result
    }

# ========== PHASE 2 ENDPOINTS (BUDGET PLANNING & TRACKING) ==========

@router.post("/create-budget-plan")
def create_budget_plan(
    request: BudgetPlanRequest,
    db: Session = Depends(get_db)
):
    """
    Create a budget plan for next billing period
    
    PHASE 2 IMPLEMENTATION:
    - Validates budget is within 50%-150% of past bill
    - Creates daily and weekly targets
    - Generates monitoring schedule
    - Saves plan to database
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
    
    # Create the plan
    plan = analysis_service.create_budget_plan(
        bill_data,
        request.target_budget,
        request.planning_days
    )
    
    # Check for validation errors
    if 'error' in plan:
        raise HTTPException(status_code=400, detail=plan['message'])
    
    # ✅ PHASE 2: Save plan to database
    try:
        plan_record = BudgetPlan(
            reference_bill_id=request.bill_id,
            account_number=bill.account_number,
            target_budget=request.target_budget,
            planning_days=request.planning_days,
            plan_start_date=datetime.now(),
            plan_end_date=datetime.now() + timedelta(days=request.planning_days),
            target_daily_units=plan['daily_targets']['units'],
            target_daily_cost=plan['daily_targets']['cost'],
            target_weekly_units=plan['weekly_targets'][0]['target_units'],
            target_weekly_cost=plan['weekly_targets'][0]['target_cost'],
            target_total_units=plan['total_targets']['units'],
            past_bill_amount=bill.total_due,
            past_bill_units=bill.units_consumed,
            past_billing_days=bill.billing_period_days,
            weekly_targets=plan['weekly_targets'],
            monitoring_schedule=plan['monitoring_schedule'],
            recommendations=plan['recommendations']
        )
        
        db.add(plan_record)
        db.commit()
        db.refresh(plan_record)
        
        return {
            'success': True,
            'message': 'Budget plan created and saved successfully',
            'plan_id': plan_record.id,
            'bill_id': request.bill_id,
            'plan': plan
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving plan: {str(e)}")


@router.post("/track-progress")
def track_budget_progress(
    request: MeterReadingRequest,
    db: Session = Depends(get_db)
):
    """
    Track progress against budget plan using current meter reading
    
    PHASE 2 IMPLEMENTATION:
    - Compares actual vs expected consumption
    - Shows if on track, over, or under budget
    - Projects final cost
    - Provides actionable recommendations
    - Saves meter reading to database
    """
    # Get the budget plan
    plan = db.query(BudgetPlan).filter(BudgetPlan.id == request.plan_id).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Budget plan not found")
    
    # Get reference bill
    bill = plan.reference_bill
    
    if not bill:
        raise HTTPException(status_code=404, detail="Reference bill not found")
    
    # Determine starting point
    # Check if there are previous readings
    first_reading = db.query(MeterReading).filter(
        MeterReading.budget_plan_id == request.plan_id
    ).order_by(MeterReading.reading_date).first()
    
    if first_reading:
        # Use first reading as baseline
        start_reading = first_reading.reading_value
        start_date = first_reading.reading_date
    else:
        # Use reference bill's current reading as baseline
        start_reading = bill.current_reading
        start_date = plan.plan_start_date
    
    # Prepare plan data for tracking
    plan_data = {
        'daily_targets': {
            'units': plan.target_daily_units,
            'cost': plan.target_daily_cost
        },
        'total_targets': {
            'days': plan.planning_days
        },
        'budget_info': {
            'target_budget': plan.target_budget
        }
    }
    
    # Calculate progress
    try:
        progress = analysis_service.track_progress(
            plan_data,
            request.current_reading,
            request.reading_date,
            start_reading,
            start_date
        )
        
        # ✅ PHASE 2: Save meter reading to database
        variance_percentage = 0
        if progress['current_status']['expected_cost'] > 0:
            variance_percentage = (
                progress['current_status']['variance_cost'] / 
                progress['current_status']['expected_cost'] * 100
            )
        
        reading_record = MeterReading(
            budget_plan_id=request.plan_id,
            reading_value=request.current_reading,
            reading_date=request.reading_date,
            units_consumed_so_far=progress['current_status']['units_used'],
            days_elapsed=progress['current_status']['days_elapsed'],
            actual_cost_so_far=progress['current_status']['actual_cost'],
            expected_cost_so_far=progress['current_status']['expected_cost'],
            variance_units=progress['current_status']['variance_units'],
            variance_cost=progress['current_status']['variance_cost'],
            variance_percentage=variance_percentage,
            status=progress['current_status']['status'],
            projected_total_units=progress['projection']['projected_total_units'],
            projected_total_cost=progress['projection']['projected_total_cost'],
            projected_budget_variance=progress['projection']['budget_variance'],
            analysis_data=progress,
            notes=request.notes
        )
        
        db.add(reading_record)
        
        # Update plan status
        plan.last_check_date = request.reading_date
        plan.current_progress_status = progress['current_status']['status']
        
        db.commit()
        db.refresh(reading_record)
        
        return {
            'success': True,
            'message': 'Progress tracked successfully',
            'reading_id': reading_record.id,
            'plan_id': request.plan_id,
            'progress': progress
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error tracking progress: {str(e)}")


@router.get("/plans/{plan_id}")
def get_plan_details(
    plan_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a budget plan"""
    plan = db.query(BudgetPlan).filter(BudgetPlan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Get all meter readings for this plan
    readings = db.query(MeterReading).filter(
        MeterReading.budget_plan_id == plan_id
    ).order_by(MeterReading.reading_date).all()
    
    return {
        'success': True,
        'plan': {
            'id': plan.id,
            'account_number': plan.account_number,
            'target_budget': plan.target_budget,
            'planning_days': plan.planning_days,
            'plan_start_date': plan.plan_start_date,
            'plan_end_date': plan.plan_end_date,
            'status': plan.status,
            'current_progress_status': plan.current_progress_status,
            'target_daily_units': plan.target_daily_units,
            'target_daily_cost': plan.target_daily_cost,
            'weekly_targets': plan.weekly_targets,
            'monitoring_schedule': plan.monitoring_schedule,
            'recommendations': plan.recommendations
        },
        'readings_count': len(readings),
        'latest_reading': readings[-1].reading_value if readings else None,
        'last_check_date': plan.last_check_date
    }


@router.get("/plans/account/{account_number}")
def get_plans_by_account(
    account_number: str,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all budget plans for an account"""
    query = db.query(BudgetPlan).filter(
        BudgetPlan.account_number == account_number
    )
    
    if active_only:
        query = query.filter(BudgetPlan.is_active == True)
    
    plans = query.order_by(BudgetPlan.created_at.desc()).all()
    
    return {
        'success': True,
        'count': len(plans),
        'plans': [
            {
                'id': p.id,
                'target_budget': p.target_budget,
                'planning_days': p.planning_days,
                'status': p.status,
                'progress_status': p.current_progress_status,
                'created_at': p.created_at,
                'plan_start_date': p.plan_start_date,
                'plan_end_date': p.plan_end_date
            }
            for p in plans
        ]
    }


@router.get("/readings/plan/{plan_id}")
def get_plan_readings(
    plan_id: int,
    db: Session = Depends(get_db)
):
    """Get all meter readings for a budget plan"""
    readings = db.query(MeterReading).filter(
        MeterReading.budget_plan_id == plan_id
    ).order_by(MeterReading.reading_date).all()
    
    return {
        'success': True,
        'plan_id': plan_id,
        'count': len(readings),
        'readings': [
            {
                'id': r.id,
                'reading_value': r.reading_value,
                'reading_date': r.reading_date,
                'days_elapsed': r.days_elapsed,
                'units_consumed': r.units_consumed_so_far,
                'actual_cost': r.actual_cost_so_far,
                'expected_cost': r.expected_cost_so_far,
                'variance_cost': r.variance_cost,
                'status': r.status,
                'projected_total_cost': r.projected_total_cost
            }
            for r in readings
        ]
    }


# ========== UTILITY ENDPOINTS ==========

@router.get("/compare-periods")
def compare_billing_periods(
    bill_id_1: int,
    bill_id_2: int,
    db: Session = Depends(get_db)
):
    """Compare two billing periods to identify trends"""
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
    """Get smart budget recommendations based on past bill"""
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
    conservative_budget = past_cost * 0.9
    moderate_budget = past_cost * 0.8
    aggressive_budget = past_cost * 0.7
    
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