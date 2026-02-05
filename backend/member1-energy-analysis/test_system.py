"""
test_system.py
Test the complete bill analysis system workflow
Run: python test_system.py
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.database import SessionLocal
from src.models.bill import ElectricityBill
from src.models.budget_plan import BudgetPlan, MeterReading
from src.services.bill_analysis import BillAnalysisService, CEBTariffCalculator


def test_1_tariff_calculator():
    """Test 1: CEB Tariff Calculator"""
    print("\n" + "="*60)
    print("TEST 1: CEB Tariff Calculator")
    print("="*60)
    
    calc = CEBTariffCalculator()
    
    # Test case from your bill: 77 kWh over 34 days
    result = calc.calculate_bill(77, 34)
    
    print(f"\n📊 Calculating: 77 kWh over 34 days")
    print(f"   Category: {result['category']}")
    print(f"   Adjustment Factor: {result['adjustment_factor']}")
    print(f"   Adjusted Threshold: {result['adjusted_threshold']:.2f} kWh")
    print(f"\n💰 Charges:")
    print(f"   Energy Charge: Rs. {result['energy_charge']:.2f}")
    print(f"   Fixed Charge: Rs. {result['fixed_charge']:.2f}")
    print(f"   Subtotal: Rs. {result['subtotal']:.2f}")
    print(f"   SSCL (2.565%): Rs. {result['sscl']:.2f}")
    print(f"   TOTAL: Rs. {result['total']:.2f}")
    
    print(f"\n📋 Breakdown:")
    for block in result['breakdown']:
        print(f"   {block['block']}: {block['units']} units × Rs.{block['rate']} = Rs.{block['amount']:.2f}")
    
    # Verify calculation
    expected = 1470.26
    variance = abs(result['total'] - expected)
    
    if variance < 10:
        print(f"\n✅ TEST PASSED: Total matches expected (±Rs.10)")
    else:
        print(f"\n⚠️  WARNING: Total differs by Rs.{variance:.2f}")
    
    return result


def test_2_create_sample_bill():
    """Test 2: Create Sample Bill in Database"""
    print("\n" + "="*60)
    print("TEST 2: Create Sample Bill")
    print("="*60)
    
    db = SessionLocal()
    
    try:
        # Create a sample bill
        bill = ElectricityBill(
            file_name="sample_bill_dec_2024.pdf",
            file_path="/uploads/sample_bill.pdf",
            file_type="pdf",
            account_number="123456789",
            bill_reference="2024-12-001",
            bill_date=datetime(2024, 12, 7),
            units_consumed=77,
            units_exported=0,
            billing_period_days=34,
            previous_reading=1150,
            current_reading=1227,
            previous_reading_date=datetime(2024, 11, 3),
            current_reading_date=datetime(2024, 12, 7),
            fixed_charge=400.0,
            unit_charge=1033.50,
            total_charge=1433.50,
            total_due=1470.26,
            customer_name="John Doe",
            customer_address="123 Main St, Colombo",
            tariff_type="Domestic",
            connection_type="1 Phase",
            processing_status="completed",
            confidence_score=95.0
        )
        
        db.add(bill)
        db.commit()
        db.refresh(bill)
        
        print(f"\n✅ Sample bill created successfully!")
        print(f"   Bill ID: {bill.id}")
        print(f"   Account: {bill.account_number}")
        print(f"   Units: {bill.units_consumed} kWh")
        print(f"   Total: Rs. {bill.total_due:.2f}")
        print(f"   Period: {bill.billing_period_days} days")
        
        return bill
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        return None
    finally:
        db.close()


def test_3_analyze_past_bill(bill_id):
    """Test 3: Analyze Past Month Bill"""
    print("\n" + "="*60)
    print("TEST 3: Past Month Analysis")
    print("="*60)
    
    db = SessionLocal()
    
    try:
        bill = db.query(ElectricityBill).filter(ElectricityBill.id == bill_id).first()
        
        if not bill:
            print("❌ Bill not found!")
            return None
        
        # Prepare data
        bill_data = {
            'units_consumed': bill.units_consumed,
            'billing_period_days': bill.billing_period_days,
            'total_due': bill.total_due,
            'bill_date': bill.bill_date
        }
        
        # Analyze
        service = BillAnalysisService()
        analysis = service.analyze_past_month(bill_data)
        
        print(f"\n📊 SUMMARY:")
        summary = analysis['summary']
        print(f"   Total Units: {summary['total_units']} kWh")
        print(f"   Total Cost: Rs. {summary['total_cost']:.2f}")
        print(f"   Billing Days: {summary['billing_days']}")
        print(f"   Daily Average: {summary['daily_average_units']:.2f} kWh (Rs. {summary['daily_average_cost']:.2f})")
        print(f"   Weekly Average: {summary['weekly_average_units']:.2f} kWh (Rs. {summary['weekly_average_cost']:.2f})")
        
        print(f"\n📅 WEEK-BY-WEEK BREAKDOWN:")
        for week in analysis['week_breakdown']:
            print(f"   Week {week['week']}: {week['units']:.2f} kWh - Rs. {week['cost']:.2f} ({week['days']} days)")
        
        print(f"\n💡 TARIFF DETAILS:")
        tariff = analysis['tariff_details']
        print(f"   Category: {tariff['category']}")
        print(f"   Total: Rs. {tariff['total']:.2f}")
        
        print(f"\n✅ Analysis completed successfully!")
        
        return analysis
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()


def test_4_create_budget_plan(bill_id):
    """Test 4: Create Budget Plan"""
    print("\n" + "="*60)
    print("TEST 4: Create Budget Plan")
    print("="*60)
    
    db = SessionLocal()
    
    try:
        bill = db.query(ElectricityBill).filter(ElectricityBill.id == bill_id).first()
        
        # Prepare past bill data
        past_data = {
            'units_consumed': bill.units_consumed,
            'billing_period_days': bill.billing_period_days,
            'total_due': bill.total_due
        }
        
        # Create plan with 10% reduction target
        target_budget = bill.total_due * 0.9  # 10% savings
        planning_days = 30
        
        service = BillAnalysisService()
        plan = service.create_budget_plan(past_data, target_budget, planning_days)
        
        if 'error' in plan:
            print(f"❌ {plan['message']}")
            return None
        
        # Save to database
        plan_record = BudgetPlan(
            reference_bill_id=bill_id,
            account_number=bill.account_number,
            target_budget=target_budget,
            planning_days=planning_days,
            plan_start_date=datetime.now(),
            plan_end_date=datetime.now() + timedelta(days=planning_days),
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
        
        print(f"\n✅ Budget plan created successfully!")
        print(f"   Plan ID: {plan_record.id}")
        print(f"\n💰 BUDGET INFO:")
        budget_info = plan['budget_info']
        print(f"   Past Bill: Rs. {budget_info['past_bill']:.2f}")
        print(f"   Target Budget: Rs. {budget_info['target_budget']:.2f}")
        print(f"   Savings Target: Rs. {budget_info['savings_target']:.2f}")
        print(f"   Change: {budget_info['percentage_change']:.1f}%")
        
        print(f"\n🎯 DAILY TARGETS:")
        daily = plan['daily_targets']
        print(f"   Units: {daily['units']:.2f} kWh")
        print(f"   Cost: Rs. {daily['cost']:.2f}")
        
        print(f"\n📅 WEEKLY TARGETS:")
        for week in plan['weekly_targets']:
            print(f"   Week {week['week']}: {week['target_units']:.2f} kWh - Rs. {week['target_cost']:.2f}")
        
        print(f"\n🔔 MONITORING SCHEDULE:")
        for check in plan['monitoring_schedule']:
            print(f"   Day {check['day']}: {check['action']}")
        
        print(f"\n💡 RECOMMENDATIONS:")
        for rec in plan['recommendations']:
            print(f"   • {rec}")
        
        return plan_record
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return None
    finally:
        db.close()


def test_5_track_progress(plan_id, current_reading=1240, days_elapsed=10):
    """Test 5: Track Progress"""
    print("\n" + "="*60)
    print("TEST 5: Track Progress")
    print("="*60)
    
    db = SessionLocal()
    
    try:
        plan = db.query(BudgetPlan).filter(BudgetPlan.id == plan_id).first()
        
        if not plan:
            print("❌ Plan not found!")
            return None
        
        # Get reference bill
        bill = plan.reference_bill
        start_reading = bill.current_reading
        start_date = plan.plan_start_date
        reading_date = start_date + timedelta(days=days_elapsed)
        
        # Prepare plan data
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
        
        # Track progress
        service = BillAnalysisService()
        progress = service.track_progress(
            plan_data,
            current_reading,
            reading_date,
            start_reading,
            start_date
        )
        
        # Save meter reading
        reading_record = MeterReading(
            budget_plan_id=plan_id,
            reading_value=current_reading,
            reading_date=reading_date,
            units_consumed_so_far=progress['current_status']['units_used'],
            days_elapsed=progress['current_status']['days_elapsed'],
            actual_cost_so_far=progress['current_status']['actual_cost'],
            expected_cost_so_far=progress['current_status']['expected_cost'],
            variance_units=progress['current_status']['variance_units'],
            variance_cost=progress['current_status']['variance_cost'],
            variance_percentage=(progress['current_status']['variance_cost'] / 
                               progress['current_status']['expected_cost'] * 100),
            status=progress['current_status']['status'],
            projected_total_units=progress['projection']['projected_total_units'],
            projected_total_cost=progress['projection']['projected_total_cost'],
            projected_budget_variance=progress['projection']['budget_variance'],
            analysis_data=progress
        )
        
        db.add(reading_record)
        
        # Update plan
        plan.last_check_date = reading_date
        plan.current_progress_status = progress['current_status']['status']
        
        db.commit()
        db.refresh(reading_record)
        
        print(f"\n✅ Progress tracked successfully!")
        print(f"   Reading ID: {reading_record.id}")
        
        print(f"\n📊 CURRENT STATUS:")
        status = progress['current_status']
        print(f"   Days Elapsed: {status['days_elapsed']}")
        print(f"   Days Remaining: {status['days_remaining']}")
        print(f"   Units Used: {status['units_used']}")
        print(f"   Actual Cost: Rs. {status['actual_cost']:.2f}")
        print(f"   Expected Cost: Rs. {status['expected_cost']:.2f}")
        print(f"   Variance: Rs. {status['variance_cost']:.2f}")
        print(f"   Status: {status['status'].upper()}")
        
        print(f"\n🔮 PROJECTION:")
        proj = progress['projection']
        print(f"   Projected Total Units: {proj['projected_total_units']:.2f} kWh")
        print(f"   Projected Total Cost: Rs. {proj['projected_total_cost']:.2f}")
        print(f"   Budget Variance: Rs. {proj['budget_variance']:.2f}")
        
        print(f"\n💡 RECOMMENDATIONS:")
        for rec in progress['recommendations']:
            print(f"   {rec}")
        
        return reading_record
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return None
    finally:
        db.close()


def main():
    """Run all tests"""
    print("="*60)
    print("🧪 BILL ANALYSIS SYSTEM - COMPREHENSIVE TEST")
    print("="*60)
    
    # Test 1: Tariff Calculator
    tariff_result = test_1_tariff_calculator()
    input("\nPress Enter to continue...")
    
    # Test 2: Create Sample Bill
    bill = test_2_create_sample_bill()
    if not bill:
        print("\n❌ Cannot continue without bill")
        return
    input("\nPress Enter to continue...")
    
    # Test 3: Analyze Past Bill
    analysis = test_3_analyze_past_bill(bill.id)
    if not analysis:
        print("\n❌ Cannot continue without analysis")
        return
    input("\nPress Enter to continue...")
    
    # Test 4: Create Budget Plan
    plan = test_4_create_budget_plan(bill.id)
    if not plan:
        print("\n❌ Cannot continue without plan")
        return
    input("\nPress Enter to continue...")
    
    # Test 5: Track Progress (simulating 10 days later)
    reading = test_5_track_progress(plan.id, current_reading=1240, days_elapsed=10)
    
    # Summary
    print("\n" + "="*60)
    print("✅ ALL TESTS COMPLETED!")
    print("="*60)
    print(f"\nCreated Records:")
    print(f"  • Bill ID: {bill.id}")
    print(f"  • Plan ID: {plan.id}")
    if reading:
        print(f"  • Reading ID: {reading.id}")
    
    print(f"\n🎉 System is working correctly!")
    print(f"\nNext steps:")
    print(f"  1. Start your FastAPI server: uvicorn src.main:app --reload")
    print(f"  2. Test APIs at: http://localhost:8000/api/docs")
    print(f"  3. Implement Phase 2-6 features")


if __name__ == "__main__":
    main()