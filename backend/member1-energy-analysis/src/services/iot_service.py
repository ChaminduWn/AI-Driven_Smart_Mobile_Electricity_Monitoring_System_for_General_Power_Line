"""
src/services/iot_service.py  — FIXED VERSION
=============================================
Fixes applied:
  ✅ _save_reading_to_db uses correct normalized field names
  ✅ account_number pulled from session (not null anymore)
  ✅ temperature_c / humidity_pct / heat_index_c saved correctly
  ✅ last_env_readings cache — fills null DHT reads from last good value
  ✅ _broadcast_to_device_watchers fixed (device_id matching)
  ✅ WebSocket snapshot sends live data immediately on connect
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional
from collections import deque

logger = logging.getLogger(__name__)

# ── In-memory stores ──────────────────────────────────────────────────────────
latest_readings:    Dict[str, dict]          = {}
reading_history:    Dict[str, deque]         = {}
active_connections: Dict[str, List]          = {}
appliance_events:   Dict[str, List[dict]]    = {}
active_sessions:    Dict[str, Optional[int]] = {}
last_seen:          Dict[str, datetime]      = {}
last_env_readings:  Dict[str, dict]          = {}   # cache last good DHT values per device


# ── Typical wattage reference database ───────────────────────────────────────
TYPICAL_WATTAGE_DB = {
    "led bulb":           {"min": 5,    "max": 15,   "typical": 9,    "category": "Lighting"},
    "tube light":         {"min": 15,   "max": 40,   "typical": 20,   "category": "Lighting"},
    "incandescent bulb":  {"min": 40,   "max": 100,  "typical": 60,   "category": "Lighting"},
    "cfl bulb":           {"min": 10,   "max": 25,   "typical": 15,   "category": "Lighting"},
    "ceiling fan":        {"min": 50,   "max": 100,  "typical": 75,   "category": "Cooling"},
    "table fan":          {"min": 30,   "max": 60,   "typical": 45,   "category": "Cooling"},
    "air conditioner":    {"min": 800,  "max": 2500, "typical": 1500, "category": "Cooling"},
    "ac":                 {"min": 800,  "max": 2500, "typical": 1500, "category": "Cooling"},
    "refrigerator":       {"min": 100,  "max": 300,  "typical": 150,  "category": "Cooling"},
    "television":         {"min": 40,   "max": 200,  "typical": 80,   "category": "Entertainment"},
    "tv":                 {"min": 40,   "max": 200,  "typical": 80,   "category": "Entertainment"},
    "laptop":             {"min": 30,   "max": 90,   "typical": 50,   "category": "Entertainment"},
    "desktop computer":   {"min": 150,  "max": 400,  "typical": 200,  "category": "Entertainment"},
    "gaming console":     {"min": 100,  "max": 200,  "typical": 150,  "category": "Entertainment"},
    "rice cooker":        {"min": 400,  "max": 1000, "typical": 700,  "category": "Cooking"},
    "microwave":          {"min": 600,  "max": 1500, "typical": 1200, "category": "Cooking"},
    "electric kettle":    {"min": 1000, "max": 2000, "typical": 1500, "category": "Cooking"},
    "toaster":            {"min": 600,  "max": 1200, "typical": 800,  "category": "Cooking"},
    "air fryer":          {"min": 1000, "max": 2000, "typical": 1500, "category": "Cooking"},
    "induction cooktop":  {"min": 1000, "max": 3500, "typical": 2000, "category": "Cooking"},
    "electric oven":      {"min": 1000, "max": 3000, "typical": 2000, "category": "Cooking"},
    "iron":               {"min": 800,  "max": 2000, "typical": 1000, "category": "Heating"},
    "hair dryer":         {"min": 800,  "max": 2000, "typical": 1500, "category": "Heating"},
    "water heater":       {"min": 1500, "max": 3500, "typical": 2000, "category": "Heating"},
    "geyser":             {"min": 1500, "max": 3500, "typical": 2000, "category": "Heating"},
    "washing machine":    {"min": 300,  "max": 1000, "typical": 500,  "category": "Cleaning"},
    "vacuum cleaner":     {"min": 800,  "max": 2000, "typical": 1200, "category": "Cleaning"},
    "phone charger":      {"min": 3,    "max": 20,   "typical": 5,    "category": "Other"},
    "wifi router":        {"min": 5,    "max": 20,   "typical": 10,   "category": "Other"},
    "water pump":         {"min": 200,  "max": 1000, "typical": 500,  "category": "Other"},
}


def find_typical_wattage(appliance_name: str) -> Optional[dict]:
    name_lower = appliance_name.lower().strip()
    if name_lower in TYPICAL_WATTAGE_DB:
        return TYPICAL_WATTAGE_DB[name_lower]
    for key, data in TYPICAL_WATTAGE_DB.items():
        if key in name_lower or name_lower in key:
            return data
    name_words = set(name_lower.split())
    for key, data in TYPICAL_WATTAGE_DB.items():
        key_words = set(key.split())
        if name_words & key_words:
            return data
    return None


def assess_appliance_health(
    appliance_name: str,
    avg_power: float,
    avg_pf: float,
    pq_score: float,
    readings_count: int
) -> dict:
    typical = find_typical_wattage(appliance_name)

    result = {
        "typical_found":   typical is not None,
        "typical_wattage": typical["typical"] if typical else None,
        "typical_range":   [typical["min"], typical["max"]] if typical else None,
        "measured_avg_power": round(avg_power, 1),
        "status":          "UNKNOWN",
        "deviation_pct":   None,
        "health_score":    0,
        "issues":          [],
        "verdict":         "Insufficient data",
        "service_recommended": False,
    }

    if readings_count < 5:
        result["verdict"] = "Need more readings for accurate assessment"
        return result

    if avg_pf < 0.6 and avg_power > 20:
        result["issues"].append({
            "type": "LOW_POWER_FACTOR", "severity": "HIGH",
            "message": f"Power factor {avg_pf:.2f} is very low — indicates reactive load or failing capacitors",
            "recommendation": "Check capacitors; consider power factor correction"
        })
    elif avg_pf < 0.8 and avg_power > 20:
        result["issues"].append({
            "type": "POOR_POWER_FACTOR", "severity": "MEDIUM",
            "message": f"Power factor {avg_pf:.2f} is below ideal (≥0.9)",
            "recommendation": "Appliance may be aging or have internal inefficiencies"
        })

    if pq_score < 70:
        result["issues"].append({
            "type": "LOW_POWER_QUALITY", "severity": "MEDIUM",
            "message": f"Power quality score {pq_score:.0f}/100 — voltage or frequency instability detected",
            "recommendation": "Check supply voltage stability; consider a voltage stabilizer"
        })

    if not typical:
        result["status"] = "NO_REFERENCE"
        result["verdict"] = (
            f"No reference data for '{appliance_name}'. "
            f"Measured: {avg_power:.0f}W, PF: {avg_pf:.2f}"
        )
        health = 70
        if avg_pf >= 0.85: health += 15
        elif avg_pf < 0.7:  health -= 20
        if pq_score >= 80:  health += 10
        result["health_score"] = max(0, min(100, health))
        return result

    typ_w      = typical["typical"]
    deviation  = ((avg_power - typ_w) / typ_w) * 100 if typ_w > 0 else 0
    result["deviation_pct"] = round(deviation, 1)
    in_range   = typical["min"] <= avg_power <= typical["max"]

    if avg_power < 1:
        result["status"]  = "OFF_OR_STANDBY"
        result["verdict"] = "Appliance appears to be in standby or off state"
        result["health_score"] = 50
    elif in_range:
        if deviation > 20:
            result["status"] = "SLIGHTLY_HIGH"
            result["issues"].append({
                "type": "OVER_CONSUMING", "severity": "LOW",
                "message": f"Using {deviation:.0f}% more than typical ({avg_power:.0f}W vs {typ_w}W typical)",
                "recommendation": "Consider energy-efficient model; check for internal blockages"
            })
        elif deviation < -20:
            result["status"] = "SLIGHTLY_LOW"
            result["issues"].append({
                "type": "UNDER_CONSUMING", "severity": "LOW",
                "message": f"Using {abs(deviation):.0f}% less than typical — may indicate partial failure",
                "recommendation": "Verify appliance is operating at full capacity"
            })
        else:
            result["status"] = "NORMAL"
    elif avg_power > typical["max"] * 1.3:
        result["status"] = "FAULT_SUSPECTED"
        result["issues"].append({
            "type": "CRITICAL_OVERCONSUMPTION", "severity": "HIGH",
            "message": f"Consuming {deviation:.0f}% above maximum spec ({avg_power:.0f}W vs max {typical['max']}W) — FAULT SUSPECTED",
            "recommendation": "Stop using immediately. Get professionally inspected."
        })
    elif avg_power < typical["min"] * 0.5:
        result["status"] = "UNDER_PERFORMING"
        result["issues"].append({
            "type": "SEVERE_UNDERCONSUMPTION", "severity": "HIGH",
            "message": f"Consuming {abs(deviation):.0f}% below minimum spec — severe under-performance",
            "recommendation": "Appliance may have failed components. Get serviced."
        })
    else:
        result["status"] = "OUT_OF_RANGE"
        result["issues"].append({
            "type": "OUT_OF_TYPICAL_RANGE", "severity": "MEDIUM",
            "message": f"Outside typical range ({typical['min']}W–{typical['max']}W), measured {avg_power:.0f}W",
            "recommendation": "Compare with appliance label specifications"
        })

    health = 100
    if not in_range:         health -= 30
    if abs(deviation) > 30:  health -= 20
    if avg_pf < 0.7:         health -= 25
    elif avg_pf < 0.85:      health -= 10
    if pq_score < 70:        health -= 15
    for issue in result["issues"]:
        if issue["severity"] == "HIGH":   health -= 20
        elif issue["severity"] == "MEDIUM": health -= 10
        else:                               health -= 5

    result["health_score"] = max(0, min(100, health))
    result["service_recommended"] = result["health_score"] < 60

    if result["health_score"] >= 85:
        result["verdict"] = "✅ Appliance appears healthy. Operating within normal parameters."
    elif result["health_score"] >= 65:
        result["verdict"] = "⚠️ Minor issues detected. Performance is acceptable but not optimal."
    elif result["health_score"] >= 40:
        result["verdict"] = "🔶 Significant issues found. Recommend inspection and servicing."
    else:
        result["verdict"] = "🔴 Critical issues detected. Immediate attention required."

    return result


class IoTService:

    def __init__(self):
        self.mqtt_client = None
        self.running     = False
        self.loop        = None
        self.broker_host = "broker.hivemq.com"
        self.broker_port = 1883
        self._db_factory = None

    def start(self, db_factory=None):
        self.running     = True
        self.loop        = asyncio.get_event_loop()
        self._db_factory = db_factory
        asyncio.create_task(self._mqtt_loop())
        asyncio.create_task(self._disconnect_watchdog())
        logger.info(f"IoT service started — broker: {self.broker_host}:{self.broker_port}")

    async def _mqtt_loop(self):
        try:
            import paho.mqtt.client as mqtt
            import time
            client_id = f"energyiq-backend-{int(time.time())}"
            client = mqtt.Client(client_id=client_id)
            client.on_connect    = self._on_connect
            client.on_message    = self._on_message
            client.on_disconnect = self._on_disconnect
            client.connect_async(self.broker_host, self.broker_port, keepalive=60)
            client.loop_start()
            self.mqtt_client = client
            logger.info(f"MQTT client [{client_id}] started")
            while self.running:
                await asyncio.sleep(1)
        except ImportError:
            logger.error("paho-mqtt not installed")
        except Exception as e:
            logger.error(f"MQTT loop error: {e}")

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            client.subscribe("energyiq/device/+/live")
            client.subscribe("energyiq/device/+/appliance")
            client.subscribe("energyiq/device/+/status")
            client.subscribe("energyiq/#")
            logger.info("Connected to HiveMQ — subscribed")
        else:
            logger.error(f"HiveMQ connect failed: rc={rc}")

    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"HiveMQ disconnected rc={rc}")

    def _on_message(self, client, userdata, msg):
        try:
            topic   = msg.topic
            payload = json.loads(msg.payload.decode())
            parts   = topic.split("/")
            if len(parts) == 4 and parts[0] == "energyiq" and parts[1] == "device":
                device_id = parts[2]
                msg_type  = parts[3]
                if msg_type == "live":
                    self._handle_live_reading_sync(device_id, payload)
                elif msg_type == "appliance":
                    self._handle_appliance_event_sync(device_id, payload)
                elif msg_type == "status":
                    self._handle_status_sync(device_id, payload)
        except json.JSONDecodeError:
            logger.warning("Invalid JSON from MQTT")
        except Exception as e:
            logger.error(f"MQTT message error: {e}")

    # ── Normalize field names ─────────────────────────────────────────────────
    def _normalize(self, data: dict) -> dict:
        def alias(src, dst):
            if src in data and dst not in data:
                data[dst] = data[src]
            elif dst in data and src not in data:
                data[src] = data[dst]

        alias("current",        "current_a")
        alias("power",          "power_w")
        alias("apparent_power", "apparent_power_va")
        alias("reactive_power", "reactive_power_var")
        alias("frequency",      "frequency_hz")
        alias("energy",         "energy_kwh")
        alias("avg_pf",         "avg_power_factor")
        alias("peak_power",     "peak_power_w")
        alias("avg_power",      "avg_power_w")

        # Temperature — Arduino sends "temperature_c" directly; also handle short names
        for src in ("temperature", "temp"):
            if src in data and "temperature_c" not in data:
                data["temperature_c"] = data[src]
        if "temperature_c" in data and "temperature" not in data:
            data["temperature"] = data["temperature_c"]

        # Humidity
        for src in ("humidity", "hum"):
            if src in data and "humidity_pct" not in data:
                data["humidity_pct"] = data[src]
        if "humidity_pct" in data and "humidity" not in data:
            data["humidity"] = data["humidity_pct"]

        # Heat index
        for src in ("heat_index", "heatIndex", "heat_idx"):
            if src in data and "heat_index_c" not in data:
                data["heat_index_c"] = data[src]

        # Session fields
        for src in ("session_energy", "sessionKwh", "session_energy_kwh"):
            if src in data and "session_kwh" not in data:
                data["session_kwh"] = data[src]
        for src in ("session_cost", "sessionCost", "cost_rs"):
            if src in data and "session_cost_rs" not in data:
                data["session_cost_rs"] = data[src]
        for src in ("session_time", "sessionTime", "session_min"):
            if src in data and "session_minutes" not in data:
                data["session_minutes"] = data[src]
        for src in ("pq_score", "pqScore", "quality_score"):
            if src in data and "power_quality_score" not in data:
                data["power_quality_score"] = data[src]
        for src in ("rssi", "RSSI"):
            if src in data and "wifi_rssi" not in data:
                data["wifi_rssi"] = data[src]

        return data

    # ── PZEM sanity filter ────────────────────────────────────────────────────
    def _is_valid_reading(self, data: dict) -> bool:
        voltage = data.get("voltage") or 0
        current = data.get("current_a") or data.get("current") or 0
        power   = data.get("power_w")  or data.get("power")   or 0
        pf      = data.get("power_factor") or 1
        freq    = data.get("frequency_hz") or data.get("frequency") or 50

        if not (0 <= voltage <= 300):
            logger.warning(f"PZEM sanity: voltage out of range ({voltage}V)")
            return False
        if not (0 <= current <= 100):
            logger.warning(f"PZEM sanity: current out of range ({current}A)")
            return False
        if not (0 <= power <= 23000):
            logger.warning(f"PZEM sanity: power out of range ({power}W)")
            return False
        if not (0 <= pf <= 1.05):
            logger.warning(f"PZEM sanity: power factor out of range ({pf})")
            return False
        if not (45 <= freq <= 65):
            logger.warning(f"PZEM sanity: frequency out of range ({freq}Hz)")
            return False
        return True

    # ── Handle live reading ───────────────────────────────────────────────────
    def _handle_live_reading_sync(self, device_id: str, data: dict):
        last_seen[device_id] = datetime.now(timezone.utc)
        data = self._normalize(data)

        if not self._is_valid_reading(data):
            return

        # ── FIX: Cache last good DHT22 values; fill nulls from cache ─────────
        env = last_env_readings.get(device_id, {})
        for field in ('temperature_c', 'humidity_pct', 'heat_index_c'):
            val = data.get(field)
            if val is not None:
                env[field] = val            # update cache with fresh value
            elif field in env:
                data[field] = env[field]    # fill from cache when Arduino sends null
        last_env_readings[device_id] = env
        # ─────────────────────────────────────────────────────────────────────

        data["server_time"] = datetime.now(timezone.utc).isoformat()
        data["device_id"]   = device_id
        data["anomalies"]   = self._detect_anomalies(device_id, data)

        latest_readings[device_id] = data
        if device_id not in reading_history:
            reading_history[device_id] = deque(maxlen=120)
        reading_history[device_id].append(data)

        self._schedule(self._save_reading_to_db(device_id, data))
        self._schedule(self._broadcast_to_device_watchers(device_id, {
            "type": "live_reading",
            "data": data,
        }))

    def _handle_appliance_event_sync(self, device_id: str, data: dict):
        if device_id not in appliance_events:
            appliance_events[device_id] = []
        event = {
            "from":  data.get("from", ""),
            "to":    data.get("to", ""),
            "watts": data.get("watts", 0),
            "time":  datetime.now(timezone.utc).isoformat(),
        }
        appliance_events[device_id].append(event)
        if len(appliance_events[device_id]) > 50:
            appliance_events[device_id] = appliance_events[device_id][-50:]
        self._schedule(self._save_event_to_db(device_id, data))
        self._schedule(self._broadcast_to_device_watchers(device_id, {
            "type": "appliance_event",
            "data": event,
        }))

    def _handle_status_sync(self, device_id: str, data: dict):
        last_seen[device_id] = datetime.now(timezone.utc)
        if device_id not in latest_readings:
            latest_readings[device_id] = {
                "device_id":   device_id,
                "status":      data.get("status"),
                "server_time": datetime.now(timezone.utc).isoformat(),
                "power": 0, "voltage": 0,
            }

    # ── Save reading to DB ────────────────────────────────────────────────────
    async def _save_reading_to_db(self, device_id: str, data: dict):
        if not self._db_factory:
            return
        session_id = active_sessions.get(device_id)
        if not session_id:
            return

        try:
            from src.models.device_session import DeviceReading, DeviceSession
            db = self._db_factory()

            # Pull account_number from the active session
            session = db.query(DeviceSession).filter(DeviceSession.id == session_id).first()
            account_number = session.account_number if session else None

            reading = DeviceReading(
                session_id          = session_id,
                device_id           = device_id,
                account_number      = account_number,           # ✅ FIX: from session
                voltage             = data.get("voltage", 0),
                current_a           = data.get("current_a") or data.get("current", 0),   # ✅ FIX
                power_w             = data.get("power_w")   or data.get("power",   0),   # ✅ FIX
                energy_kwh          = data.get("energy_kwh") or data.get("energy",  0),  # ✅ FIX
                frequency_hz        = data.get("frequency_hz") or data.get("frequency", 50),  # ✅ FIX
                power_factor        = data.get("power_factor", 1),
                apparent_power_va   = data.get("apparent_power_va") or data.get("apparent_power"),
                reactive_power_var  = data.get("reactive_power_var") or data.get("reactive_power"),
                resistance_ohm      = data.get("resistance_ohm"),
                voltage_deviation   = data.get("voltage_deviation"),
                voltage_dev_pct     = data.get("voltage_dev_pct"),
                power_quality_score = data.get("power_quality_score"),
                efficiency_class    = data.get("efficiency_class"),
                session_kwh         = data.get("session_kwh"),
                session_cost_rs     = data.get("session_cost_rs"),
                session_minutes     = data.get("session_minutes"),
                avg_power_w         = data.get("avg_power_w"),
                peak_power_w        = data.get("peak_power_w"),
                avg_power_factor    = data.get("avg_power_factor"),
                detected_appliance  = data.get("detected_appliance"),
                anomaly             = data.get("anomaly"),
                wifi_rssi           = data.get("wifi_rssi"),
                read_count          = data.get("read_count"),
                uptime_ms           = data.get("uptime_ms"),
                temperature_c       = data.get("temperature_c"),   # ✅ Arduino sends directly
                humidity_pct        = data.get("humidity_pct"),    # ✅ Arduino sends directly
                heat_index_c        = data.get("heat_index_c"),    # ✅ Arduino sends directly
            )
            db.add(reading)

            # Update session summary
            if session:
                n = (session.total_readings or 0) + 1
                session.total_readings = n

                pwr = data.get("power_w") or data.get("power") or 0
                if pwr and (not session.peak_power_w or pwr > session.peak_power_w):
                    session.peak_power_w = pwr
                if pwr:
                    prev_avg = session.avg_power_w or 0
                    session.avg_power_w = round(((prev_avg * (n - 1)) + pwr) / n, 2)

                v = data.get("voltage") or 0
                if v:
                    if not session.min_voltage_v or v < session.min_voltage_v:
                        session.min_voltage_v = v
                    if not session.max_voltage_v or v > session.max_voltage_v:
                        session.max_voltage_v = v

                pf = data.get("power_factor") or 0
                if pf:
                    prev_pf = session.avg_power_factor or 0
                    session.avg_power_factor = round(((prev_pf * (n - 1)) + pf) / n, 3)

                pq = data.get("power_quality_score") or 0
                if pq:
                    prev_pq = session.avg_pq_score or 0
                    session.avg_pq_score = round(((prev_pq * (n - 1)) + pq) / n, 1)

                if data.get("session_kwh"):
                    session.total_session_kwh = data["session_kwh"]
                if data.get("session_cost_rs"):
                    session.total_cost_rs = data["session_cost_rs"]

                # Running average for environmental data
                temp = data.get("temperature_c")
                hum  = data.get("humidity_pct")
                if temp is not None:
                    prev_temp = session.avg_temperature or temp
                    session.avg_temperature = round(((prev_temp * (n - 1)) + temp) / n, 2)
                if hum is not None:
                    prev_hum = session.avg_humidity or hum
                    session.avg_humidity = round(((prev_hum * (n - 1)) + hum) / n, 2)

            db.commit()
        except Exception as e:
            logger.error(f"DB save reading error: {e}")
            try:
                db.rollback()
            except:
                pass
        finally:
            try:
                db.close()
            except:
                pass

    # ── Save appliance event ──────────────────────────────────────────────────
    async def _save_event_to_db(self, device_id: str, data: dict):
        if not self._db_factory:
            return
        session_id = active_sessions.get(device_id)
        if not session_id:
            return
        try:
            from src.models.device_session import DeviceApplianceEvent
            db = self._db_factory()
            event = DeviceApplianceEvent(
                session_id     = session_id,
                device_id      = device_id,
                from_appliance = data.get("from", ""),
                to_appliance   = data.get("to", ""),
                watts          = data.get("watts", 0),
            )
            db.add(event)
            db.commit()
        except Exception as e:
            logger.error(f"DB save event error: {e}")
        finally:
            try:
                db.close()
            except:
                pass

    # ── Disconnect watchdog ───────────────────────────────────────────────────
    async def _disconnect_watchdog(self):
        while self.running:
            await asyncio.sleep(10)
            now = datetime.now(timezone.utc)
            for device_id, last_time in list(last_seen.items()):
                elapsed    = (now - last_time).total_seconds()
                session_id = active_sessions.get(device_id)

                if elapsed > 30 and session_id:
                    logger.info(f"Device {device_id} disconnected ({elapsed:.0f}s) — ending session")
                    await self._end_session(device_id, reason="disconnect")
                    continue

                if session_id and self._db_factory:
                    try:
                        from src.models.device_session import DeviceSession
                        db = self._db_factory()
                        session = db.query(DeviceSession).filter(
                            DeviceSession.id     == session_id,
                            DeviceSession.status == "active"
                        ).first()
                        if session and session.test_duration_min and session.started_at:
                            started = session.started_at
                            if started.tzinfo is None:
                                started = started.replace(tzinfo=timezone.utc)
                            elapsed_min = (now - started).total_seconds() / 60
                            if elapsed_min >= session.test_duration_min:
                                logger.info(f"Session {session_id} reached planned duration — auto-ending")
                                db.close()
                                await self._end_session(device_id, reason="duration_complete")
                                continue
                        db.close()
                    except Exception as e:
                        logger.error(f"Watchdog duration check error: {e}")

    async def _end_session(self, device_id: str, reason: str = "manual"):
        session_id = active_sessions.get(device_id)
        if not session_id:
            return
        active_sessions[device_id] = None

        if not self._db_factory:
            return

        try:
            from src.models.device_session import DeviceSession, DeviceReading
            db = self._db_factory()
            session = db.query(DeviceSession).filter(DeviceSession.id == session_id).first()
            if not session:
                return

            session.status   = "completed"
            session.ended_at = datetime.now(timezone.utc)

            if session.started_at and session.ended_at:
                started = session.started_at
                if started.tzinfo is None:
                    started = started.replace(tzinfo=timezone.utc)
                delta = (session.ended_at - started).total_seconds() / 60
                session.actual_duration_min = round(delta, 1)

            readings = db.query(DeviceReading).filter(
                DeviceReading.session_id == session_id
            ).order_by(DeviceReading.recorded_at).all()

            dataset = [r.to_dict() for r in readings]
            session.dataset_json  = json.dumps(dataset)
            session.dataset_count = len(dataset)

            avg_pwr  = session.avg_power_w or 0
            avg_pf   = session.avg_power_factor or 1.0
            pq_score = session.avg_pq_score or 80
            health   = assess_appliance_health(
                session.appliance_name, avg_pwr, avg_pf, pq_score,
                session.total_readings or 0
            )
            session.health_assessment = json.dumps(health)

            ai_result = await self._generate_ai_analysis(session, health, dataset)
            session.ai_summary         = ai_result.get("summary")
            session.ai_recommendations = json.dumps(ai_result.get("recommendations", []))
            session.comparison_note    = ai_result.get("comparison")
            session.fault_detected     = health["status"] in ["FAULT_SUSPECTED", "CRITICAL_OVERCONSUMPTION"]

            db.commit()
            db.refresh(session)

            await self._broadcast_to_device_watchers(device_id, {
                "type": "session_ended",
                "data": session.to_dict(),
            })
            logger.info(f"Session {session_id} completed — {len(dataset)} readings, reason={reason}")
        except Exception as e:
            logger.error(f"End session error: {e}")
        finally:
            try:
                db.close()
            except:
                pass

    # ── AI Analysis ───────────────────────────────────────────────────────────
    async def _generate_ai_analysis(self, session, health: dict, dataset: list) -> dict:
        try:
            import anthropic

            avg_pwr  = session.avg_power_w or 0
            peak_pwr = session.peak_power_w or 0
            kwh      = session.total_session_kwh or 0
            cost     = session.total_cost_rs or 0
            pf       = session.avg_power_factor or 1
            duration = session.actual_duration_min or 0
            pq       = session.avg_pq_score or 80
            temp     = getattr(session, 'avg_temperature', None)
            humidity = getattr(session, 'avg_humidity', None)

            typical_ref = find_typical_wattage(session.appliance_name)
            typical_str = (
                f"{typical_ref['typical']}W (range: {typical_ref['min']}W–{typical_ref['max']}W)"
                if typical_ref else "No reference data"
            )

            power_values = [r.get("power_w", 0) for r in dataset if r.get("power_w")]
            stability    = "stable"
            if power_values and len(power_values) > 3:
                import statistics
                cv = statistics.stdev(power_values) / (statistics.mean(power_values) + 0.001)
                if cv > 0.3:    stability = "highly variable"
                elif cv > 0.15: stability = "moderately variable"

            prompt = f"""You are an expert electrical engineer analyzing IoT meter data for a household appliance.

