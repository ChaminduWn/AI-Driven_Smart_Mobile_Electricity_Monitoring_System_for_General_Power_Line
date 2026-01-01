# src/services/notification.py

class NotificationService:
    """Send monitoring reminders to users"""
    
    def check_due_monitoring(self, db: Session):
        """Check which plans need monitoring today"""
        from src.models.budget_plan import BudgetPlan
        from datetime import datetime, timedelta
        
        active_plans = db.query(BudgetPlan).filter(
            BudgetPlan.is_active == True,
            BudgetPlan.status == 'active'
        ).all()
        
        alerts = []
        today = datetime.now().date()
        
        for plan in active_plans:
            days_since_start = (today - plan.plan_start_date.date()).days
            
            # Check monitoring schedule
            for checkpoint in plan.monitoring_schedule:
                if checkpoint['day'] == days_since_start:
                    alerts.append({
                        'plan_id': plan.id,
                        'account_number': plan.account_number,
                        'message': f"Time to check meter reading (Day {days_since_start})",
                        'action': checkpoint['action'],
                        'purpose': checkpoint['purpose']
                    })
        
        return alerts