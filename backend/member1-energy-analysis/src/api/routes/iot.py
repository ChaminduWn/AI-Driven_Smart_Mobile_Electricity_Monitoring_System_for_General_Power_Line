"""
src/api/routes/iot.py
=====================
IoT appliance-testing API routes.

Endpoints:
  POST   /iot/sessions                                 — start a test session
  POST   /iot/sessions/{account}/{session_id}/end      — end a session early
  GET    /iot/sessions/{account}/{session_id}          — session detail + health report
  GET    /iot/sessions/{account}                       — list sessions for account
  GET    /iot/sessions/{account}/{session_id}/readings — paginated raw readings
  GET    /iot/sessions/{account}/{session_id}/export   — download dataset (JSON / CSV)
  GET    /iot/latest/{device_id}                       — latest reading (in-memory)
  GET    /iot/history/{device_id}                      — recent history (in-memory)
  GET    /iot/status/{device_id}                       — is device online?
  GET    /iot/devices                                  — all known devices
  POST   /iot/simulate/{device_id}                     — inject test data (no hardware)
  WS     /iot/ws/{account}?device_id={MAC}             — live WebSocket
"""

import csv
import io
import json
import logging
import random
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.device_session import DeviceApplianceEvent, DeviceReading, DeviceSession
from src.services.iot_service import iot_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/iot", tags=["IoT"])


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    device_id:             str
    account_number:        str
    appliance_name:        str
    appliance_brand:       Optional[str] = None
    appliance_description: Optional[str] = None
    test_duration_min:     Optional[int] = 15


