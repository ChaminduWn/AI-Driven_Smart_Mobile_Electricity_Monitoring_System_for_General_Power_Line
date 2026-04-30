import sys
import os

# Add the directory containing 'src' to the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database import SessionLocal
from src.models.user import User, UserProfile
from src.api.routes.auth import get_password_hash

def seed():
    db = SessionLocal()
    admin = db.query(User).filter(User.email == 'admin@emscore.local').first()
    if not admin:
        admin = User(email='admin@emscore.local', hashed_password=get_password_hash('admin123'), is_active=True, is_admin=True)
        db.add(admin)
        db.flush()
        profile = UserProfile(user_id=admin.id, full_name='System Admin')
        db.add(profile)
        db.commit()
        print("Default admin created: admin@emscore.local / admin123")
    else:
        # Update pass just in case
        admin.hashed_password = get_password_hash('admin123')
        db.commit()
        print("Admin already exists: admin@emscore.local / admin123")
    db.close()

if __name__ == '__main__':
    seed()
