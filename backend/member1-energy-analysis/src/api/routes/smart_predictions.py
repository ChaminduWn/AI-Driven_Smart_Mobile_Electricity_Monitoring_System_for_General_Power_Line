"""
src/api/routes/smart_predictions.py
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.smart_predictions import SmartInsightsService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/smart", tags=["Smart Insights"])

_service = None

def get_service() -> SmartInsightsService:
    global _service
    if _service is None:
        _service = SmartInsightsService()
        logger.info("SmartInsightsService initialized")
    return _service


@router.post("/spike-prediction")
async def spike_prediction(data: dict, service: SmartInsightsService = Depends(get_service)):
    bills = data.get("bills", [])
    if not bills:
        raise HTTPException(status_code=400, detail="No bill data provided")
    try:
        return service.get_spike_prediction(bills)
    except Exception as e:
        logger.error(f"Spike prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tariff-warning")
async def tariff_warning(data: dict, service: SmartInsightsService = Depends(get_service)):
    readings = data.get("readings", [])
    billing_start = data.get("billing_start_meter", 0)
    if not readings:
        raise HTTPException(status_code=400, detail="No meter readings provided")
    try:
        return service.get_tariff_warning(readings, billing_start)
    except Exception as e:
        logger.error(f"Tariff warning error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/efficiency-score")
async def efficiency_score(data: dict, service: SmartInsightsService = Depends(get_service)):
    profile = data.get("profile")
    actual_kwh = data.get("actual_kwh")
    if not profile or actual_kwh is None:
        raise HTTPException(status_code=400, detail="Both 'profile' and 'actual_kwh' are required")
    try:
        return service.get_efficiency_score(profile, actual_kwh, data.get("billing_month"))
    except Exception as e:
        logger.error(f"Efficiency score error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights-summary/{account_number}")
async def insights_summary(
    account_number: str,
    db: Session = Depends(get_db),
    service: SmartInsightsService = Depends(get_service)
):
    try:
        from src.models.bill import ElectricityBill
        from src.models.budget_plan import BudgetPlan, MeterReading

        bills_db = db.query(ElectricityBill).filter(
            ElectricityBill.account_number == account_number
        ).order_by(ElectricityBill.bill_date.asc()).all()

        bill_dicts = []
        for b in bills_db:
            try:
                kwh = float(b.units_consumed or 0)
                if kwh == 0:
                    continue
                bill_dicts.append({
                    "kwh": kwh,
                    "billing_month": b.bill_date.month if b.bill_date else 1,
                    "billing_year": b.bill_date.year if b.bill_date else 2025,
                    "billing_days": int(b.billing_period_days or 30),
                    "amount_rs": float(b.total_charge or 0),   # was total_amount
                    "meter_start": float(b.previous_reading or 0),
                    "meter_end": float(b.current_reading or kwh),
                })
            except Exception:
                continue

        plan = db.query(BudgetPlan).filter(
            BudgetPlan.account_number == account_number,
            BudgetPlan.is_active == True
        ).order_by(BudgetPlan.created_at.desc()).first()

        reading_dicts = []
        billing_start = 0.0

        if plan:
            # use correct field names from your BudgetPlan model
            billing_start = float(
                getattr(plan, 'reference_bill_current_reading', None) or 0
            )
            readings_db = db.query(MeterReading).filter(
                MeterReading.budget_plan_id == plan.id
            ).order_by(MeterReading.reading_date.asc()).all()

            for r in readings_db:
                try:
                    reading_dicts.append({
                        "reading_value": float(r.reading_value),  #  was r.current_reading
                        "reading_date": str(r.reading_date),
                        "billing_period_start": str(plan.plan_start_date),  #  was plan.start_date
                        "billing_period_end": str(plan.plan_end_date),      # plan.end_date
                    })
                except Exception:
                    continue

        return service.get_full_insights(bill_dicts, reading_dicts, {}, billing_start)

    except Exception as e:
        logger.error(f"Insights summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))