from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.bill_analyzer import BillAnalyzer
from src.schemas.bill_analysis import BillAnalysisResponse
from src.config import settings

router = APIRouter(prefix=f"{settings.API_V1_PREFIX}/analysis", tags=["Bill Analysis"])


@router.post("/bills/{bill_id}/analyze", response_model=BillAnalysisResponse)
def analyze_bill(bill_id: int, db: Session = Depends(get_db)):
    """
    Analyze a bill and generate insights
    
    **Returns:**
    - Daily average units and cost
    - Weekly breakdown (4-5 weeks)
    - Consumption trends
    - Peak and lowest consumption weeks
    
    **Example for Bill ID 1 (77 units, 34 days, Rs. 2086.59):**
    ```json
    {
      "success": true,
      "bill_id": 1,
      "daily": {
        "total_days": 34,
        "total_units": 77,
        "total_cost": 2086.59,
        "daily_average_units": 2.26,
        "daily_average_cost": 61.37
      },
      "weekly": {
        "total_weeks": 5,
        "weekly_average_units": 15.4,
        "weekly_average_cost": 429.72,
        "weeks": [
          {"week": 1, "days": 7, "units": 15.82, "cost": 429.59},
          {"week": 2, "days": 7, "units": 15.82, "cost": 429.59},
          {"week": 3, "days": 7, "units": 15.82, "cost": 429.59},
          {"week": 4, "days": 7, "units": 15.82, "cost": 429.59},
          {"week": 5, "days": 6, "units": 13.56, "cost": 368.22}
        ]
      },
      "trends": {
        "trend": "stable",
        "peak_week": 1,
        "lowest_week": 5,
        "variance": 2.26
      }
    }
    ```
    """
    try:
        analyzer = BillAnalyzer(db)
        result = analyzer.analyze_bill(bill_id)
        
        return BillAnalysisResponse(
            success=True,
            **result
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/bills/{bill_id}", response_model=BillAnalysisResponse)
def get_analysis(bill_id: int, db: Session = Depends(get_db)):
    """
    Get existing analysis or generate if not exists
    """
    from src.models.bill_analysis import BillAnalysis
    
    analysis = db.query(BillAnalysis).filter(
        BillAnalysis.bill_id == bill_id
    ).first()
    
    if not analysis:
        # Generate analysis
        return analyze_bill(bill_id, db)
    
    # Return existing
    return BillAnalysisResponse(
        success=True,
        bill_id=analysis.bill_id,
        daily={
            'total_days': analysis.bill.billing_period_days,
            'total_units': analysis.bill.units_consumed,
            'total_cost': analysis.bill.total_due,
            'daily_average_units': analysis.daily_average_units,
            'daily_average_cost': analysis.daily_average_cost
        },
        weekly={
            'total_weeks': analysis.total_weeks,
            'weekly_average_units': analysis.weekly_average_units,
            'weekly_average_cost': analysis.weekly_average_cost,
            'weeks': analysis.week_breakdown
        },
        trends={
            'trend': analysis.consumption_trend,
            'peak_week': analysis.peak_week,
            'peak_week_units': next(
                (w['units'] for w in analysis.week_breakdown if w['week'] == analysis.peak_week), 0
            ),
            'peak_week_cost': next(
                (w['cost'] for w in analysis.week_breakdown if w['week'] == analysis.peak_week), 0
            ),
            'lowest_week': analysis.lowest_week,
            'lowest_week_units': next(
                (w['units'] for w in analysis.week_breakdown if w['week'] == analysis.lowest_week), 0
            ),
            'lowest_week_cost': next(
                (w['cost'] for w in analysis.week_breakdown if w['week'] == analysis.lowest_week), 0
            ),
            'variance': analysis.consumption_variance or 0.0
        },
        analysis_id=analysis.id
    )