from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class WeekBreakdown(BaseModel):
    """Weekly consumption data"""
    week: int
    days: int
    units: float
    cost: float
    daily_average: float


class DailyAnalysis(BaseModel):
    """Daily consumption analysis"""
    total_days: int
    total_units: float
    total_cost: float
    daily_average_units: float
    daily_average_cost: float


class WeeklyAnalysis(BaseModel):
    """Weekly consumption analysis"""
    total_weeks: int
    weekly_average_units: float
    weekly_average_cost: float
    weeks: List[WeekBreakdown]


class TrendAnalysis(BaseModel):
    """Consumption trend analysis"""
    trend: str
    peak_week: int
    peak_week_units: float
    peak_week_cost: float
    lowest_week: int
    lowest_week_units: float
    lowest_week_cost: float
    variance: float


class BillAnalysisResponse(BaseModel):
    """Complete bill analysis response"""
    success: bool
    bill_id: int
    daily: DailyAnalysis
    weekly: WeeklyAnalysis
    trends: TrendAnalysis
    analysis_id: int