# ─────────────────────────────────────────────────────────────────────────────
# Session management
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/sessions")
def start_session(req: StartSessionRequest, db: Session = Depends(get_db)):
    """Create a new test session and link the device to it."""
    # End any existing active session for this device first
    existing_id = iot_service.get_active_session(req.device_id)
    if existing_id:
        old = db.query(DeviceSession).filter(DeviceSession.id == existing_id).first()
        if old and old.status == "active":
            old.status   = "abandoned"
            old.ended_at = datetime.now(timezone.utc)
            db.commit()

    session = DeviceSession(
        device_id             = req.device_id,
        account_number        = req.account_number,
        appliance_name        = req.appliance_name,
        appliance_brand       = req.appliance_brand,
        appliance_description = req.appliance_description,
        test_duration_min     = req.test_duration_min,
        status                = "active",
        started_at            = datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    iot_service.set_active_session(req.device_id, session.id, req.account_number)

    logger.info(f"Session {session.id} started — device={req.device_id} appliance={req.appliance_name}")
    return {
        "session_id":     session.id,
        "device_id":      req.device_id,
        "appliance_name": req.appliance_name,
        "status":         "active",
        "started_at":     session.started_at.isoformat(),
        "message":        "Session started. Plug the appliance into the tester now.",
    }


@router.post("/sessions/{account}/{session_id}/end")
async def end_session(account: str, session_id: int, db: Session = Depends(get_db)):
    """Manually end a session (user taps Stop)."""
    session = db.query(DeviceSession).filter(
        DeviceSession.id == session_id,
        DeviceSession.account_number == account,
    ).first()

    if not session:
        raise HTTPException(404, "Session not found")
    if session.status != "active":
        raise HTTPException(400, f"Session already {session.status}")

    # Trigger the service end-session logic (runs health check + AI)
    await iot_service._end_session(session.device_id)

    db.refresh(session)
    return {"message": "Session ended", "session_id": session_id, "status": session.status}


@router.get("/sessions/{account}/{session_id}")
def get_session(
    account:        str,
    session_id:     int,
    include_dataset: bool = Query(False, description="Include full reading array"),
    db:             Session = Depends(get_db),
):
    """Return session detail with health report and AI analysis."""
    session = db.query(DeviceSession).filter(
        DeviceSession.id == session_id,
        DeviceSession.account_number == account,
    ).first()

    if not session:
        raise HTTPException(404, "Session not found")

    data = session.to_dict(include_dataset=include_dataset)

    # Attach recent appliance events
    events = db.query(DeviceApplianceEvent).filter(
        DeviceApplianceEvent.session_id == session_id
    ).order_by(DeviceApplianceEvent.event_time).all()
    data["appliance_events"] = [e.to_dict() for e in events]

    return data


@router.get("/sessions/{account}")
def list_sessions(
    account:        str,
    limit:          int = Query(20, le=100),
    offset:         int = Query(0),
    appliance_name: Optional[str] = None,
    db:             Session = Depends(get_db),
):
    """List test sessions for an account, newest first."""
    q = db.query(DeviceSession).filter(DeviceSession.account_number == account)
    if appliance_name:
        q = q.filter(DeviceSession.appliance_name.ilike(f"%{appliance_name}%"))
    total    = q.count()
    sessions = q.order_by(DeviceSession.started_at.desc()).offset(offset).limit(limit).all()

    return {
        "total":    total,
        "sessions": [s.to_dict() for s in sessions],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Raw readings (for charts / export)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/sessions/{account}/{session_id}/readings")
def get_readings(
    account:    str,
    session_id: int,
    limit:      int = Query(500, le=2000),
    offset:     int = Query(0),
    db:         Session = Depends(get_db),
):
    """Paginated raw readings for charts."""
    session = db.query(DeviceSession).filter(
        DeviceSession.id == session_id,
        DeviceSession.account_number == account,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")

    total    = db.query(DeviceReading).filter(DeviceReading.session_id == session_id).count()
    readings = (
        db.query(DeviceReading)
        .filter(DeviceReading.session_id == session_id)
        .order_by(DeviceReading.recorded_at)
        .offset(offset).limit(limit).all()
    )
    return {
        "session_id": session_id,
        "total":      total,
        "readings":   [r.to_dict() for r in readings],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Dataset export (JSON or CSV)
# ─────────────────────────────────────────────────────────────────────────────

CSV_FIELDS = [
    "recorded_at", "voltage", "current_a", "power_w", "energy_kwh",
    "frequency_hz", "power_factor", "apparent_power_va", "reactive_power_var",
    "resistance_ohm", "voltage_dev_pct", "power_quality_score", "efficiency_class",
    "session_kwh", "session_cost_rs", "session_minutes",
    "avg_power_w", "peak_power_w", "avg_power_factor",
    "detected_appliance", "anomaly",
    "temperature_c", "humidity_pct", "heat_index_c",
    "wifi_rssi", "read_count",
]


@router.get("/sessions/{account}/{session_id}/export")
def export_dataset(
    account:    str,
    session_id: int,
    format:     str = Query("json", regex="^(json|csv)$"),
    db:         Session = Depends(get_db),
):
    """
    Download the full reading dataset for a completed session.
    format=json  → JSON array
    format=csv   → CSV file (ML-ready)
    """
    session = db.query(DeviceSession).filter(
        DeviceSession.id == session_id,
        DeviceSession.account_number == account,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")

    readings = (
        db.query(DeviceReading)
        .filter(DeviceReading.session_id == session_id)
        .order_by(DeviceReading.recorded_at)
        .all()
    )
    rows = [r.to_dict() for r in readings]

    filename_base = f"energyiq_{session.appliance_name or 'session'}_{session_id}".replace(" ", "_").lower()

    if format == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["session_id", "appliance_name"] + CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            row["session_id"]     = session_id
            row["appliance_name"] = session.appliance_name
            writer.writerow(row)
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename_base}.csv"'},
        )

    # JSON
    payload = {
        "session_id":     session_id,
        "appliance_name": session.appliance_name,
        "appliance_brand": session.appliance_brand,
        "started_at":     session.started_at.isoformat() if session.started_at else None,
        "ended_at":       session.ended_at.isoformat()   if session.ended_at   else None,
        "count":          len(rows),
        "readings":       rows,
    }
    return StreamingResponse(
        io.BytesIO(json.dumps(payload, indent=2).encode()),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename_base}.json"'},
    )


# ─────────────────────────────────────────────────────────────────────────────
# Device state (in-memory)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/latest/{device_id}")
def get_latest(device_id: str):
    data = iot_service.get_latest(device_id)
    if not data:
        raise HTTPException(404, "No data for this device")
    return data


@router.get("/history/{device_id}")
def get_history(device_id: str, minutes: int = Query(5, ge=1, le=10)):
    return {"device_id": device_id, "readings": iot_service.get_history(device_id, minutes)}


@router.get("/status/{device_id}")
def get_status(device_id: str):
    from src.services.iot_service import last_seen
    last = last_seen.get(device_id)
    if not last:
        return {"device_id": device_id, "online": False}
    elapsed = (datetime.now(timezone.utc) - last).total_seconds()
    return {
        "device_id":     device_id,
        "online":        elapsed < 30,
        "last_seen":     last.isoformat(),
        "last_seen_ago": f"{int(elapsed)}s ago",
        "active_session": iot_service.get_active_session(device_id),
    }


@router.get("/devices")
def get_devices():
    from src.services.iot_service import last_seen, latest_readings
    now = datetime.now(timezone.utc)
    devices = []
    for device_id, last in last_seen.items():
        elapsed = (now - last).total_seconds()
        latest  = latest_readings.get(device_id, {})
        devices.append({
            "device_id":      device_id,
            "online":         elapsed < 30,
            "last_seen":      last.isoformat(),
            "last_seen_ago":  f"{int(elapsed)}s ago",
            "active_session": iot_service.get_active_session(device_id),
            "power_w":        latest.get("power_w") or latest.get("power"),
            "voltage":        latest.get("voltage"),
        })
    devices.sort(key=lambda d: d["online"], reverse=True)
    return {"devices": devices, "count": len(devices)}


# ─────────────────────────────────────────────────────────────────────────────
# WebSocket — live data
# ─────────────────────────────────────────────────────────────────────────────

@router.websocket("/ws/{account}")
async def websocket_endpoint(websocket: WebSocket, account: str, device_id: Optional[str] = None):
    await websocket.accept()
    iot_service.register_websocket(account, websocket, device_id)

    try:
        # Send initial snapshot
        latest   = iot_service.get_latest(device_id) if device_id else None
        history  = iot_service.get_history(device_id) if device_id else []
        events   = iot_service.get_appliance_events(device_id) if device_id else []
        sess_id  = iot_service.get_active_session(device_id) if device_id else None

        await websocket.send_json({
            "type": "snapshot",
            "data": {
                "latest":         latest,
                "history":        history,
                "events":         events,
                "active_session": sess_id,
            },
        })

        # Keep alive — backend pushes via broadcast; just wait for disconnect
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error account={account}: {e}")
    finally:
        iot_service.unregister_websocket(account, websocket)


# ─────────────────────────────────────────────────────────────────────────────
# Simulation — inject fake readings (for testing without hardware)
# ─────────────────────────────────────────────────────────────────────────────

SCENARIOS = {
    "idle":            {"power": 3,    "voltage": 230, "current": 0.015, "pf": 0.65, "freq": 50.0, "temp": 28,  "hum": 70},
    "fan":             {"power": 72,   "voltage": 232, "current": 0.35,  "pf": 0.88, "freq": 50.0, "temp": 29,  "hum": 68},
    "led_bulb":        {"power": 9,    "voltage": 229, "current": 0.08,  "pf": 0.50, "freq": 50.0, "temp": 28,  "hum": 69},
    "rice_cooker":     {"power": 876,  "voltage": 228, "current": 3.9,   "pf": 0.99, "freq": 50.0, "temp": 30,  "hum": 65},
    "refrigerator":    {"power": 145,  "voltage": 231, "current": 0.68,  "pf": 0.92, "freq": 50.0, "temp": 27,  "hum": 72},
    "ac":              {"power": 1380, "voltage": 226, "current": 6.3,   "pf": 0.96, "freq": 49.9, "temp": 32,  "hum": 75},
    "tv":              {"power": 82,   "voltage": 230, "current": 0.40,  "pf": 0.89, "freq": 50.0, "temp": 28,  "hum": 69},
    "laptop":          {"power": 48,   "voltage": 231, "current": 0.23,  "pf": 0.91, "freq": 50.0, "temp": 29,  "hum": 67},
    "washing_machine": {"power": 495,  "voltage": 227, "current": 2.4,   "pf": 0.90, "freq": 50.1, "temp": 28,  "hum": 71},
    "water_heater":    {"power": 2000, "voltage": 229, "current": 8.7,   "pf": 1.00, "freq": 50.0, "temp": 29,  "hum": 66},
    "spike":           {"power": 1950, "voltage": 218, "current": 9.1,   "pf": 0.74, "freq": 49.5, "temp": 31,  "hum": 74},
}

_sim_counters: dict = {}


@router.post("/simulate/{device_id}")
def simulate_reading(
    device_id: str,
    scenario:  str = Query("fan", description=f"One of: {', '.join(SCENARIOS)}"),
):
    """Inject a simulated reading into the IoT service (no hardware needed)."""
    if scenario not in SCENARIOS:
        raise HTTPException(400, f"Unknown scenario. Choose from: {', '.join(SCENARIOS)}")

    base = SCENARIOS[scenario]
    _sim_counters[device_id] = _sim_counters.get(device_id, 0) + 1
    n = _sim_counters[device_id]

    # Add realistic noise
    def jitter(v, pct=0.02):
        return round(v * (1 + random.uniform(-pct, pct)), 4)

    reading = {
        "voltage":             jitter(base["voltage"],  0.01),
        "current":             jitter(base["current"],  0.03),
        "power":               jitter(base["power"],    0.03),
        "power_w":             jitter(base["power"],    0.03),
        "energy":              round(base["power"] / 1000 * n * (5 / 3600), 4),
        "frequency":           jitter(base["freq"],     0.002),
        "frequency_hz":        jitter(base["freq"],     0.002),
        "power_factor":        round(min(1.0, jitter(base["pf"], 0.02)), 3),
        "apparent_power":      round(jitter(base["voltage"]) * jitter(base["current"]), 2),
        "reactive_power":      round(abs(base["power"] * (1 - base["pf"])), 2),
        "session_kwh":         round(base["power"] / 1000 * n * (5 / 3600), 4),
        "session_cost_rs":     round(base["power"] / 1000 * n * (5 / 3600) * 15, 4),
        "session_minutes":     round(n * 5 / 60, 2),
        "avg_power_w":         jitter(base["power"],    0.01),
        "peak_power_w":        jitter(base["power"] * 1.05, 0.01),
        "avg_power_factor":    round(min(1.0, jitter(base["pf"], 0.01)), 3),
        "power_quality_score": round(min(100, 70 + base["pf"] * 30 + random.uniform(-3, 3)), 1),
        "voltage_deviation":   round(jitter(base["voltage"]) - 230, 2),
        "voltage_dev_pct":     round((jitter(base["voltage"]) - 230) / 230 * 100, 2),
        "resistance_ohm":      round(jitter(base["voltage"]) / max(jitter(base["current"]), 0.001), 1),
        "temperature_c":       jitter(base["temp"],     0.02),
        "humidity_pct":        jitter(base["hum"],      0.02),
        "heat_index_c":        jitter(base["temp"] + 2, 0.02),
        "wifi_rssi":           random.randint(-75, -50),
        "read_count":          n,
        "uptime_ms":           n * 5000,
        "detected_appliance":  scenario.replace("_", " ").title(),
        "anomaly":             "POWER_SPIKE:1950W" if scenario == "spike" else "",
    }

    iot_service.inject_simulated_reading(device_id, reading)
    return {"injected": True, "device_id": device_id, "scenario": scenario, "reading_number": n}