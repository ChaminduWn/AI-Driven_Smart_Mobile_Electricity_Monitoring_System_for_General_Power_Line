"""api/schemas/auth.py - Enhanced with refresh token support"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator


class UserRegisterRequest(BaseModel):
    """Schema for user registration request."""
    email: EmailStr
    username: Optional[str] = Field(None, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=32)
    password: str = Field(..., min_length=1, max_length=128)
    full_name: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    district: Optional[str] = Field(None, max_length=100)
    role: Optional[str] = Field("Householder", description="User role: Householder or Electrician")
    nvq_certificate_url: Optional[str] = None
    default_account_number: Optional[str] = Field(None, max_length=100)
    admin_code: Optional[str] = Field(None, description="Optional passcode to register as admin")

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
    username: Optional[str]
    phone_number: Optional[str]
    full_name: Optional[str]
    birthday: Optional[datetime]
    profile_image: Optional[str]
    default_account_number: Optional[str]
    address: Optional[str] = None
    district: Optional[str] = None
    role: Optional[str] = "Householder"
    nvq_certificate_url: Optional[str] = None
    is_verified: bool = False

    is_admin: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile."""
    full_name: Optional[str] = Field(None, max_length=255)
    username: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, max_length=32)
    birthday: Optional[datetime] = None
    profile_image: Optional[str] = None
    address: Optional[str] = Field(None, max_length=500)

    default_account_number: Optional[str] = Field(None, max_length=100)
    new_password: Optional[str] = Field(None, min_length=1, max_length=128)


class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    access_token: str
    refresh_token: Optional[str] = None  # Optional for backward compatibility
    token_type: str = "bearer"
    user: UserProfileResponse