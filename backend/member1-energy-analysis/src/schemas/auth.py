"""api/schemas/auth.py - Enhanced with refresh token support"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator


class UserRegisterRequest(BaseModel):
    """Schema for user registration request."""
    email: EmailStr
    phone_number: Optional[str] = Field(None, max_length=32)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=255)
    default_account_number: Optional[str] = Field(None, max_length=100)

    @validator('password')
    def validate_password(cls, v):
        """Validate password requirements."""
        if len(v.encode('utf-8')) > 128:
            raise ValueError('Password cannot exceed 128 bytes')
        return v

    @validator('phone_number')
    def validate_phone_number(cls, v):
        """Validate phone number format."""
        if v is not None:
            # Remove any spaces or dashes
            v = v.replace(' ', '').replace('-', '')
            # Basic validation - adjust according to your requirements
            if not v.isdigit():
                raise ValueError('Phone number must contain only digits')
        return v


class UserLoginRequest(BaseModel):
    """Schema for user login request."""
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    """Schema for Google OAuth login request."""
    id_token: str = Field(..., description="Google ID token from frontend")


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str = Field(..., description="Refresh token to generate new access token")


class UserProfileResponse(BaseModel):
    """Schema for user profile response."""
    id: int
    email: EmailStr
    phone_number: Optional[str]
    full_name: Optional[str]
    default_account_number: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    access_token: str
    refresh_token: Optional[str] = None  # Optional for backward compatibility
    token_type: str = "bearer"
    user: UserProfileResponse