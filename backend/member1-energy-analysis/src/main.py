"""
src/main.py
Updated with bill analysis routes
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.database import engine, Base
from src.api.route import router as main_router  # ✅ Changed from routes to route
from src.api.routes import bill_analysis  # ✅ Now imports from routes/ directory
from src.api.routes import appliances  # ✅ ADD THIS LINE

import logging
import os

# Create directories
os.makedirs("logs", exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/app.log"),
    ],
)

logger = logging.getLogger(__name__)

# Create database tables
logger.info("Creating database tables...")
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Database error: {e}")
    logger.error("Make sure PostgreSQL is running and database exists!")
    raise

# App
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    description="API for extracting and managing electricity bill data with analysis & budget planning",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include routes
app.include_router(main_router)
app.include_router(bill_analysis.router, prefix="/api/v1")
app.include_router(appliances.router, prefix="/api/v1")
# app.include_router(appliances.router)  # ✅ ADD THIS LINE


logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} initialized")


@app.get("/")
def root():
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/api/docs",
        "features": [
            "Bill Extraction (OCR + Parsing)",
            "Past Month Analysis",
            "Budget Planning",
            "Progress Tracking",
            "Tariff Calculator",
             "Appliance Management" 
        ]
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "database": "PostgreSQL",
        "features_enabled": [
            "bill_extraction",
            "bill_analysis",
            "budget_planning",
            "progress_tracking",
            "appliance_management" 
        ]
    }


@app.on_event("startup")
async def startup_event():
    logger.info("Application startup complete")
    logger.info(f"API documentation: http://localhost:8000/api/docs")
    logger.info("Features enabled:")
    logger.info("  - Bill Extraction & OCR")
    logger.info("  - Past Month Analysis")
    logger.info("  - Budget Planning")
    logger.info("  - Progress Tracking")
    logger.info("  - Appliance Management") 


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning",
    )