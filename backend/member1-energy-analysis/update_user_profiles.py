from src.database import engine
from sqlalchemy import text

def update_schema():
    with engine.connect() as conn:
        print("Updating user_profiles table...")
        
        # Add new columns if they don't exist
        try:
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS district VARCHAR(100);"))
            print("Added 'district' column.")
        except Exception as e:
            print(f"Error adding 'district': {e}")
            
        try:
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Householder';"))
            print("Added 'role' column.")
        except Exception as e:
            print(f"Error adding 'role': {e}")
            
        try:
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nvq_certificate_url TEXT;"))
            print("Added 'nvq_certificate_url' column.")
        except Exception as e:
            print(f"Error adding 'nvq_certificate_url': {e}")
            
        try:
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;"))
            print("Added 'is_verified' column.")
        except Exception as e:
            print(f"Error adding 'is_verified': {e}")
            
        # Drop country and city columns
        try:
            conn.execute(text("ALTER TABLE user_profiles DROP COLUMN IF EXISTS country;"))
            print("Dropped 'country' column.")
        except Exception as e:
            print(f"Error dropping 'country': {e}")
            
        try:
            conn.execute(text("ALTER TABLE user_profiles DROP COLUMN IF EXISTS city;"))
            print("Dropped 'city' column.")
        except Exception as e:
            print(f"Error dropping 'city': {e}")
            
        conn.commit()
        print("Schema update complete.")

if __name__ == "__main__":
    update_schema()
