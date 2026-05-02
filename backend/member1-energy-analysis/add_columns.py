import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database import engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE electricity_bills ADD COLUMN title VARCHAR(100);"))
            print("Added title column")
        except Exception as e:
            print("title column error:", e)

        try:
            conn.execute(text("ALTER TABLE electricity_bills ADD COLUMN is_manual BOOLEAN DEFAULT FALSE;"))
            print("Added is_manual column")
        except Exception as e:
            print("is_manual column error:", e)

        try:
            conn.execute(text("ALTER TABLE electricity_bills ADD COLUMN is_active_for_dashboard BOOLEAN DEFAULT FALSE;"))
            print("Added is_active_for_dashboard column")
        except Exception as e:
            print("is_active_for_dashboard error:", e)

        conn.commit()

if __name__ == "__main__":
    add_columns()
