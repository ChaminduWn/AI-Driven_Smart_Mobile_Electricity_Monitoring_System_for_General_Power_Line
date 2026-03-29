"""
src/api/routes/relay.py
Relay Control API — sends MQTT commands to ESP32 relay module
and reads relay state from live readings / device sessions.

FIXED:
  ✅ Uses get_current_user from dependencies (same as iot.py) — no more 401 mismatch
  ✅ Better MQTT error logging — logs clearly when broker is disconnected
  ✅ /status endpoint also checks iot_service active session
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
import logging, json

from src.database import get_db
from src.models.user import User
from src.models.device_session import DeviceSession
from src.models.iot_reading import LiveMeterReading
from src.api.dependencies import get_current_user          # ← FIXED: was get_user_from_token from auth
from src.services.iot_service import iot_service, _normalize_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/relay", tags=["Relay Control"])


# ── Request models ────────────────────────────────────────────────────────────

class RelayCommandRequest(BaseModel):
    device_id: str = Field(..., description="Target ESP32 device MAC-based ID")
    command: str = Field(..., description="relay_on | relay_off | reset_safety | reset_energy")
    max_w: Optional[float] = Field(None, description="Custom max watts (for set_limits)")
    max_a: Optional[float] = Field(None, description="Custom max amps (for set_limits)")


class RelayLimitsRequest(BaseModel):
    device_id: str
    max_w: float = Field(..., gt=0, le=2500, description="Max watts (hardware ceiling 2300W)")
    max_a: float = Field(..., gt=0, le=10,   description="Max amps (hardware ceiling 9A)")


# ── MQTT publisher helper ─────────────────────────────────────────────────────

def _publish_relay_command(device_id: str, payload: dict) -> bool:
    """Publish a command to the ESP32 via MQTT through iot_service."""
    device_id = _normalize_id(device_id)
    if not iot_service.mqtt_client:
        logger.error(f"MQTT client is None — Device: {device_id}")
        return False

    if not iot_service.mqtt_client.is_connected():
        logger.error(f"MQTT client NOT connected — cmd dropped. Device: {device_id}")
        return False

    topic = f"energyiq/device/{device_id}/cmd"
    try:
        msg_info = iot_service.mqtt_client.publish(topic, json.dumps(payload), qos=1)
        # qos=1 ensures at least once delivery attempt
        
        if msg_info.rc == 0:
            logger.info(f"Relay cmd SUCCESS → {topic}: {payload}")
            return True
        else:
            logger.error(f"MQTT publish FAILED (rc={msg_info.rc}) for {device_id}")
            return False
    except Exception as e:
        logger.error(f"MQTT publish EXCEPTION for {device_id}: {e}")
        return False


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/command")
def send_relay_command(
    req: RelayCommandRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),    # ← FIXED: consistent with iot.py
):
    """
    Send a relay command to the ESP32 device via MQTT.

    Commands:
    - relay_on       — close relay (power appliance)
    - relay_off      — open relay  (cut power)
    - reset_safety   — clear safety latch after trip
    - reset_energy   — zero session energy counter
    - safety_enable  — re-enable safety monitoring
    - safety_disable — disable safety monitoring (use with caution)
    """
    VALID = {"relay_on", "relay_off", "reset_safety", "reset_energy",
             "safety_enable", "safety_disable"}
    if req.command not in VALID:
        raise HTTPException(400, f"Unknown command. Valid: {sorted(VALID)}")

    payload = {"cmd": req.command}
    ok = _publish_relay_command(req.device_id, payload)

    return {
        "success": ok,
        "device_id": req.device_id,
        "command": req.command,
        "message": "Command sent via MQTT" if ok else "MQTT unavailable — check broker connection. See server logs.",
    }


@router.post("/set-limits")
def set_relay_limits(
    req: RelayLimitsRequest,
    current_user: User = Depends(get_current_user),    # ← FIXED
):
    """
    Adjust safety limits on the ESP32 (custom ceiling below hardware max).
    Hardware ceiling: 2300W / 9A — values above these are clamped by firmware.
    """
    payload = {"cmd": "set_limits", "max_w": req.max_w, "max_a": req.max_a}
    ok = _publish_relay_command(req.device_id, payload)
    return {
        "success": ok,
        "device_id": req.device_id,
        "limits": {"max_w": req.max_w, "max_a": req.max_a},
        "message": "Limits sent" if ok else "MQTT unavailable — check broker connection.",
    }


@router.get("/status/{device_id}")
def get_relay_status(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),    # ← FIXED
):
    """
    Get current relay state from the latest live reading stored in DB.
    Falls back to in-memory latest_readings cache if DB has no recent entry.
    """
    # 1. Try in-memory cache (most recent, sub-second latency)
    from src.services.iot_service import latest_readings
    live = latest_readings.get(device_id)
    if live:
        return {
            "success": True,
            "source": "live_cache",
            "device_id": device_id,
            "relay_on": live.get("relay_on", False),
            "safety_tripped": live.get("safety_tripped", False),
            "safety_reason": live.get("safety_reason", ""),
            "custom_max_w": live.get("custom_max_w", 2300),
            "custom_max_a": live.get("custom_max_a", 9.0),
            "safety_enabled": live.get("safety_enabled", True),
            "power_w": live.get("power_w") or live.get("power", 0),
            "mqtt_connected": iot_service.mqtt_client is not None and iot_service.mqtt_client.is_connected(),
        }

    # 2. Fall back to most recent DB reading
    reading = (
        db.query(LiveMeterReading)
        .filter(LiveMeterReading.account_number.isnot(None))
        .order_by(LiveMeterReading.recorded_at.desc())
        .first()
    )
    if reading and reading.raw_data:
        rd = reading.raw_data
        return {
            "success": True,
            "source": "database",
            "device_id": device_id,
            "relay_on": rd.get("relay_on", False),
            "safety_tripped": rd.get("safety_tripped", False),
            "safety_reason": rd.get("safety_reason", ""),
            "custom_max_w": rd.get("custom_max_w", 2300),
            "custom_max_a": rd.get("custom_max_a", 9.0),
            "safety_enabled": rd.get("safety_enabled", True),
            "power_w": rd.get("power_w") or rd.get("power", 0),
            "mqtt_connected": iot_service.mqtt_client is not None and iot_service.mqtt_client.is_connected(),
        }

    return {
        "success": False,
        "device_id": device_id,
        "message": "No live data yet — device may be offline",
        "relay_on": False,
        "safety_tripped": False,
        "mqtt_connected": iot_service.mqtt_client is not None and iot_service.mqtt_client.is_connected(),
    }


@router.get("/history/{device_id}")
def get_relay_history(
    device_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),    # ← FIXED
):
    """
    Return the last N relay state changes extracted from stored readings.
    Useful for audit trail and charting relay on/off events.
    """
    readings = (
        db.query(LiveMeterReading)
        .order_by(LiveMeterReading.recorded_at.desc())
        .limit(limit * 5)
        .all()
    )

    events = []
    prev_state = None
    for r in reversed(readings):
        if not r.raw_data:
            continue
        state = r.raw_data.get("relay_on")
        if state != prev_state:
            events.append({
                "recorded_at": r.recorded_at.isoformat(),
                "relay_on": state,
                "power_w": r.power,
                "safety_tripped": r.raw_data.get("safety_tripped", False),
                "safety_reason": r.raw_data.get("safety_reason", ""),
            })
            prev_state = state
        if len(events) >= limit:
            break

    return {
        "success": True,
        "device_id": device_id,
        "event_count": len(events),
        "events": list(reversed(events)),
    }


@router.get("/safety-log/{device_id}")
def get_safety_events(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),    # ← FIXED
):
    """Return readings where a safety trip was recorded."""
    readings = (
        db.query(LiveMeterReading)
        .order_by(LiveMeterReading.recorded_at.desc())
        .limit(500)
        .all()
    )
    trips = [
        {
            "recorded_at": r.recorded_at.isoformat(),
            "power_w": r.power,
            "voltage": r.voltage,
            "current_a": r.current,
            "reason": r.raw_data.get("safety_reason", "") if r.raw_data else "",
        }
        for r in readings
        if r.raw_data and r.raw_data.get("safety_tripped")
    ]
    return {"success": True, "device_id": device_id, "trips": trips}


@router.get("/mqtt-status")
def get_mqtt_status(
    current_user: User = Depends(get_current_user),
):
    """
    Debug endpoint — check if MQTT broker connection is alive.
    Call this from the app if relay commands return success=false.
    """
    client = iot_service.mqtt_client
    if client is None:
        return {
            "connected": False,
            "reason": "MQTT client is None — IoT service may not have started correctly",
        }
    try:
        connected = client.is_connected()
        return {
            "connected": connected,
            "reason": "OK" if connected else "Client exists but is disconnected from broker",
        }
    except Exception as e:
        return {
            "connected": False,
            "reason": str(e),
        }