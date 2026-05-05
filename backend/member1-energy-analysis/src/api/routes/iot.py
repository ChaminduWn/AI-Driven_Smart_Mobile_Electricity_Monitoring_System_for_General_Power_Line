"""
src/api/routes/iot.py  
========================================
 applied:
   end_session returns data (not 400) if already completed — supports frontend polling
   websocket sends snapshot with live data immediately on connect
   account_number correctly passed through session creation
"""
import csv, io, json, logging, random
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.device_session import DeviceApplianceEvent, DeviceReading, DeviceSession
from src.services.iot_service import iot_service
from src.api.dependencies import get_current_user
from src.api.routes.relay import _publish_relay_command  # to reset hardware on session start

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/iot", tags=["IoT"])


class StartSessionRequest(BaseModel):
    device_id:             str
    appliance_name:        str
    appliance_brand:       Optional[str] = None
    appliance_description: Optional[str] = None
    test_duration_min:     Optional[int] = 15
    account_number:        Optional[str] = None   # allow frontend to pass it explicitly


def _get_account(user, explicit_account: str = None) -> str:
    """Extract account number — prefer explicit, then user profile attributes."""
    if explicit_account:
        return explicit_account
    
    # Check User object directly (for legacy compatibility)
    for attr in ("selected_account", "account_number", "default_account_number"):
        val = getattr(user, attr, None)
        if val:
            return str(val)
            
    # Check User Profile - THIS IS THE PRIMARY SOURCE
    if hasattr(user, "profile") and user.profile:
        if user.profile.default_account_number:
            return str(user.profile.default_account_number)
            
    # Check if user has any bills with account numbers
    if hasattr(user, "bills") and user.bills:
        for bill in user.bills:
            if bill.account_number:
                return str(bill.account_number)
            
    # Fallback to user ID to prevent NULLs in DB
    return f"U{user.id}"


