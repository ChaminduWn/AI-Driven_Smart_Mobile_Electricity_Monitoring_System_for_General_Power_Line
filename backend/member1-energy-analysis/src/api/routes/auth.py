"""api/routes/auth.py - FIXED VERSION with simplified password hashing"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from src.config import settings
from src.database import get_db
from src.models.user import User, UserProfile
from src.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    GoogleLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserProfileResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# FIXED: Simplified password context - no pre-hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login-form")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Short-lived access token
REFRESH_TOKEN_EXPIRE_DAYS = 7     # Long-lived refresh token


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    FIXED: Removed problematic pre-hashing logic that was causing issues.
    Bcrypt can handle up to 72 bytes, which is sufficient for most passwords.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hashed password.
    FIXED: No pre-hashing needed.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_from_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Extract and validate user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[int] = payload.get("sub")
        token_type: Optional[str] = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


@router.post("/register", response_model=TokenResponse)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with email/phone and password."""
    try:
        # Check if email already exists
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already registered")

        # Check if phone number already exists (if provided)
        if payload.phone_number:
            phone_exists = db.query(User).filter(User.phone_number == payload.phone_number).first()
            if phone_exists:
                raise HTTPException(status_code=400, detail="Phone number is already registered")

        # Create new user
        user = User(
            email=payload.email,
            phone_number=payload.phone_number,
            hashed_password=get_password_hash(payload.password),
            is_active=True,
        )
        db.add(user)
        db.flush()

        # Create user profile
        profile = UserProfile(
            user_id=user.id,
            full_name=payload.full_name,
        )
        db.add(profile)
        db.commit()
        db.refresh(user)
        db.refresh(profile)

        # Generate tokens
        access_token = create_access_token({"sub": user.id})
        refresh_token = create_refresh_token({"sub": user.id})

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserProfileResponse(
                id=user.id,
                email=user.email,
                phone_number=user.phone_number,
                full_name=profile.full_name,
                default_account_number=profile.default_account_number,
                created_at=user.created_at,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Login with email + password and return JWT."""
    try:
        user = db.query(User).filter(User.email == payload.email).first()
        
        if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is inactive")

        profile = user.profile
        
        # Generate tokens
        access_token = create_access_token({"sub": user.id})
        refresh_token = create_refresh_token({"sub": user.id})

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserProfileResponse(
                id=user.id,
                email=user.email,
                phone_number=user.phone_number,
                full_name=profile.full_name if profile else None,
                default_account_number=profile.default_account_number if profile else None,
                created_at=user.created_at,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode refresh token
        token_payload = jwt.decode(payload.refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[int] = token_payload.get("sub")
        token_type: Optional[str] = token_payload.get("type")
        
        if user_id is None or token_type != "refresh":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # Get user from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception

    profile = user.profile
    
    # Generate new tokens
    new_access_token = create_access_token({"sub": user.id})
    new_refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=UserProfileResponse(
            id=user.id,
            email=user.email,
            phone_number=user.phone_number,
            full_name=profile.full_name if profile else None,
            default_account_number=profile.default_account_number if profile else None,
            created_at=user.created_at,
        ),
    )


@router.post("/login-form", response_model=TokenResponse)
def login_user_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    OAuth2-compatible login endpoint (email as username).
    Used by Swagger UI and can be used by frontend if preferred.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    profile = user.profile
    
    # Generate tokens
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserProfileResponse(
            id=user.id,
            email=user.email,
            phone_number=user.phone_number,
            full_name=profile.full_name if profile else None,
            default_account_number=profile.default_account_number if profile else None,
            created_at=user.created_at,
        ),
    )


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Login/register via Google.
    NOTE: This endpoint assumes the frontend has already verified the Google ID token
    and is sending a trusted google_id + email.
    """
    # Try to find user by Google ID
    user = db.query(User).filter(User.google_id == payload.google_id).first()
    
    if not user:
        # Fallback: match by email if existing
        user = db.query(User).filter(User.email == payload.email).first()
        
        if not user:
            # Create new user
            user = User(
                email=payload.email,
                google_id=payload.google_id,
                is_active=True,
            )
            db.add(user)
            db.flush()

            profile = UserProfile(
                user_id=user.id,
                full_name=payload.full_name,
            )
            db.add(profile)
            db.commit()
            db.refresh(user)
            db.refresh(profile)
        else:
            # Update existing user with Google ID
            user.google_id = payload.google_id
            db.commit()
            profile = user.profile
    else:
        profile = user.profile

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    # Generate tokens
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserProfileResponse(
            id=user.id,
            email=user.email,
            phone_number=user.phone_number,
            full_name=profile.full_name if profile else None,
            default_account_number=profile.default_account_number if profile else None,
            created_at=user.created_at,
        ),
    )


@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_user_from_token)):
    """Return current authenticated user profile."""
    profile = current_user.profile
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        phone_number=current_user.phone_number,
        full_name=profile.full_name if profile else None,
        default_account_number=profile.default_account_number if profile else None,
        created_at=current_user.created_at,
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_user_from_token)):
    """
    Logout endpoint. 
    In a stateless JWT system, logout is primarily handled client-side by deleting tokens.
    This endpoint can be used for logging/audit purposes.
    """
    return {"message": "Successfully logged out"}