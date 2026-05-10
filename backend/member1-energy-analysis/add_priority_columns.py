import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database import engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE budget_plans ADD COLUMN is_priority BOOLEAN DEFAULT FALSE;"))
            print("Added is_priority column")
        except Exception as e:
            print("is_priority column error:", e)

        try:
            conn.execute(text("ALTER TABLE budget_plans ADD COLUMN priority_set_at TIMESTAMP;"))
            print("Added priority_set_at column")
        except Exception as e:
            print("priority_set_at column error:", e)

        conn.commit()

if __name__ == "__main__":
    add_columns()