@router.post("/sessions")
def start_session(req: StartSessionRequest, db: Session = Depends(get_db),
                  user=Depends(get_current_user)):
    account = _get_account(user, req.account_number)

    # Abandon any existing active session for this device/user
    old = db.query(DeviceSession).filter(
        DeviceSession.device_id == req.device_id,
        DeviceSession.user_id   == user.id,
        DeviceSession.status    == "active",
    ).first()
    if old:
        old.status   = "abandoned"
        old.ended_at = datetime.now(timezone.utc)
        db.commit()

    session = DeviceSession(
        user_id               = user.id,
        account_number        = account,
        device_id             = req.device_id,
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

    iot_service.set_active_session(req.device_id, session.id, user.id)

    # SYNC: Inform hardware to reset its internal session counters (kWh, cost, local read count)
    # This ensures "Session kWh" and "Est. Cost" start from zero in the app.
    _publish_relay_command(req.device_id, {"cmd": "reset_energy"})

    return {
        "session_id":     session.id,
        "device_id":      req.device_id,
        "appliance_name": req.appliance_name,
        "account_number": account,
        "status":         "active",
        "started_at":     session.started_at.isoformat(),
    }


@router.post("/sessions/{session_id}/end")
async def end_session(session_id: int, db: Session = Depends(get_db),
                      user=Depends(get_current_user)):
    session = db.query(DeviceSession).filter(
        DeviceSession.id      == session_id,
        DeviceSession.user_id == user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")

    # If already completed, return the data (supports frontend polling)
    if session.status == "completed":
        return session.to_dict()

    if session.status == "abandoned":
        raise HTTPException(400, "Session was abandoned")

    await iot_service._end_session(session.device_id, reason="manual")

    # Re-fetch after async end (may take a moment for AI analysis)
    db.expire(session)
    db.refresh(session)
    return session.to_dict()


@router.get("/sessions/{session_id}")
def get_session(session_id: int, include_dataset: bool = Query(False),
                db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Relaxed filtering: allow if user_id matches OR if account matches
    account = _get_account(user)
    session = db.query(DeviceSession).filter(
        DeviceSession.id == session_id
    ).filter(
        (DeviceSession.user_id == user.id) | (DeviceSession.account_number == account)
    ).first()
    if not session:
        raise HTTPException(404, "Session not found or access denied")
    data   = session.to_dict(include_dataset=include_dataset)
    events = db.query(DeviceApplianceEvent).filter(
        DeviceApplianceEvent.session_id == session_id
    ).order_by(DeviceApplianceEvent.event_time).all()
    data["appliance_events"] = [e.to_dict() for e in events]
    return data


@router.get("/sessions")
def list_sessions(limit: int = Query(20, le=100), offset: int = Query(0),
                  appliance_name: Optional[str] = None,
                  db: Session = Depends(get_db), user=Depends(get_current_user)):
    account = _get_account(user)
    # Return sessions for the user OR for the user's primary account
    q = db.query(DeviceSession).filter(
        (DeviceSession.user_id == user.id) | (DeviceSession.account_number == account)
    )
    if appliance_name:
        q = q.filter(DeviceSession.appliance_name.ilike(f"%{appliance_name}%"))
    total    = q.count()
    sessions = q.order_by(DeviceSession.started_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "sessions": [s.to_dict() for s in sessions]}


@router.get("/sessions/{session_id}/readings")
def get_readings(session_id: int, limit: int = Query(500, le=2000), offset: int = Query(0),
                 db: Session = Depends(get_db), user=Depends(get_current_user)):
    session = db.query(DeviceSession).filter(
        DeviceSession.id == session_id, DeviceSession.user_id == user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    total = db.query(DeviceReading).filter(DeviceReading.session_id == session_id).count()
    readings = (
        db.query(DeviceReading)
        .filter(DeviceReading.session_id == session_id)
        .order_by(DeviceReading.recorded_at)
        .offset(offset).limit(limit).all()
    )
    return {"session_id": session_id, "total": total, "readings": [r.to_dict() for r in readings]}


CSV_FIELDS = [
    "recorded_at", "voltage", "current_a", "power_w", "energy_kwh", "frequency_hz",
    "power_factor", "apparent_power_va", "reactive_power_var", "resistance_ohm",
    "voltage_dev_pct", "power_quality_score", "efficiency_class", "session_kwh",
    "session_cost_rs", "session_minutes", "avg_power_w", "peak_power_w",
    "avg_power_factor", "detected_appliance", "anomaly",
    "temperature_c", "humidity_pct", "heat_index_c", "wifi_rssi", "read_count",
]


@router.get("/sessions/{session_id}/export")
def export_dataset(session_id: int, format: str = Query("json", regex="^(json|csv)$"),
                   db: Session = Depends(get_db), user=Depends(get_current_user)):
    session = db.query(DeviceSession).filter(
        DeviceSession.id == session_id, DeviceSession.user_id == user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    readings = (
        db.query(DeviceReading)
        .filter(DeviceReading.session_id == session_id)
        .order_by(DeviceReading.recorded_at).all()
    )
    rows = [r.to_dict() for r in readings]
    base = f"energyiq_{(session.appliance_name or 'session').replace(' ', '_').lower()}_{session_id}"

    if format == "csv":
        out    = io.StringIO()
        writer = csv.DictWriter(
            out, fieldnames=["session_id", "appliance_name"] + CSV_FIELDS,
            extrasaction="ignore"
        )
        writer.writeheader()
        for row in rows:
            row["session_id"]      = session_id
            row["appliance_name"]  = session.appliance_name
            writer.writerow(row)
        out.seek(0)
        return StreamingResponse(
            io.BytesIO(out.getvalue().encode()), media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{base}.csv"'}
        )

    payload = {
        "session_id":     session_id,
        "appliance_name": session.appliance_name,
        "count":          len(rows),
        "readings":       rows,
    }
    return StreamingResponse(
        io.BytesIO(json.dumps(payload, indent=2).encode()),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{base}.json"'}
    )


@router.post("/test-telegram")
async def test_telegram(user=Depends(get_current_user)):
    """Manual trigger to verify Telegram bot configuration."""
    from src.services.alert_engine import alert_engine
    import asyncio
    
    logger.info(f"Manual Telegram test triggered by user {user.id}")
    # Run in background to avoid blocking the API response
    ok = alert_engine.send_test_alert()
    
    return {
        "success": ok, 
        "message": "Test alert sent! Check your Telegram bot." if ok else "Telegram token not set or API error. Check server logs."
    }


@router.get("/latest/{device_id}")
def get_latest(device_id: str, user=Depends(get_current_user)):
    data = iot_service.get_latest(device_id)
    if not data:
        raise HTTPException(404, "No data available for this device")
    return data


@router.get("/history/{device_id}")
def get_history(device_id: str, minutes: int = Query(5, ge=1, le=10),
                user=Depends(get_current_user)):
    return {"device_id": device_id, "readings": iot_service.get_history(device_id, minutes)}


@router.get("/status/{device_id}")
def get_status(device_id: str, user=Depends(get_current_user)):
    from src.services.iot_service import last_seen
    last = last_seen.get(device_id)
    if not last:
        return {"device_id": device_id, "online": False}
    elapsed = (datetime.now(timezone.utc) - last).total_seconds()
    return {
        "device_id":      device_id,
        "online":         elapsed < 30,
        "last_seen":      last.isoformat(),
        "last_seen_ago":  f"{int(elapsed)}s ago",
        "active_session": iot_service.get_active_session(device_id),
    }


@router.get("/devices")
def get_devices(user=Depends(get_current_user)):
    from src.services.iot_service import last_seen, latest_readings
    now     = datetime.now(timezone.utc)
    devices = []
    for device_id, last in last_seen.items():
        elapsed = (now - last).total_seconds()
        latest  = latest_readings.get(device_id, {})
        devices.append({
            "device_id":      device_id,
            "online":         elapsed < 30,
            "last_seen_ago":  f"{int(elapsed)}s ago",
            "active_session": iot_service.get_active_session(device_id),
            "power_w":        latest.get("power_w") or latest.get("power"),
            "voltage":        latest.get("voltage"),
        })
    return {
        "devices": sorted(devices, key=lambda d: d["online"], reverse=True),
        "count":   len(devices),
    }


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    device_id: Optional[str] = None,
    token:     Optional[str] = None,
    account:   Optional[str] = None,
):
    await websocket.accept()

    user_id = None
    if token:
        try:
            from src.core.security import decode_access_token
            payload = decode_access_token(token)
            user_id = int(payload.get("sub"))
        except Exception:
            await websocket.close(code=4001, reason="Invalid token")
            return
    else:
        await websocket.close(code=4001, reason="Missing token")
        return

    iot_service.register_websocket(user_id, websocket, device_id)

    try:
        # Send snapshot immediately so frontend shows live data on connect
        latest  = iot_service.get_latest(device_id) if device_id else None
        history = iot_service.get_history(device_id) if device_id else []
        events  = iot_service.get_appliance_events(device_id) if device_id else []
        active  = iot_service.get_active_session(device_id) if device_id else None

        await websocket.send_json({
            "type": "snapshot",
            "data": {
                "latest":         latest,
                "history":        history,
                "events":         events,
                "active_session": active,
            },
        })

        # Keep connection alive
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WS error user={user_id}: {e}")
    finally:
        iot_service.unregister_websocket(user_id, websocket)


# ── Simulation endpoint ───────────────────────────────────────────────────────
SCENARIOS = {
    "idle":        {"power": 3,    "voltage": 230, "current": 0.015, "pf": 0.65, "freq": 50.0, "temp": 28, "hum": 70},
    "fan":         {"power": 72,   "voltage": 232, "current": 0.35,  "pf": 0.88, "freq": 50.0, "temp": 29, "hum": 68},
    "led_bulb":    {"power": 9,    "voltage": 229, "current": 0.08,  "pf": 0.50, "freq": 50.0, "temp": 28, "hum": 69},
    "rice_cooker": {"power": 876,  "voltage": 228, "current": 3.9,   "pf": 0.99, "freq": 50.0, "temp": 30, "hum": 65},
    "ac":          {"power": 1380, "voltage": 226, "current": 6.3,   "pf": 0.96, "freq": 49.9, "temp": 32, "hum": 75},
    "spike":       {"power": 1950, "voltage": 218, "current": 9.1,   "pf": 0.74, "freq": 49.5, "temp": 31, "hum": 74},
}
_sim_counters: dict = {}


@router.post("/simulate/{device_id}")
def simulate_reading(device_id: str, scenario: str = Query("fan"),
                     user=Depends(get_current_user)):
    if scenario not in SCENARIOS:
        raise HTTPException(400, f"Choose from: {', '.join(SCENARIOS)}")
    b  = SCENARIOS[scenario]
    _sim_counters[device_id] = n = _sim_counters.get(device_id, 0) + 1

    def j(v, p=0.02): return round(v * (1 + random.uniform(-p, p)), 4)

    reading = {
        "voltage":             j(b["voltage"], 0.01),
        "current":             j(b["current"], 0.03),
        "power":               j(b["power"], 0.03),
        "power_w":             j(b["power"], 0.03),
        "frequency":           j(b["freq"], 0.002),
        "power_factor":        round(min(1.0, j(b["pf"], 0.02)), 3),
        "apparent_power":      round(j(b["voltage"]) * j(b["current"]), 2),
        "session_kwh":         round(b["power"] / 1000 * n * (5 / 3600), 4),
        "session_cost_rs":     round(b["power"] / 1000 * n * (5 / 3600) * 15, 4),
        "session_minutes":     round(n * 5 / 60, 2),
        "avg_power_w":         j(b["power"], 0.01),
        "peak_power_w":        j(b["power"] * 1.05, 0.01),
        "power_quality_score": round(min(100, 70 + b["pf"] * 30 + random.uniform(-3, 3)), 1),
        "temperature_c":       j(b["temp"], 0.02),
        "humidity_pct":        j(b["hum"], 0.02),
        "heat_index_c":        j(b["temp"] + 5, 0.02),
        "wifi_rssi":           random.randint(-75, -50),
        "read_count":          n,
        "uptime_ms":           n * 5000,
        "detected_appliance":  scenario.replace("_", " ").title(),
    }
    iot_service.inject_simulated_reading(device_id, reading)
    return {"injected": True, "device_id": device_id, "scenario": scenario, "n": n}