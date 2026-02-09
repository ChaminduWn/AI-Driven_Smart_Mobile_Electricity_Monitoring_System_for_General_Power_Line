from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from src.database import Base


class User(Base):
    """Application user for authentication"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    # Credentials & identity
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(32), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)  # nullable to support Google-only accounts
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"


class UserProfile(Base):
    """Extended profile information for a user"""
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    full_name = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    
    # For linking to electricity account if needed later
    default_account_number = Column(String(100), nullable=True)
    
    user = relationship("User", back_populates="profile")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<UserProfile(id={self.id}, user_id={self.user_id}, full_name={self.full_name})>"