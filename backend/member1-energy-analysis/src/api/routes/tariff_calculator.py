"""
API routes for CEB tariff calculation
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from src.services.tariff_calculator import CEBTariffCalculator

router = APIRouter(prefix="/api/v1", tags=["tariff"])

calculator = CEBTariffCalculator()


# Request/Response Models
class TariffCalculationRequest(BaseModel):
    units_consumed: int = Field(..., description="Total units consumed (kWh)", ge=0)
    days: Optional[int] = Field(30, description="Number of days in billing period", ge=1, le=90)
    previous_reading: Optional[int] = Field(None, description="Previous meter reading")
    current_reading: Optional[int] = Field(None, description="Current meter reading")
    previous_date: Optional[str] = Field(None, description="Previous reading date (YYYY-MM-DD)")
    current_date: Optional[str] = Field(None, description="Current reading date (YYYY-MM-DD)")

    class Config:
        json_schema_extra = {
            "example": {
                "units_consumed": 84,
                "days": 34,
                "previous_reading": 16912,
                "current_reading": 16996,
                "previous_date": "2025-11-03",
                "current_date": "2025-12-07"
            }
        }


class MonthDataInput(BaseModel):
    month: str = Field(..., description="Month name/identifier")
    units: int = Field(..., description="Units consumed", ge=0)
    days: Optional[int] = Field(30, description="Billing period days")


class ComparisonRequest(BaseModel):
    months: List[MonthDataInput] = Field(..., description="List of months to compare")


class PredictionRequest(BaseModel):
    current_units: int = Field(..., description="Current month units", ge=0)
    current_days: Optional[int] = Field(30, description="Current billing days")
    predicted_units: Optional[int] = Field(None, description="Predicted units (optional)")


# Routes
@router.post("/tariff/calculate")
async def calculate_tariff(request: TariffCalculationRequest):
    """
    Calculate electricity bill based on consumption
    
    This endpoint allows users to manually calculate their electricity bill
    by entering their consumption details.
    """
    try:
        # Parse dates if provided
        previous_date = None
        current_date = None
        
        if request.previous_date:
            try:
                previous_date = datetime.fromisoformat(request.previous_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid previous_date format. Use YYYY-MM-DD")
        
        if request.current_date:
            try:
                current_date = datetime.fromisoformat(request.current_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid current_date format. Use YYYY-MM-DD")
        
        # Calculate bill
        result = calculator.calculate_bill(
            units_consumed=request.units_consumed,
            days=request.days,
            previous_reading=request.previous_reading,
            current_reading=request.current_reading,
            previous_date=previous_date,
            current_date=current_date
        )
        
        return {
            "success": True,
            "message": "Bill calculated successfully",
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@router.post("/tariff/predict")
async def predict_next_month(request: PredictionRequest):
    """
    Predict next month's bill based on current consumption
    
    If predicted_units is not provided, it will use the average daily
    consumption from the current month to estimate next month.
    """
    try:
        result = calculator.predict_next_month(
            current_units=request.current_units,
            current_days=request.current_days,
            predicted_units=request.predicted_units
        )
        
        return {
            "success": True,
            "message": "Prediction generated successfully",
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.post("/tariff/compare")
async def compare_months(request: ComparisonRequest):
    """
    Compare consumption across multiple months
    
    Analyze electricity usage and costs over multiple billing periods
    to identify trends and patterns.
    """
    try:
        if len(request.months) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 months are required for comparison"
            )
        
        months_data = [
            {
                'month': month.month,
                'units': month.units,
                'days': month.days
            }
            for month in request.months
        ]
        
        result = calculator.compare_consumption(months_data)
        
        return {
            "success": True,
            "message": "Comparison completed successfully",
            "data": result
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")


@router.get("/tariff/info")
async def get_tariff_info():
    """
    Get current CEB domestic tariff structure
    
    Returns detailed information about current tariff rates,
    slabs, fixed charges, and applicable taxes.
    """
    try:
        info = calculator.get_tariff_info()
        
        return {
            "success": True,
            "message": "Tariff information retrieved successfully",
            "data": info
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving tariff info: {str(e)}")


@router.get("/tariff/estimate")
async def quick_estimate(units: int, days: int = 30):
    """
    Quick estimation endpoint (GET request for simple calculations)
    
    Query Parameters:
    - units: Units consumed (required)
    - days: Billing period days (optional, default 30)
    """
    try:
        if units < 0:
            raise HTTPException(status_code=400, detail="Units must be non-negative")
        
        if days < 1 or days > 90:
            raise HTTPException(status_code=400, detail="Days must be between 1 and 90")
        
        result = calculator.calculate_bill(units_consumed=units, days=days)
        
        return {
            "success": True,
            "message": "Quick estimate calculated",
            "data": {
                "units": result['units_consumed'],
                "days": result['billing_days'],
                "total_charge": result['total_charge'],
                "average_per_unit": result['average_cost_per_unit']
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Estimation error: {str(e)}")