APPLIANCE TESTED: {session.appliance_name}
Brand/Model: {session.appliance_brand or 'Not specified'}
Description: {session.appliance_description or 'None'}

MEASURED DATA:
- Duration: {duration:.1f} minutes ({session.total_readings} readings at 5-sec intervals)
- Average Power: {avg_pwr:.1f}W | Peak: {peak_pwr:.1f}W
- Power Factor: {pf:.3f} ({'Excellent ≥0.95' if pf >= 0.95 else 'Good ≥0.85' if pf >= 0.85 else 'Fair ≥0.70' if pf >= 0.70 else 'Poor <0.70'})
- Power Quality Score: {pq:.1f}/100
- Energy Used: {kwh:.4f} kWh | Est. Cost: Rs.{cost:.2f}
- Power Stability: {stability}
{f'- Temperature: {temp:.1f}°C | Humidity: {humidity:.1f}%' if temp and humidity else ''}

REFERENCE (typical for this type): {typical_str}

HEALTH ASSESSMENT:
- Status: {health['status']}
- Health Score: {health['health_score']}/100
- Deviation from typical: {health.get('deviation_pct', 'N/A')}%
- Issues found: {len(health.get('issues', []))}

Issues Detail: {json.dumps(health.get('issues', []), indent=2)}

