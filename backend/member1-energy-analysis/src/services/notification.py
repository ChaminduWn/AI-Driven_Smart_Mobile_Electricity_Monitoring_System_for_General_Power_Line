# # src/services/notification.py

# class NotificationService:
#     """Send monitoring reminders to users"""
    
#     def check_due_monitoring(self, db: Session):
#         """Check which plans need monitoring today"""
#         from src.models.budget_plan import BudgetPlan
#         from datetime import datetime, timedelta
        
#         active_plans = db.query(BudgetPlan).filter(
#             BudgetPlan.is_active == True,
#             BudgetPlan.status == 'active'
#         ).all()
        
#         alerts = []
#         today = datetime.now().date()
        
#         for plan in active_plans:
#             days_since_start = (today - plan.plan_start_date.date()).days
            
#             # Check monitoring schedule
#             for checkpoint in plan.monitoring_schedule:
#                 if checkpoint['day'] == days_since_start:
#                     alerts.append({
#                         'plan_id': plan.id,
#                         'account_number': plan.account_number,
#                         'message': f"Time to check meter reading (Day {days_since_start})",
#                         'action': checkpoint['action'],
#                         'purpose': checkpoint['purpose']
#                     })
        
#         return alerts

"""
services/notification.py
Notification service for due checkpoint reminders
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict
from src.models.budget_plan import BudgetPlan


class NotificationService:
    """Service for generating checkpoint notifications"""
    
    def check_due_monitoring(self, db: Session) -> List[Dict]:
        """
        Check for due monitoring checkpoints across all active plans
        
        Returns list of alerts for checkpoints due today
        """
        alerts = []
        today = datetime.now().date()
        
        # Get all active budget plans
        active_plans = db.query(BudgetPlan).filter(
            BudgetPlan.is_active == True,
            BudgetPlan.status == 'active'
        ).all()
        
        for plan in active_plans:
            if not plan.monitoring_schedule:
                continue
            
            # Calculate days elapsed since plan start
            days_elapsed = (today - plan.plan_start_date.date()).days
            
            # Check if today matches any checkpoint
            for checkpoint in plan.monitoring_schedule:
                checkpoint_day = checkpoint.get('day')
                
                # If we're on or past the checkpoint day, and haven't checked recently
                if days_elapsed >= checkpoint_day:
                    # Check if we already have a reading for this checkpoint
                    last_check = plan.last_check_date
                    
                    # Alert if no check yet, or last check was before this checkpoint
                    if not last_check or (today - last_check.date()).days >= 1:
                        # Check if this checkpoint is "due" (within ±1 day)
                        if abs(days_elapsed - checkpoint_day) <= 1:
                            alerts.append({
                                'plan_id': plan.id,
                                'account_number': plan.account_number,
                                'checkpoint_day': checkpoint_day,
                                'days_elapsed': days_elapsed,
                                'message': f"Day {checkpoint_day}: {checkpoint.get('action', 'Check meter reading')}",
                                'purpose': checkpoint.get('purpose', 'Track consumption'),
                                'target_budget': plan.target_budget,
                                'daily_target_units': plan.target_daily_units
                            })
        
        return alerts