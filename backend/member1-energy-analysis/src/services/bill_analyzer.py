from typing import Dict, List
from sqlalchemy.orm import Session
from src.models.bill import ElectricityBill
from src.models.bill_analysis import BillAnalysis
from src.services.tariff_calculator import TariffCalculator
import logging

logger = logging.getLogger(__name__)


class BillAnalyzer:
    """Analyze electricity bills and generate insights"""
    
    def __init__(self, db: Session):
        self.db = db
        self.tariff_calc = TariffCalculator(db)
    
    def analyze_bill(self, bill_id: int) -> Dict:
        """
        Complete analysis of a bill
        
        Returns:
            {
                'bill_id': int,
                'daily': {...},
                'weekly': {...},
                'trends': {...},
                'analysis_id': int
            }
        """
        bill = self.db.query(ElectricityBill).filter(
            ElectricityBill.id == bill_id
        ).first()
        
        if not bill:
            raise ValueError(f"Bill {bill_id} not found")
        
        logger.info(f"Analyzing bill {bill_id}")
        
        # Calculate daily averages
        daily = self._calculate_daily_average(bill)
        
        # Calculate weekly breakdown
        weekly = self._calculate_weekly_breakdown(bill)
        
        # Identify trends
        trends = self._identify_trends(weekly['weeks'])
        
        # Save to database
        analysis = self._save_analysis(bill_id, daily, weekly, trends)
        
        return {
            'bill_id': bill_id,
            'daily': daily,
            'weekly': weekly,
            'trends': trends,
            'analysis_id': analysis.id
        }
    
    def _calculate_daily_average(self, bill: ElectricityBill) -> Dict:
        """Calculate daily average consumption and cost"""
        days = bill.billing_period_days or 30
        units = bill.units_consumed or 0
        total_cost = bill.total_due or 0
        
        daily_units = units / days
        daily_cost = total_cost / days
        
        return {
            'total_days': days,
            'total_units': units,
            'total_cost': total_cost,
            'daily_average_units': round(daily_units, 2),
            'daily_average_cost': round(daily_cost, 2)
        }
    
    def _calculate_weekly_breakdown(self, bill: ElectricityBill) -> Dict:
        """Break down consumption into weeks"""
        days = bill.billing_period_days or 30
        units = bill.units_consumed or 0
        total_cost = bill.total_due or 0
        
        # Calculate weeks
        full_weeks = days // 7
        remaining_days = days % 7
        total_weeks = full_weeks + (1 if remaining_days > 0 else 0)
        
        # Daily averages
        daily_units = units / days
        daily_cost = total_cost / days
        
        weeks = []
        
        # Full weeks
        for week_num in range(1, full_weeks + 1):
            week_units = daily_units * 7
            week_cost = daily_cost * 7
            
            weeks.append({
                'week': week_num,
                'days': 7,
                'units': round(week_units, 2),
                'cost': round(week_cost, 2),
                'daily_average': round(daily_units, 2)
            })
        
        # Partial week
        if remaining_days > 0:
            week_units = daily_units * remaining_days
            week_cost = daily_cost * remaining_days
            
            weeks.append({
                'week': total_weeks,
                'days': remaining_days,
                'units': round(week_units, 2),
                'cost': round(week_cost, 2),
                'daily_average': round(daily_units, 2)
            })
        
        # Weekly averages
        weekly_avg_units = sum(w['units'] for w in weeks) / len(weeks)
        weekly_avg_cost = sum(w['cost'] for w in weeks) / len(weeks)
        
        return {
            'total_weeks': total_weeks,
            'weekly_average_units': round(weekly_avg_units, 2),
            'weekly_average_cost': round(weekly_avg_cost, 2),
            'weeks': weeks
        }
    
    def _identify_trends(self, weeks: List[Dict]) -> Dict:
        """Identify consumption trends"""
        if len(weeks) < 2:
            return {
                'trend': 'insufficient_data',
                'peak_week': 1,
                'lowest_week': 1,
                'variance': 0.0
            }
        
        # Find peak and lowest
        peak = max(weeks, key=lambda w: w['units'])
        lowest = min(weeks, key=lambda w: w['units'])
        
        # Determine trend
        first_units = weeks[0]['units']
        last_units = weeks[-1]['units']
        
        if last_units > first_units * 1.1:
            trend = 'increasing'
        elif last_units < first_units * 0.9:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'peak_week': peak['week'],
            'peak_week_units': peak['units'],
            'peak_week_cost': peak['cost'],
            'lowest_week': lowest['week'],
            'lowest_week_units': lowest['units'],
            'lowest_week_cost': lowest['cost'],
            'variance': round(peak['units'] - lowest['units'], 2)
        }
    
    def _save_analysis(self, bill_id: int, daily: Dict, 
                      weekly: Dict, trends: Dict) -> BillAnalysis:
        """Save analysis to database"""
        existing = self.db.query(BillAnalysis).filter(
            BillAnalysis.bill_id == bill_id
        ).first()
        
        if existing:
            # Update
            existing.daily_average_units = daily['daily_average_units']
            existing.daily_average_cost = daily['daily_average_cost']
            existing.total_weeks = weekly['total_weeks']
            existing.weekly_average_units = weekly['weekly_average_units']
            existing.weekly_average_cost = weekly['weekly_average_cost']
            existing.week_breakdown = weekly['weeks']
            existing.consumption_trend = trends['trend']
            existing.peak_week = trends['peak_week']
            existing.lowest_week = trends['lowest_week']
            existing.consumption_variance = trends['variance']
            
            self.db.commit()
            self.db.refresh(existing)
            return existing
        
        # Create new
        analysis = BillAnalysis(
            bill_id=bill_id,
            daily_average_units=daily['daily_average_units'],
            daily_average_cost=daily['daily_average_cost'],
            total_weeks=weekly['total_weeks'],
            weekly_average_units=weekly['weekly_average_units'],
            weekly_average_cost=weekly['weekly_average_cost'],
            week_breakdown=weekly['weeks'],
            consumption_trend=trends['trend'],
            peak_week=trends['peak_week'],
            lowest_week=trends['lowest_week'],
            consumption_variance=trends['variance']
        )
        
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        
        return analysis


print("=" * 70)
print("PHASE 1: COMPLETE IMPLEMENTATION")
print("=" * 70)
print("\nCEB October 2025 Tariff Integrated!")
print("\nFiles to copy:")
print("1. models/bill_analysis.py")
print("2. models/tariff.py")
print("3. services/tariff_calculator.py")
print("4. services/bill_analyzer.py")
print("\nNext: Copy schemas and routes...")
print("=" * 70)