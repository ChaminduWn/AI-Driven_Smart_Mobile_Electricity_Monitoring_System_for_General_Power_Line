"""
FIXED: api/routes/bill_analysis.py
Updated to use total_charge instead of total_due
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field

from src.database import get_db
from src.services.bill_analysis import BillAnalysisService
from src.models.bill import ElectricityBill
from src.models.user import User
from src.models.budget_plan import BudgetPlan, MeterReading, HouseholdAppliance
from src.services.recommendation_engine import RecommendationEngine
from src.api.routes.auth import get_user_from_token

router = APIRouter(prefix="/analysis", tags=["Bill Analysis"])
analysis_service = BillAnalysisService()
recommendation_engine = RecommendationEngine()


# ========== REQUEST/RESPONSE MODELS ==========

class BudgetPlanRequest(BaseModel):
    bill_id: int = Field(description="Past bill ID to base planning on")
    target_budget: float = Field(gt=0, description="Target budget in Rs.")
    planning_days: int = Field(default=30, ge=10, le=60, description="Days to plan for")


class BudgetPlanUpdate(BaseModel):
    target_budget: Optional[float] = Field(None, gt=0, description="Target budget in Rs.")
    planning_days: Optional[int] = Field(None, ge=10, le=60, description="Days to plan for")


class MeterReadingRequest(BaseModel):
    plan_id: int = Field(description="Budget plan ID")
    current_reading: int = Field(ge=0, description="Current meter reading")
    reading_date: datetime = Field(default_factory=datetime.now, description="Date and time of reading")
    notes: Optional[str] = Field(None, description="Optional notes")


class MeterReadingUpdate(BaseModel):
    """Update an existing meter reading (value, date, notes). Recalculates progress."""
    reading_value: int = Field(ge=0, description="Meter reading value")
    reading_date: datetime = Field(description="Date and time of reading")
    notes: Optional[str] = Field(None, description="Optional notes")


class ManualBillDataRequest(BaseModel):
    """For users without past bills in system"""
    current_meter_reading: int = Field(ge=0)
    past_bill_date: datetime
    past_bill_amount: float = Field(gt=0)
    past_bill_units: int = Field(gt=0)
    past_bill_days: int = Field(default=30, ge=10, le=60)


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
        'total_charge': bill.total_charge or 0,
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
        'total_charge': request.past_bill_amount,
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
    units: int = Query(ge=0, description="Units consumed"),
    days: int = Query(default=30, ge=10, le=60, description="Billing period days")
):
    """
    Calculate bill using CEB tariff structure
    """
    result = analysis_service.tariff_calculator.calculate_bill(units, days)
    
    return {
        'success': True,
        'calculation': result
    }


@router.post("/save-manual-bill")
def save_manual_bill(
    request: ManualBillDataRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """
    Save manually entered bill data as an ElectricityBill record.
    Useful for users who don't have a physical bill to upload.
    """
    account_number = current_user.selected_account
    if not account_number:
         raise HTTPException(status_code=400, detail="Please set a default account number in your profile first.")

    try:
        new_bill = ElectricityBill(
            user_id=current_user.id,
            account_number=account_number,
            bill_date=request.past_bill_date,
            units_consumed=request.past_bill_units,
            total_charge=request.past_bill_amount,
            billing_period_days=request.past_bill_days,
            current_reading=request.current_meter_reading,
            previous_reading=request.current_meter_reading - request.past_bill_units,
            is_manual=True
        )
        db.add(new_bill)
        db.commit()
        db.refresh(new_bill)

        from src.api.routes.notifications import create_notification
        create_notification(db, current_user.id, "Bill Added Manually", f"Your bill for {request.past_bill_units} units has been recorded.", "success")

        return {
            "success": True,
            "message": "Manual bill data saved successfully",
            "bill_id": new_bill.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving manual bill: {str(e)}")


# ========== PHASE 2 ENDPOINTS (BUDGET PLANNING & TRACKING) ==========

@router.post("/create-budget-plan")
def create_budget_plan(
    request: BudgetPlanRequest,
    db: Session = Depends(get_db)
):
    """
    Create a budget plan for next billing period
    """
    bill = db.query(ElectricityBill).filter(
        ElectricityBill.id == request.bill_id
    ).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    appliances_count = db.query(HouseholdAppliance).filter(
        HouseholdAppliance.account_number == bill.account_number,
        HouseholdAppliance.is_active == True
    ).count()

    if appliances_count == 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "No appliances found for this account. "
                "Please add your household appliances in the Appliance Manager "
                "before creating a budget plan."
            )
        )
    
    bill_data = {
        'units_consumed': bill.units_consumed,
        'billing_period_days': bill.billing_period_days,
        'total_charge': bill.total_charge or 0
    }
    
    plan = analysis_service.create_budget_plan(
        bill_data,
        request.target_budget,
        request.planning_days
    )
    
    if 'error' in plan:
        raise HTTPException(status_code=400, detail=plan['message'])
    
    try:
        plan_record = BudgetPlan(
            reference_bill_id=request.bill_id,
            bill_id=request.bill_id,
            user_id=bill.user_id,
            account_number=bill.account_number,
            target_budget=request.target_budget,
            planning_days=request.planning_days,
            plan_start_date=datetime.now(timezone.utc),
            plan_end_date=datetime.now(timezone.utc) + timedelta(days=request.planning_days),
            target_daily_units=plan['daily_targets']['units'],
            target_daily_cost=plan['daily_targets']['cost'],
            target_weekly_units=plan['weekly_targets'][0]['target_units'],
            target_weekly_cost=plan['weekly_targets'][0]['target_cost'],
            target_total_units=plan['total_targets']['units'],
            past_bill_amount=bill.total_charge,
            past_bill_units=bill.units_consumed,
            past_billing_days=bill.billing_period_days,
            weekly_targets=plan['weekly_targets'],
            monitoring_schedule=plan['monitoring_schedule'],
            recommendations=plan['recommendations']
        )
        
        db.add(plan_record)
        db.commit()
        db.refresh(plan_record)
        
        from src.api.routes.notifications import create_notification
        create_notification(db, bill.user_id, "Plan Created", f"Successfully created your {plan_record.planning_days}-day budget plan for Rs. {plan_record.target_budget}.", "success")

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


@router.put("/plans/{plan_id}")
def update_budget_plan(
    plan_id: int,
    request: BudgetPlanUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing budget plan
    """
    plan = db.query(BudgetPlan).filter(BudgetPlan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    bill = plan.reference_bill
    
    if not bill:
        raise HTTPException(status_code=404, detail="Reference bill not found")
    
    updated = False
    
    if request.target_budget is not None:
        plan.target_budget = request.target_budget
        updated = True
    
    if request.planning_days is not None:
        plan.planning_days = request.planning_days
        plan.plan_end_date = plan.plan_start_date + timedelta(days=request.planning_days)
        updated = True
    
    if updated:
        bill_data = {
            'units_consumed': bill.units_consumed,
            'billing_period_days': bill.billing_period_days,
            'total_charge': bill.total_charge or 0
        }
        
        new_plan = analysis_service.create_budget_plan(
            bill_data,
            plan.target_budget,
            plan.planning_days
        )
        
        if 'error' in new_plan:
            raise HTTPException(status_code=400, detail=new_plan['message'])
        
        plan.target_daily_units = new_plan['daily_targets']['units']
        plan.target_daily_cost = new_plan['daily_targets']['cost']
        plan.target_weekly_units = new_plan['weekly_targets'][0]['target_units']
        plan.target_weekly_cost = new_plan['weekly_targets'][0]['target_cost']
        plan.target_total_units = new_plan['total_targets']['units']
        plan.weekly_targets = new_plan['weekly_targets']
        plan.monitoring_schedule = new_plan['monitoring_schedule']
        plan.recommendations = new_plan['recommendations']
    
    db.commit()
    db.refresh(plan)
    
    return {
        'success': True,
        'message': 'Budget plan updated successfully',
        'plan_id': plan.id,
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
        }
    }


