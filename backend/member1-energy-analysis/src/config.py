from pydantic_settings import BaseSettings
from typing import List, Optional
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Energy Bill Extraction API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str

    # Database
    DATABASE_URL: str

    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760
    ALLOWED_EXTENSIONS: str = "pdf,jpg,jpeg,png"  # Keep as string
    UPLOAD_DIR: str = "uploads"

    # OCR
    TESSERACT_CMD: str
    OCR_LANG: str = "eng"

    # Redis
    REDIS_URL: Optional[str] = None

    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"  # admin-panel / member1-web (Vite)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(',')]
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]


settings = Settings()