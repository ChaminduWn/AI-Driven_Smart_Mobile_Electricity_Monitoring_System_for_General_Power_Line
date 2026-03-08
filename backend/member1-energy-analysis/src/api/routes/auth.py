"""api/routes/auth.py - with Google Web Client ID verification"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import logging

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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login-form")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES  = 15
REFRESH_TOKEN_EXPIRE_DAYS    = 7

# ── Google Client IDs — read from settings (which reads from .env) ────────────
GOOGLE_CLIENT_ID          = settings.GOOGLE_CLIENT_ID
GOOGLE_ANDROID_CLIENT_ID  = settings.GOOGLE_ANDROID_CLIENT_ID
GOOGLE_IOS_CLIENT_ID      = settings.GOOGLE_IOS_CLIENT_ID


# ─────────────────────────────────────────────────────────────────────────────
#  PASSWORD HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ─────────────────────────────────────────────────────────────────────────────
#  JWT HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def get_user_from_token(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        logger.error("No token received")
        raise credentials_exception

    try:
        payload    = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id    = payload.get("sub")
        token_type = payload.get("type")

        if user_id is None or token_type != "access":
            raise credentials_exception

    except JWTError as e:
        logger.error(f"JWT error: {e}")
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


# ─────────────────────────────────────────────────────────────────────────────
#  REGISTER
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    try:
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=400, detail="Email is already registered")

        if payload.phone_number:
            if db.query(User).filter(User.phone_number == payload.phone_number).first():
                raise HTTPException(status_code=400, detail="Phone number is already registered")

        user = User(
            email=payload.email,
            phone_number=payload.phone_number,
            hashed_password=get_password_hash(payload.password),
            is_active=True,
        )
        db.add(user)
        db.flush()

        profile = UserProfile(user_id=user.id, full_name=payload.full_name)
        db.add(profile)
        db.commit()
        db.refresh(user)
        db.refresh(profile)

        access_token  = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

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
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
#  LOGIN
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == payload.email).first()

        if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is inactive")

        profile       = user.profile
        access_token  = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

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
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
#  REFRESH TOKEN
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token_payload = jwt.decode(payload.refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id    = token_payload.get("sub")
        token_type = token_payload.get("type")

        if user_id is None or token_type != "refresh":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception

    profile           = user.profile
    new_access_token  = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})

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


# ─────────────────────────────────────────────────────────────────────────────
#  LOGIN FORM (Swagger UI / OAuth2)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/login-form", response_model=TokenResponse)
def login_user_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    profile       = user.profile
    access_token  = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

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


# ─────────────────────────────────────────────────────────────────────────────
#  GOOGLE LOGIN — Web Client ID only for now
#  When you get Android Client ID later, add it to GOOGLE_CLIENT_IDS list below
# ─────────────────────────────────────────────────────────────────────────────

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Verify Google ID token and login or register user.

    Currently accepts Web Client ID only.
    When Android/iOS Client IDs are ready, add them to GOOGLE_CLIENT_IDS.
    """

    # ── List of accepted Client IDs ──────────────────────────────────────────
    # Add Android and iOS Client IDs here later when you get them:
    #   GOOGLE_CLIENT_IDS = [
    #       GOOGLE_CLIENT_ID,
    #       GOOGLE_ANDROID_CLIENT_ID,
    #       GOOGLE_IOS_CLIENT_ID,
    #   ]
    GOOGLE_CLIENT_IDS = [id for id in [
        GOOGLE_CLIENT_ID,
        GOOGLE_ANDROID_CLIENT_ID,
        GOOGLE_IOS_CLIENT_ID,
    ] if id]  # filters out None values automatically

    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google Client ID not configured. Add GOOGLE_CLIENT_ID to backend .env"
        )

    # ── Verify token ──────────────────────────────────────────────────────────
    idinfo = None
    last_error = None

    # Try each client ID — whichever matches is valid
    for client_id in GOOGLE_CLIENT_IDS:
        if not client_id:
            continue
        try:
            idinfo = id_token.verify_oauth2_token(
                payload.id_token,
                google_requests.Request(),
                client_id
            )
            break  # verification succeeded
        except ValueError as e:
            last_error = e
            continue  # try next client ID

    if idinfo is None:
        logger.error(f"Google token verification failed: {last_error}")
        raise HTTPException(
            status_code=401,
            detail="Invalid Google token. Make sure you are using the correct Client ID."
        )

    # ── Check issuer ──────────────────────────────────────────────────────────
    if idinfo.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
        raise HTTPException(status_code=401, detail="Invalid token issuer")

    # ── Extract user info from token ──────────────────────────────────────────
    google_id = idinfo.get("sub")       # unique Google user ID
    email     = idinfo.get("email")
    full_name = idinfo.get("name")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email address")

    # ── Find or create user ───────────────────────────────────────────────────
    try:
        # 1. Try find by Google ID first
        user = db.query(User).filter(User.google_id == google_id).first()

        if not user:
            # 2. Try find by email (user may have registered with email before)
            user = db.query(User).filter(User.email == email).first()

            if not user:
                # 3. Create brand new user
                user = User(
                    email=email,
                    google_id=google_id,
                    is_active=True,
                    hashed_password=None,  # Google-only account has no password
                )
                db.add(user)
                db.flush()

                profile = UserProfile(user_id=user.id, full_name=full_name)
                db.add(profile)
                db.commit()
                db.refresh(user)
                db.refresh(profile)

                logger.info(f"New user created via Google: {email}")

            else:
                # 4. Existing email user — link their Google ID
                if not user.google_id:
                    user.google_id = google_id
                    db.commit()
                    logger.info(f"Linked Google ID to existing user: {email}")

                profile = user.profile
        else:
            profile = user.profile

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is inactive")

        # ── Generate tokens ───────────────────────────────────────────────────
        access_token  = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

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
        db.rollback()
        logger.error(f"Google login DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during Google login")


# ─────────────────────────────────────────────────────────────────────────────
#  GET CURRENT USER
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_user_from_token)):
    profile = current_user.profile
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        phone_number=current_user.phone_number,
        full_name=profile.full_name if profile else None,
        default_account_number=profile.default_account_number if profile else None,
        created_at=current_user.created_at,
    )


# ─────────────────────────────────────────────────────────────────────────────
#  LOGOUT
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/logout")
def logout(current_user: User = Depends(get_user_from_token)):
    # JWT is stateless — actual logout happens client-side by deleting tokens
    return {"message": "Successfully logged out"}