@router.delete("/plans/{plan_id}")
def delete_budget_plan(
    plan_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a budget plan and its associated meter readings
    """
    plan = db.query(BudgetPlan).filter(BudgetPlan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    try:
        db.delete(plan)
        db.commit()
        
        return {
            'success': True,
            'message': 'Budget plan and associated readings deleted successfully'
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting plan: {str(e)}")


@router.put("/readings/{reading_id}")
def update_meter_reading(
    reading_id: int,
    request: MeterReadingUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a meter reading (value, date, notes) and recalculate progress.
    """
    reading = db.query(MeterReading).filter(MeterReading.id == reading_id).first()
    if not reading:
        raise HTTPException(status_code=404, detail="Meter reading not found")

    plan = db.query(BudgetPlan).filter(BudgetPlan.id == reading.budget_plan_id).first()
    if not plan or not plan.reference_bill:
        raise HTTPException(status_code=404, detail="Plan or reference bill not found")

    first_reading = db.query(MeterReading).filter(
        MeterReading.budget_plan_id == reading.budget_plan_id,
        MeterReading.id != reading_id
    ).order_by(MeterReading.reading_date).first()
    if first_reading:
        start_reading = first_reading.reading_value
        start_date = first_reading.reading_date
    else:
        start_reading = plan.reference_bill.current_reading
        start_date = plan.plan_start_date

    plan_data = {
        'daily_targets': {'units': plan.target_daily_units, 'cost': plan.target_daily_cost},
        'total_targets': {'days': plan.planning_days},
        'budget_info': {'target_budget': plan.target_budget}
    }
    try:
        progress = analysis_service.track_progress(
            plan_data,
            request.reading_value,
            request.reading_date,
            start_reading,
            start_date
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error recalculating progress: {str(e)}")

    variance_percentage = 0
    if progress['current_status']['expected_cost'] > 0:
        variance_percentage = (
            progress['current_status']['variance_cost'] /
            progress['current_status']['expected_cost'] * 100
        )

    reading.reading_value = request.reading_value
    reading.reading_date = request.reading_date
    reading.reading_time = request.reading_date.strftime("%H:%M:%S")
    if not reading.bill_id:
        reading.bill_id = plan.reference_bill_id
    reading.notes = request.notes
    reading.units_consumed_so_far = progress['current_status']['units_used']
    reading.days_elapsed = progress['current_status']['days_elapsed']
    reading.actual_cost_so_far = progress['current_status']['actual_cost']
    reading.expected_cost_so_far = progress['current_status']['expected_cost']
    reading.variance_units = progress['current_status']['variance_units']
    reading.variance_cost = progress['current_status']['variance_cost']
    reading.variance_percentage = variance_percentage
    reading.status = progress['current_status']['status']
    reading.projected_total_units = progress['projection']['projected_total_units']
    reading.projected_total_cost = progress['projection']['projected_total_cost']
    reading.projected_budget_variance = progress['projection']['budget_variance']
    reading.analysis_data = progress

    db.commit()
    
    plan.current_progress_status = reading.status
    plan.last_check_date = reading.reading_date
    db.commit()
    
    db.refresh(reading)
    return {
        'success': True,
        'message': 'Reading updated successfully',
        'reading': {
            'id': reading.id,
            'reading_value': reading.reading_value,
            'reading_date': reading.reading_date,
            'days_elapsed': reading.days_elapsed,
            'units_consumed': reading.units_consumed_so_far,
            'actual_cost': reading.actual_cost_so_far,
            'expected_cost': reading.expected_cost_so_far,
            'variance_cost': reading.variance_cost,
            'status': reading.status,
            'projected_total_cost': reading.projected_total_cost
        }
    }


@router.delete("/readings/{reading_id}")
def delete_meter_reading(
    reading_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a specific meter reading
    """
    reading = db.query(MeterReading).filter(MeterReading.id == reading_id).first()

    if not reading:
        raise HTTPException(status_code=404, detail="Meter reading not found")

    try:
        plan_id = reading.budget_plan_id
        db.delete(reading)
        db.commit()
        
        latest_reading = db.query(MeterReading).filter(
            MeterReading.budget_plan_id == plan_id
        ).order_by(MeterReading.reading_date.desc()).first()
        
        plan = db.query(BudgetPlan).filter(BudgetPlan.id == plan_id).first()
        if plan:
            if latest_reading:
                plan.current_progress_status = latest_reading.status
                plan.last_check_date = latest_reading.reading_date
            else:
                plan.current_progress_status = 'on_track'
                plan.last_check_date = None
            db.commit()

        return {
            'success': True,
            'message': 'Meter reading deleted and plan status updated successfully'
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting reading: {str(e)}")


@router.post("/track-progress")
def track_budget_progress(
    request: MeterReadingRequest,
    db: Session = Depends(get_db)
):
    """
    Track progress against budget plan using current meter reading.
    Generates AI appliance recommendations when over budget or projected to exceed.
    """
    # Get the budget plan
    plan = db.query(BudgetPlan).filter(BudgetPlan.id == request.plan_id).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Budget plan not found")
    
    # Get reference bill
    bill = plan.reference_bill
    
    if not bill:
        raise HTTPException(status_code=404, detail="Reference bill not found")
    
    # Enforce maximum number of readings (8 per plan)
    existing_readings_count = db.query(MeterReading).filter(
        MeterReading.budget_plan_id == request.plan_id
    ).count()

    if existing_readings_count >= 8:
        raise HTTPException(
            status_code=400,
            detail="You have reached the maximum of 8 meter readings for this budget plan."
        )

    # Weekly spacing logic (approx 7 days)
    last_reading = db.query(MeterReading).filter(
        MeterReading.budget_plan_id == request.plan_id
    ).order_by(MeterReading.reading_date.desc()).first()

    if last_reading:
        days_since_last = (request.reading_date.replace(tzinfo=None) - last_reading.reading_date.replace(tzinfo=None)).days
        if days_since_last < 1:
            raise HTTPException(
                status_code=400,
                detail=f"Please wait at least 1 day between readings. Your last reading was {days_since_last} days ago."
            )

    # ALWAYS use the bill's current reading as the starting reference for the budget plan
    start_reading = bill.current_reading
    start_date = plan.plan_start_date
    
    if start_reading is None and bill.previous_reading is not None and bill.units_consumed is not None:
        start_reading = bill.previous_reading + bill.units_consumed
    if start_date is None and bill.bill_date is not None:
        start_date = bill.bill_date
        
    if start_reading is None or start_date is None:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=(
                "Reference bill has no meter readings. Re-upload the bill so we can extract "
                "previous/current reading and dates, or add them manually in the database."
            )
        )

    # Normalize datetimes for subtraction
    _start = start_date.replace(tzinfo=None) if start_date and getattr(start_date, 'tzinfo', None) else start_date
    _reading = request.reading_date.replace(tzinfo=None) if request.reading_date and getattr(request.reading_date, 'tzinfo', None) else request.reading_date
    if _start and _reading and _reading.date() < _start.date():
        raise HTTPException(
            status_code=400,
            detail=f"Reading date ({_reading.date()}) cannot be before the plan start date ({_start.date()})."
        )

    # Prepare plan data for tracking
    plan_data = {
        'budget_info': {
            'target_budget': plan.target_budget,
            'past_bill': plan.past_bill_amount,
            'savings_target': plan.past_bill_amount - plan.target_budget,
            'percentage_change': ((plan.target_budget - plan.past_bill_amount) / plan.past_bill_amount) * 100
        },
        'daily_targets': {
            'units': plan.target_daily_units,
            'cost': plan.target_daily_cost
        },
        'weekly_targets': plan.weekly_targets or [],
        'total_targets': {
            'units': plan.target_total_units,
            'cost': plan.target_budget,
            'days': plan.planning_days
        }
    }

    start_date_for_calc = _start if _start is not None else start_date
    reading_date_for_calc = _reading if _reading is not None else request.reading_date

    # Calculate progress
    try:
        progress = analysis_service.track_progress(
            plan_data,
            request.current_reading,
            reading_date_for_calc,
            start_reading,
            start_date_for_calc
        )

        current_status = progress['current_status']
        projection = progress['projection']

        # ── Weekly target status ──────────────────────────────────────────────
        days_elapsed = int(current_status.get('days_elapsed', 0))
        week_number = (days_elapsed // 7) + 1
        week_target = None
        if plan.weekly_targets:
            for wt in plan.weekly_targets:
                if wt.get('week') == week_number:
                    week_target = wt
                    break

        weekly_status = None
        if week_target:
            actual_units = current_status.get('units_used', 0)
            target_cum = week_target.get('cumulative_units', week_target.get('target_units', 0))
            weekly_status = {
                'week_number': week_number,
                'target_cumulative_units': target_cum,
                'actual_units': actual_units,
                'exceeded': actual_units > target_cum
            }
        elif plan.weekly_targets:
            # Fallback: derive week from elapsed days, cap to available weeks
            week_index = min(
                len(plan.weekly_targets) - 1,
                max(0, int((days_elapsed - 1) / 7)) if days_elapsed > 0 else 0
            )
            weekly_target_fb = plan.weekly_targets[week_index]
            target_units_fb = weekly_target_fb.get('cumulative_units', weekly_target_fb.get('target_units', 0))
            units_used_fb = current_status.get('units_used', 0)
            weekly_status = {
                'week_number': week_index + 1,
                'target_cumulative_units': target_units_fb,
                'actual_units': units_used_fb,
                'exceeded': units_used_fb > target_units_fb
            }

        # ── AI Appliance Recommendations ──────────────────────────────────────
        # KEY FIX: call RecommendationEngine and inject into analysis_data BEFORE saving to DB
        appliance_recommendations = []
        is_over = (
            current_status.get('status') == 'over_budget' or
            projection.get('budget_variance', 0) > 0
        )

        if is_over:
            try:
                user_appliances_raw = db.query(HouseholdAppliance).filter(
                    HouseholdAppliance.is_active == True
                ).filter(
                    (HouseholdAppliance.account_number == plan.account_number) |
                    (HouseholdAppliance.user_id == plan.user_id)
                ).all()

                # Fallback: check any appliances for this user
                if not user_appliances_raw and plan.user_id:
                    user_appliances_raw = db.query(HouseholdAppliance).filter(
                        HouseholdAppliance.user_id == plan.user_id,
                        HouseholdAppliance.is_active == True
                    ).all()

                user_appliances = [
                    {
                        'id': a.id,
                        'name': a.appliance_name,
                        'category': a.appliance_category,
                        'wattage': a.wattage,
                        'daily_kwh': a.daily_kwh or 0,
                        'monthly_kwh': a.monthly_kwh or 0,
                    }
                    for a in user_appliances_raw
                ]

                if user_appliances:
                    projection_for_rec = {
                        'days_remaining': max(1, plan.planning_days - days_elapsed),
                        'budget_variance': projection.get('budget_variance', 0),
                        'projected_total_cost': projection.get('projected_total_cost', 0),
                    }
                    appliance_recommendations = recommendation_engine.generate_recommendations(
                        current_status=current_status,
                        projection=projection_for_rec,
                        user_appliances=user_appliances,
                        account_number=bill.account_number
                    )
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Recommendation engine error: {e}")
                appliance_recommendations = []

        # ── Build analysis_data with appliance_recommendations included ───────
        analysis_data = {
            **current_status,
            'projection': projection,
            'weekly_status': weekly_status,
            'recommendations': progress.get('recommendations', []),
            # KEY: store appliance recommendations so frontend can display them
            'appliance_recommendations': appliance_recommendations,
        }

        # Attach helper data for frontend on the progress dict too
        progress['weekly_status'] = weekly_status
        progress['appliance_recommendations'] = appliance_recommendations

        # Save meter reading to database
        variance_percentage = 0
        if current_status['expected_cost'] > 0:
            variance_percentage = (
                current_status['variance_cost'] / 
                current_status['expected_cost'] * 100
            )
        
        reading_record = MeterReading(
            budget_plan_id=request.plan_id,
            bill_id=bill.id,
            reading_value=request.current_reading,
            reading_date=request.reading_date,
            reading_time=request.reading_date.strftime("%H:%M:%S"),
            units_consumed_so_far=current_status['units_used'],
            days_elapsed=current_status['days_elapsed'],
            actual_cost_so_far=round(current_status['actual_cost'], 2),
            expected_cost_so_far=round(current_status['expected_cost'], 2),
            variance_units=round(current_status['variance_units'], 2),
            variance_cost=round(current_status['variance_cost'], 2),
            variance_percentage=round(variance_percentage, 2),
            status=current_status['status'],
            projected_total_units=round(projection['projected_total_units'], 2),
            projected_total_cost=round(projection['projected_total_cost'], 2),
            projected_budget_variance=round(projection['budget_variance'], 2),
            analysis_data=analysis_data,  # Now includes appliance_recommendations
            notes=request.notes
        )
        
        db.add(reading_record)
        
        # Update plan status
        plan.last_check_date = request.reading_date
        plan.current_progress_status = current_status['status']
        
        db.commit()
        db.refresh(reading_record)

        from src.api.routes.notifications import create_notification
        if current_status['status'] == 'over_budget':
            create_notification(db, plan.user_id, "Budget Alert ⚠️", "Your consumption is exceeding the target! Check recommendations.", "warning")
        elif weekly_status and weekly_status['exceeded']:
            create_notification(db, plan.user_id, "Weekly Goal Alert", f"Week {weekly_status['week_number']} goal exceeded. Consider reducing appliance usage.", "warning")
        else:
            create_notification(db, plan.user_id, "Progress Tracked", "Meter reading recorded. You are currently on track!", "success")
        
        return {
            'success': True,
            'message': 'Progress tracked successfully',
            'reading_id': reading_record.id,
            'plan_id': request.plan_id,
            'appliance_recommendations': appliance_recommendations,
            'reading': {
                'id': reading_record.id,
                'reading_value': reading_record.reading_value,
                'reading_date': reading_record.reading_date,
                'units_consumed_so_far': reading_record.units_consumed_so_far,
                'days_elapsed': reading_record.days_elapsed,
                'actual_cost_so_far': reading_record.actual_cost_so_far,
                'expected_cost_so_far': reading_record.expected_cost_so_far,
                'variance_cost': reading_record.variance_cost,
                'status': reading_record.status,
                'projected_total_cost': reading_record.projected_total_cost,
                'analysis_data': analysis_data,
            },
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
                'plan_end_date': p.plan_end_date,
                'target_daily_units': p.target_daily_units,
                'target_daily_cost': p.target_daily_cost,
                'target_total_units': p.target_total_units,
                'reference_bill_id': p.reference_bill_id,
                'reference_bill_date': p.reference_bill.bill_date if p.reference_bill else None,
                'reference_bill_current_reading': p.reference_bill.current_reading if p.reference_bill else None
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
                'units_consumed_so_far': r.units_consumed_so_far,
                'actual_cost_so_far': r.actual_cost_so_far,
                'expected_cost_so_far': r.expected_cost_so_far,
                'variance_cost': r.variance_cost,
                'status': r.status,
                'projected_total_cost': r.projected_total_cost,
                'notes': r.notes
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
    
    bill1_daily = bill1.units_consumed / bill1.billing_period_days
    bill2_daily = bill2.units_consumed / bill2.billing_period_days
    
    bill1_normalized = bill1_daily * 30
    bill2_normalized = bill2_daily * 30
    
    difference_units = bill2_normalized - bill1_normalized
    difference_percent = (difference_units / bill1_normalized) * 100 if bill1_normalized > 0 else 0
    
    cost1_normalized = (bill1.total_charge / bill1.billing_period_days) * 30
    cost2_normalized = (bill2.total_charge / bill2.billing_period_days) * 30
    
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
                'cost': bill1.total_charge,
                'normalized_units_30d': round(bill1_normalized, 2),
                'normalized_cost_30d': round(cost1_normalized, 2)
            },
            'period_2': {
                'bill_id': bill_id_2,
                'date': bill2.bill_date,
                'units': bill2.units_consumed,
                'days': bill2.billing_period_days,
                'cost': bill2.total_charge,
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
    
    past_cost = bill.total_charge or 0
    past_units = bill.units_consumed or 0
    days = bill.billing_period_days or 30
    
    adjusted_threshold = 60 * (days / 30)
    
    recommendations = []
    
    if past_units > adjusted_threshold:
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


@router.get("/notifications/{account_number}")
def get_due_notifications(
    account_number: str,
    db: Session = Depends(get_db)
):
    """Get due checkpoint reminders for an account"""
    notification_service = NotificationService()
    alerts = notification_service.check_due_monitoring(db)
    account_alerts = [alert for alert in alerts if alert['account_number'] == account_number]
    
    return {
        'success': True,
        'count': len(account_alerts),
        'alerts': account_alerts
    }