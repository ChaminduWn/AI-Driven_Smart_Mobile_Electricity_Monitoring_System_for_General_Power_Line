"""
src/api/routes/iot.py
======================
Place this file at: src/api/routes/iot.py

Endpoints:
  WS   /api/v1/iot/ws/{account_number}              ← mobile app connects here
  GET  /api/v1/iot/latest/{account_number}         ← get latest reading (live)
  GET  /api/v1/iot/history/{account_number}        ← get reading history (live)
  GET  /api/v1/iot/stored-history/{account_number} ← get readings from database
  GET  /api/v1/iot/status/{account_number}         ← check device online
  POST /api/v1/iot/store/{account_number}          ← store reading in DB
  POST /api/v1/iot/simulate/{account_number}       ← test without ESP32
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from src.services.iot_service import iot_service
from src.database import get_db
from src.models.iot_reading import LiveMeterReading, ApplianceEvent
from datetime import datetime, timedelta
import logging
import json
import random
import time

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/iot", tags=["IoT Live Meter"])


# ── WebSocket — mobile app connects here ─────────────────────────────────────
@router.websocket("/ws/{account_number}")
async def meter_websocket(websocket: WebSocket, account_number: str):
    """
    Mobile app connects to this WebSocket for live data.
    URL: ws://YOUR_PC_IP:8000/api/v1/iot/ws/ACC001

    Messages received by app:
      { "type": "snapshot",       "data": { latest, history, appliance_events } }
      { "type": "live_reading",   "data": { voltage, current, power, ... } }
      { "type": "appliance_event","data": { from, to, watts, ... } }
    """
    await websocket.accept()
    iot_service.register_websocket(account_number, websocket)
    logger.info(f"WebSocket opened: {account_number}")

    # Send existing data immediately when app connects
    latest  = iot_service.get_latest(account_number)
    history = iot_service.get_history(account_number, minutes=5)
    events  = iot_service.get_appliance_events(account_number)

    await websocket.send_json({
        "type": "snapshot",
        "data": {
            "latest":           latest,
            "history":          history,
            "appliance_events": events,
        }
    })

    try:
        while True:
            try:
                msg = await websocket.receive_text()
                if msg == "ping":
                    # Reply with JSON so clients expecting JSON won't error when parsing
                    await websocket.send_json({"type": "pong"})
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        iot_service.unregister_websocket(account_number, websocket)
        logger.info(f"WebSocket closed: {account_number}")


# ── Store reading in database ────────────────────────────────────────────────
@router.post("/store/{account_number}")
async def store_reading(
    account_number: str,
    data: dict,
    db: Session = Depends(get_db)
):
    """
    Store a live meter reading in the database.
    Called from MQTT wrapper or IoT service.
    
    Expected fields:
    - voltage, current, power, energy, frequency, power_factor
    - session_kwh, session_cost_rs
    - detected_appliance, anomaly
    - read_count, uptime_ms, wifi_rssi
    """
    try:
        reading = LiveMeterReading(
            account_number=account_number,
            voltage=float(data.get('voltage', 0)),
            current=float(data.get('current', 0)),
            power=float(data.get('power', 0)),
            energy=float(data.get('energy', 0)),
            frequency=float(data.get('frequency', 50)),
            power_factor=float(data.get('power_factor', 1)),
            session_kwh=float(data.get('session_kwh', 0)),
            session_cost_rs=float(data.get('session_cost_rs', 0)),
            detected_appliance=data.get('detected_appliance'),
            anomaly=data.get('anomaly'),
            read_count=int(data.get('read_count', 0)),
            uptime_ms=int(data.get('uptime_ms', 0)),
            wifi_rssi=int(data.get('wifi_rssi', -100)),
            raw_data=data,
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)
        logger.info(f"Stored reading for {account_number}: {reading.power}W")
        return {"status": "stored", "id": reading.id}
    except Exception as e:
        logger.error(f"Failed to store reading: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Store appliance event ────────────────────────────────────────────────────
@router.post("/store-event/{account_number}")
async def store_event(
    account_number: str,
    from_appliance: str,
    to_appliance: str,
    watts: float,
    db: Session = Depends(get_db)
):
    """Store an appliance change event in the database."""
    try:
        event = ApplianceEvent(
            account_number=account_number,
            from_appliance=from_appliance,
            to_appliance=to_appliance,
            watts=watts,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        logger.info(f"Stored event for {account_number}: {from_appliance} -> {to_appliance}")
        return {"status": "stored", "id": event.id}
    except Exception as e:
        logger.error(f"Failed to store event: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Get latest reading (from memory) ──────────────────────────────────────────
@router.get("/latest/{account_number}")
async def get_latest(account_number: str):
    """Get the latest live reading from memory cache"""
    data = iot_service.get_latest(account_number)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"No live data for {account_number}. Is ESP32 powered on?"
        )
    return data


# ── Get reading history (from memory) ────────────────────────────────────────
@router.get("/history/{account_number}")
async def get_history(
    account_number: str,
    minutes: int = Query(default=5, ge=1, le=60)
):
    """Get reading history from memory cache (last N minutes)"""
    history = iot_service.get_history(account_number, minutes)
    return {
        "account_number": account_number,
        "minutes":        minutes,
        "count":          len(history),
        "readings":       history,
    }


# ── Get stored history from database ─────────────────────────────────────────
@router.get("/stored-history/{account_number}")
async def get_stored_history(
    account_number: str,
    hours: int = Query(default=24, ge=1, le=365*24),
    limit: int = Query(default=1000, ge=1, le=10000),
    db: Session = Depends(get_db)
):
    """
    Get stored readings from database for analysis.
    Useful for historical analysis over days/weeks.
    """
    try:
        since = datetime.utcnow() - timedelta(hours=hours)
        readings = db.query(LiveMeterReading).filter(
            LiveMeterReading.account_number == account_number,
            LiveMeterReading.recorded_at >= since
        ).order_by(LiveMeterReading.recorded_at.desc()).limit(limit).all()
        
        return {
            "account_number": account_number,
            "hours": hours,
            "count": len(readings),
            "readings": [r.to_dict() for r in readings]
        }
    except Exception as e:
        logger.error(f"Failed to get stored history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Get appliance event history ──────────────────────────────────────────────
@router.get("/events/{account_number}")
async def get_events(
    account_number: str,
    hours: int = Query(default=24, ge=1, le=365*24),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get appliance change events from database"""
    try:
        since = datetime.utcnow() - timedelta(hours=hours)
        events = db.query(ApplianceEvent).filter(
            ApplianceEvent.account_number == account_number,
            ApplianceEvent.event_time >= since
        ).order_by(ApplianceEvent.event_time.desc()).limit(limit).all()
        
        return {
            "account_number": account_number,
            "hours": hours,
            "count": len(events),
            "events": [e.to_dict() for e in events]
        }
    except Exception as e:
        logger.error(f"Failed to get events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Device status ─────────────────────────────────────────────────────────────
@router.get("/status/{account_number}")
async def device_status(account_number: str):
    latest = iot_service.get_latest(account_number)

    if not latest:
        return {
            "account_number": account_number,
            "device_online":  False,
            "message":        "No data received yet. Power on your ESP32.",
        }

    try:
        last_seen    = datetime.fromisoformat(latest.get("server_time", ""))
        seconds_ago  = (datetime.utcnow() - last_seen).total_seconds()
        online       = seconds_ago < 30
    except Exception:
        seconds_ago  = 9999
        online       = False

    return {
        "account_number":       account_number,
        "device_online":        online,
        "last_seen_seconds_ago": round(seconds_ago),
        "latest_voltage":       latest.get("voltage"),
        "latest_power":         latest.get("power"),
        "detected_appliance":   latest.get("detected_appliance"),
        "anomalies":            latest.get("anomalies", []),
    }


# ── Simulate — test without ESP32 ────────────────────────────────────────────
@router.post("/simulate/{account_number}")
async def simulate(
    account_number: str,
    scenario: str = Query(default="idle")
):
    """
    Inject fake data to test the app without real ESP32 hardware.
    Call this from browser or Postman.

    Scenarios: idle | fan | rice_cooker | ac | tv | washing_machine | spike
    """
    scenarios = {
        "idle":             {"voltage": 231.2, "current": 0.08,  "power": 12.5,   "energy": 5.234, "frequency": 50.0, "power_factor": 0.68, "detected_appliance": "Standby / Off"},
        "fan":              {"voltage": 230.8, "current": 0.35,  "power": 72.0,   "energy": 5.290, "frequency": 50.0, "power_factor": 0.89, "detected_appliance": "Fan (High)"},
        "rice_cooker":      {"voltage": 229.5, "current": 3.95,  "power": 876.0,  "energy": 5.456, "frequency": 49.9, "power_factor": 0.97, "detected_appliance": "Rice Cooker (Cooking)"},
        "ac":               {"voltage": 228.0, "current": 6.12,  "power": 1380.0, "energy": 6.120, "frequency": 50.0, "power_factor": 0.98, "detected_appliance": "AC (High)"},
        "tv":               {"voltage": 231.0, "current": 0.68,  "power": 145.0,  "energy": 5.310, "frequency": 50.0, "power_factor": 0.92, "detected_appliance": "Television"},
        "washing_machine":  {"voltage": 230.1, "current": 4.20,  "power": 850.0,  "energy": 5.780, "frequency": 50.1, "power_factor": 0.88, "detected_appliance": "Washing Machine"},
        "spike":            {"voltage": 229.8, "current": 8.50,  "power": 1950.0, "energy": 5.890, "frequency": 50.0, "power_factor": 0.99, "detected_appliance": "Heavy Load"},
    }

    if scenario not in scenarios:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario. Choose: {list(scenarios.keys())}"
        )

    data = scenarios[scenario].copy()

    # Add small noise to make it look realistic
    data["voltage"]      += random.uniform(-1.5, 1.5)
    data["current"]      += random.uniform(-0.01, 0.01)
    data["power"]        += random.uniform(-5, 5)
    data["energy"]       += 0.001
    data["account_number"] = account_number
    data["session_kwh"]  = round(data["energy"] * 0.05, 3)
    data["session_cost_rs"] = round(data["session_kwh"] * 15, 1)
    data["anomaly"]      = ""
    data["timestamp_ms"] = int(time.time() * 1000)

    iot_service.inject_simulated_reading(account_number, data)

    return {
        "status":   "injected",
        "scenario": scenario,
        "data":     data,
    }