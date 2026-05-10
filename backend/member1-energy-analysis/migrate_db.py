import sys
import os

# Add the project root to sys.path to allow importing from src
sys.path.append(os.getcwd())

from sqlalchemy import text
from src.database import engine

def migrate():
    print("Checking database for missing columns...")
    with engine.connect() as conn:
        # Check if user_id exists in electricity_bills
        query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='electricity_bills' AND column_name='user_id';
        """)
        result = conn.execute(query).fetchone()
        
        if not result:
            print("Adding user_id column to electricity_bills...")
            conn.execute(text("ALTER TABLE electricity_bills ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;"))
            conn.commit()
            print("Successfully added user_id column.")
        else:
            print("user_id column already exists.")

        # Check if is_admin exists in users
        query_admin = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='is_admin';
        """)
        result_admin = conn.execute(query_admin).fetchone()

        if not result_admin:
            print("Adding is_admin column to users...")
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;"))
            conn.commit()
            print("Successfully added is_admin column.")
        else:
            print("is_admin column already exists.")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Migration error: {e}")
