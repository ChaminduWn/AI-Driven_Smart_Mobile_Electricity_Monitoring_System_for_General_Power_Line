"""
tests/test_recommendations.py
Verification script for RecommendationEngine
"""
import sys
import os
from datetime import datetime

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.services.recommendation_engine import RecommendationEngine

def test_recommendation_logic():
    engine = RecommendationEngine()
    
    # Mock data: User is significantly over budget
    current_status = {
        'days_elapsed': 10,
        'units_used': 100, # 10 kWh/day
        'actual_cost': 1500,
        'variance_units': 30, # Target was 70 units
        'status': 'over_budget'
    }
    
    projection = {
        'days_remaining': 20,
        'budget_variance': 500, # Rs. 500 over projected total
        'projected_total_units': 300
    }
    
    user_appliances = [
        {'id': 1, 'name': 'Air Conditioner', 'category': 'Cooling', 'wattage': 1500},
        {'id': 2, 'name': 'Refrigerator', 'category': 'Cooling', 'wattage': 150},
        {'id': 3, 'name': 'Electric Kettle', 'category': 'Cooking', 'wattage': 2000}
    ]
    
    recs = engine.generate_recommendations(
        current_status=current_status,
        projection=projection,
        user_appliances=user_appliances,
        account_number="12345678"
    )
    
    print("\n🚀 Recommendation Engine Test Results:")
    print("-" * 50)
    for i, rec in enumerate(recs):
        print(f"Rec {i+1}: {rec['appliance_name']} ({rec['category']})")
        print(f"   Target Reduction: -{rec['suggested_reduction_hours']} hours/day")
        print(f"   Actionable Tip: {rec['actionable_tip']}")
        print(f"   Monthly Saving: Rs. {rec['potential_monthly_saving']}")
        print("-" * 50)

if __name__ == "__main__":
    test_recommendation_logic()
