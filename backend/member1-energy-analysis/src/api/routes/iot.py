"""
src/api/routes/iot.py
======================
Place this file at: src/api/routes/iot.py

Endpoints:
  WS   /api/v1/iot/ws/{account_number}        ← mobile app connects here
  GET  /api/v1/iot/latest/{account_number}     ← get latest reading
  GET  /api/v1/iot/history/{account_number}    ← get reading history
  POST /api/v1/iot/simulate/{account_number}   ← test without ESP32
  GET  /api/v1/iot/status/{account_number}     ← check device online
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from src.services.iot_service import iot_service
from datetime import datetime
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
                    await websocket.send_text("pong")
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        iot_service.unregister_websocket(account_number, websocket)
        logger.info(f"WebSocket closed: {account_number}")


# ── Get latest reading ────────────────────────────────────────────────────────
@router.get("/latest/{account_number}")
async def get_latest(account_number: str):
    data = iot_service.get_latest(account_number)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"No live data for {account_number}. Is ESP32 powered on?"
        )
    return data


# ── Get reading history ───────────────────────────────────────────────────────
@router.get("/history/{account_number}")
async def get_history(
    account_number: str,
    minutes: int = Query(default=5, ge=1, le=60)
):
    history = iot_service.get_history(account_number, minutes)
    return {
        "account_number": account_number,
        "minutes":        minutes,
        "count":          len(history),
        "readings":       history,
    }


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