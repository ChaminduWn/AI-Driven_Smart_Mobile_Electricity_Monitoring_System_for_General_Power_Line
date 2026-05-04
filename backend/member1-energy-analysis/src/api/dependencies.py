"""
FastAPI dependencies for dependency injection
"""
from typing import Generator
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import logging

from src.database import SessionLocal
from src.config import settings
from src.models.user import User

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login-form")


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    """
    Dependency to get current authenticated user using JWT bearer token.
    (Legacy name for get_user_from_token)
    """
    return get_user_from_token(token, db)


def get_user_from_token(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Centralized dependency to get user from JWT token.
    Resolves circular imports by living in dependencies.py.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        token_type = payload.get("type", "access") # Default to access for safety

        if user_id is None or (token_type != "access" and token_type != "refresh"):
            # Note: We usually only want access tokens for general API calls
            if token_type != "access":
                raise credentials_exception
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def verify_api_key(api_key: str = None):
    """
    Placeholder API key verification.
    """
    return True
