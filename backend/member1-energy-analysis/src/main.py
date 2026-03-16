""" src/main.py - FIXED VERSION with IoT Live Meter """

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.database import engine, Base, SessionLocal          # ← ADDED SessionLocal
from src.api.route import router as main_router
from src.api.routes import bill_analysis
from src.api.routes import appliances
from src.api.routes import nilm
from src.api.routes import household 
from src.api.routes import ml_predictions
from src.api.routes import auth
from src.api.routes import smart_predictions
from src.api.routes import iot, notifications
from src.services.iot_service import iot_service

# Import all models to register them with SQLAlchemy (needed for create_all)
from src.models import (
    Base as ModelsBase,
    ElectricityBill,
    User,
    UserProfile,
    BudgetPlan,
    MeterReading,
    HouseholdAppliance,
    HouseholdMember,
    TariffStructure,
    LiveMeterReading,
    ApplianceEvent,
    DeviceSession,          # ← ADDED
    DeviceReading,          # ← ADDED
    DeviceApplianceEvent,   # ← ADDED
)

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
    description="AI-powered electricity bill analysis with NILM disaggregation",
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"DEBUG: Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"DEBUG: Response status: {response.status_code}")
    return response

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
        "http://localhost:8813",
        "http://127.0.0.1:8813",
        "http://localhost:19000",
        "http://localhost:19006",
        "http://10.134.218.242:8081",
        "http://10.134.218.242:8000",
        "http://192.168.177.242:8081",
        "http://192.168.177.242:8000",
        "exp://192.168.177.242:8081",
        "http://192.168.1.105:8081",
        "http://192.168.1.105:8813",
        "http://192.168.90.242:8081",
        "http://192.168.90.242:8000",
        "exp://192.168.90.242:8081",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Include all routes
app.include_router(main_router)
app.include_router(auth.router,               prefix="/api/v1")
app.include_router(bill_analysis.router,      prefix="/api/v1")
app.include_router(appliances.router,         prefix="/api/v1")
app.include_router(nilm.router,               prefix="/api/v1")  
app.include_router(household.router,          prefix="/api/v1")
app.include_router(ml_predictions.router,     prefix="/api/v1")
app.include_router(smart_predictions.router,  prefix="/api/v1")
app.include_router(iot.router,                prefix="/api/v1")
app.include_router(notifications.router,      prefix="/api/v1")

logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} initialized")


@app.get("/debug-routes")
def list_routes():
    import json
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": list(route.methods) if hasattr(route, "methods") else None
        })
    return {"routes": routes}


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
            "Appliance Management",
            "AI Disaggregation (NILM)", 
            "Image Recognition",
            "IoT Live Meter",
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
            "appliance_management",
            "nilm_disaggregation", 
            "image_recognition",
            "iot_live_meter",
        ]
    }


@app.on_event("startup")
async def startup_event():
    logger.info("Application startup complete")
    logger.info(f"API documentation: http://localhost:8000/api/docs")
    logger.info("CORS enabled for: http://localhost:3000, http://localhost:5173")
    logger.info("Features enabled:")
    logger.info("  - Bill Extraction & OCR")
    logger.info("  - Past Month Analysis")
    logger.info("  - Budget Planning")
    logger.info("  - Progress Tracking")
    logger.info("  - Appliance Management")
    logger.info("  - AI Disaggregation (NILM)") 
    logger.info("  - Image Recognition")
    logger.info("  - IoT Live Meter (HiveMQ)")

    # Start IoT MQTT service — pass db factory so it can save readings
    iot_service.start(db_factory=SessionLocal)                              # ← CHANGED
    logger.info("IoT service started — subscribed to energyiq/device/+/live on HiveMQ")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down...")
    iot_service.stop()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning",
    )