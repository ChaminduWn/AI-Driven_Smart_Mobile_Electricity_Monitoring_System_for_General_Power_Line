from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
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
    bills = relationship("ElectricityBill", back_populates="user", cascade="all, delete-orphan")

    @property
    def selected_account(self) -> str:
        """Unified helper to get the best available account number for the user."""
        # 1. Check profile
        if self.profile and self.profile.default_account_number:
            return self.profile.default_account_number
            
        # 2. Check most recent bill
        if self.bills:
            # Sort bills by date descending
            sorted_bills = sorted([b for b in self.bills if b.bill_date], key=lambda x: x.bill_date, reverse=True)
            if sorted_bills and sorted_bills[0].account_number:
                return sorted_bills[0].account_number
            
            # Fallback to absolute latest bill by ID if dates are missing
            if self.bills[-1].account_number:
                return self.bills[-1].account_number

        return None

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


class Notification(Base):
    """User notifications and alerts"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info") # info, success, warning, danger
    
    is_read = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, title={self.title})>"