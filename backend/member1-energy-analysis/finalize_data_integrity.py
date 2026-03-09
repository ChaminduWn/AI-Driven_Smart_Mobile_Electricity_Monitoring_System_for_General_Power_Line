
import sys
import os
from datetime import datetime
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker

# Add the project root to sys.path to allow importing from src
sys.path.append(os.getcwd())

from src.config import settings

def get_engine():
    return create_engine(settings.DATABASE_URL)

def run_fix():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()
    
    print("🚀 Starting Data Integrity Enforcement & Cleanup...")
    
    try:
        # 1. Ensure every user has a profile
        print("👤 Checking for users without profiles...")
        users_without_profile = session.execute(text("""
            SELECT id, email FROM users 
            WHERE id NOT IN (SELECT user_id FROM user_profiles)
        """)).fetchall()
        
        for u in users_without_profile:
            print(f"   - Creating profile for {u.email} (ID: {u.id})")
            session.execute(text("INSERT INTO user_profiles (user_id, created_at, updated_at) VALUES (:uid, NOW(), NOW())"), {"uid": u.id})
        
        # 2. Backfill default_account_number in profiles from bills
        print("📝 Backfilling account numbers into user profiles from bills...")
        session.execute(text("""
            UPDATE user_profiles up
            SET default_account_number = eb.account_number
            FROM electricity_bills eb
            WHERE up.user_id = eb.user_id 
              AND up.default_account_number IS NULL
              AND eb.account_number IS NOT NULL
        """))
        
        # 3. Fix electricity_bills missing user_id
        # Try to link via account_number if we know who owns that account
        print("📄 Linking orphaned bills to users via account numbers...")
        session.execute(text("""
            UPDATE electricity_bills eb
            SET user_id = up.user_id
            FROM user_profiles up
            WHERE eb.user_id IS NULL 
              AND eb.account_number = up.default_account_number
              AND up.default_account_number IS NOT NULL
        """))
        
        # 4. Fix device_sessions missing user_id or account_number
        print("🖥️  Fixing device sessions...")
        # Link via account_number
        session.execute(text("""
            UPDATE device_sessions ds
            SET user_id = up.user_id
            FROM user_profiles up
            WHERE ds.user_id IS NULL 
              AND ds.account_number = up.default_account_number
              AND up.default_account_number IS NOT NULL
        """))
        # Link via user_id (fill missing account number)
        session.execute(text("""
            UPDATE device_sessions ds
            SET account_number = up.default_account_number
            FROM user_profiles up
            WHERE ds.account_number IS NULL 
              AND ds.user_id = up.user_id
              AND up.default_account_number IS NOT NULL
        """))
        
        # 5. Fix budget_plans missing user_id
        print("💰 Fixing budget plans...")
        session.execute(text("""
            UPDATE budget_plans bp
            SET user_id = up.user_id
            FROM user_profiles up
            WHERE bp.user_id IS NULL 
              AND bp.account_number = up.default_account_number
              AND up.default_account_number IS NOT NULL
        """))

        # 6. Apply Schema Hardening (NOT NULL constraints)
        print("🛡️  Hardening schema with NOT NULL constraints...")
        
        # We need to handle potential failures if data still has NULLs after our best effort
        tables_to_harden = [
            ("electricity_bills", ["account_number", "user_id"]),
            ("device_sessions", ["account_number", "user_id"]),
            ("budget_plans", ["account_number"]),
            ("household_appliances", ["account_number"]),
            ("household_members", ["account_number"]),
            ("iot_readings", ["account_number"]),
            ("device_readings", ["account_number"]),
            ("appliance_events", ["account_number"])
        ]
        
        for table, columns in tables_to_harden:
            for col in columns:
                try:
                    # First set a placeholder for any remaining NULLs to satisfy NOT NULL
                    placeholder = "UNKNOWN" if "account" in col else "1" # Assuming 1 is a safe user ID fallback or it will fail FK
                    if "user_id" in col:
                        # Find a fallback user or just skip hardening if we can't be sure
                        first_user = session.execute(text("SELECT id FROM users LIMIT 1")).fetchone()
                        if first_user:
                            session.execute(text(f"UPDATE {table} SET {col} = :uid WHERE {col} IS NULL"), {"uid": first_user.id})
                    else:
                        session.execute(text(f"UPDATE {table} SET {col} = 'UNKNOWN' WHERE {col} IS NULL"))
                    
                    # Now apply the constraint
                    session.execute(text(f"ALTER TABLE {table} ALTER COLUMN {col} SET NOT NULL"))
                    print(f"   ✓ {table}.{col} is now NOT NULL")
                except Exception as e:
                    print(f"   ⚠️ Could not harden {table}.{col}: {e}")

        session.commit()
        print("\n✅ Data integrity fix completed successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ CRITICAL ERROR: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    run_fix()