Please provide:
1. A 2-3 sentence plain-English summary for a non-technical user
2. 3-5 specific actionable recommendations
3. A one-sentence comparison to typical appliances of this type
4. Whether this appliance should be serviced (yes/no/monitor)

Respond ONLY with valid JSON, no markdown, no preamble:
{{
  "summary": "...",
  "recommendations": ["...", "...", "..."],
  "comparison": "...",
  "needs_service": "yes|no|monitor",
  "key_finding": "one sentence most important finding"
}}"""

            client  = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
            message = client.messages.create(
                model      = "claude-sonnet-4-20250514",
                max_tokens = 1024,
                messages   = [{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                ai_data = json.loads(json_match.group())
                return {
                    "summary":         ai_data.get("summary", ""),
                    "recommendations": ai_data.get("recommendations", []),
                    "comparison":      ai_data.get("comparison", ""),
                    "needs_service":   ai_data.get("needs_service", "monitor"),
                    "key_finding":     ai_data.get("key_finding", ""),
                }
        except Exception as e:
            logger.error(f"AI analysis error: {e}")

        return self._rule_based_analysis(session, health)

    def _rule_based_analysis(self, session, health: dict) -> dict:
        avg_pwr  = session.avg_power_w or 0
        pf       = session.avg_power_factor or 1
        duration = session.actual_duration_min or 0
        kwh      = session.total_session_kwh or 0
        appliance = session.appliance_name

        recs    = []
        typical = find_typical_wattage(appliance)

        if pf < 0.8 and avg_pwr > 50:
            recs.append(f"Power factor {pf:.2f} is below optimal — may indicate capacitor degradation.")
        if health["status"] == "FAULT_SUSPECTED":
            recs.append("⚠️ Consuming significantly more than expected. Get professionally inspected before continued use.")
        if health["status"] == "UNDER_PERFORMING":
            recs.append("Appliance is under-performing. Internal components may have failed. Consider servicing.")
        if typical:
            hourly_rate  = (kwh / max(duration, 0.01)) * 60
            monthly_est  = hourly_rate * 8 * 30
            if monthly_est > 300:
                recs.append(f"If used 8h/day, this adds ~{monthly_est:.0f} kWh/month (~Rs.{monthly_est*15:.0f}).")
        if not recs:
            recs.append(f"Your {appliance} appears to be operating within normal parameters.")
            recs.append("Regular cleaning and maintenance will help maintain efficiency.")

        summary = (
            f"Test completed for {appliance} ({duration:.0f} min). "
            f"Average consumption: {avg_pwr:.0f}W, health score: {health['health_score']}/100. "
            f"{health['verdict']}"
        )

        comparison = ""
        if typical:
            dev = health.get("deviation_pct", 0) or 0
            if abs(dev) < 10:
                comparison = f"Your {appliance} consumes {avg_pwr:.0f}W — within normal range of typical {typical['typical']}W."
            elif dev > 0:
                comparison = f"Your {appliance} uses {dev:.0f}% more than typical ({avg_pwr:.0f}W vs {typical['typical']}W)."
            else:
                comparison = f"Your {appliance} is efficient — uses {abs(dev):.0f}% less than typical ({avg_pwr:.0f}W vs {typical['typical']}W)."

        return {
            "summary":         summary,
            "recommendations": recs,
            "comparison":      comparison,
            "needs_service":   "yes" if health["health_score"] < 50 else "monitor" if health["health_score"] < 70 else "no",
            "key_finding":     health["verdict"],
        }

    # ── Anomaly detection ─────────────────────────────────────────────────────
    def _detect_anomalies(self, device_id: str, data: dict) -> list:
        anomalies = []
        voltage = data.get("voltage", 230)
        power   = data.get("power_w") or data.get("power", 0)
        pf      = data.get("power_factor", 1)
        current = data.get("current_a") or data.get("current", 0)
        freq    = data.get("frequency_hz") or data.get("frequency", 50)

        if voltage < 207:
            anomalies.append(f"LOW_VOLTAGE:{voltage:.0f}V")
        elif voltage > 253:
            anomalies.append(f"HIGH_VOLTAGE:{voltage:.0f}V")

        if pf < 0.5 and current > 0.3:
            anomalies.append(f"CRITICAL_LOW_PF:{pf:.2f}")
        elif pf < 0.6 and current > 0.5:
            anomalies.append(f"LOW_PF:{pf:.2f}")

        history = reading_history.get(device_id)
        if history and len(history) >= 3:
            recent_avg = sum((r.get("power_w") or r.get("power") or 0) for r in list(history)[-3:]) / 3
            if recent_avg > 0 and power > recent_avg * 3:
                anomalies.append(f"POWER_SPIKE:{power:.0f}W")

        if not (45 <= freq <= 65):
            anomalies.append(f"FREQ_DEVIATION:{freq:.1f}Hz")

        return anomalies

    # ── Broadcast to WebSocket clients watching a device ─────────────────────
    async def _broadcast_to_device_watchers(self, device_id: str, message: dict):
        """
        FIX: Iterate all connections; send if ws watches this device or watches all.
        """
        for key, connections in list(active_connections.items()):
            dead = []
            for ws in list(connections):
                ws_device = getattr(ws, '_device_id', None)
                if ws_device is None or ws_device == device_id:
                    try:
                        await ws.send_json(message)
                    except Exception:
                        dead.append(ws)
            for ws in dead:
                try:
                    connections.remove(ws)
                except ValueError:
                    pass

    async def _broadcast(self, user_id, message: dict):
        key = str(user_id)
        if key not in active_connections:
            return
        dead = []
        for ws in active_connections[key]:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            active_connections[key].remove(ws)

    def _schedule(self, coro):
        if self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(coro, self.loop)
        else:
            logger.warning("Event loop not available — skipped coroutine")

    # ── Public API ────────────────────────────────────────────────────────────
    def set_active_session(self, device_id: str, session_id: int, user_id: int = None):
        active_sessions[device_id] = session_id
        logger.info(f"Active session set: device={device_id} session={session_id} user={user_id}")

    def get_active_session(self, device_id: str) -> Optional[int]:
        return active_sessions.get(device_id)

    def register_websocket(self, user_id, ws, device_id: str = None):
        key = str(user_id)
        if key not in active_connections:
            active_connections[key] = []
        ws._device_id = device_id
        active_connections[key].append(ws)

    def unregister_websocket(self, user_id, ws):
        key = str(user_id)
        if key in active_connections:
            try:
                active_connections[key].remove(ws)
            except ValueError:
                pass

    def get_latest(self, device_id: str) -> Optional[dict]:
        return latest_readings.get(device_id)

    def get_history(self, device_id: str, minutes: int = 5) -> List[dict]:
        history = reading_history.get(device_id, deque())
        return list(history)[-(minutes * 12):]

    def get_appliance_events(self, device_id: str) -> List[dict]:
        return appliance_events.get(device_id, [])

    def inject_simulated_reading(self, device_id: str, data: dict):
        self._handle_live_reading_sync(device_id, data)

    def stop(self):
        self.running = False
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()


iot_service = IoTService()