"""
src/services/iot_service.py
============================
Updated for standalone device (no account number in firmware).
- Subscribes to: energyiq/device/+/live
- Stores readings in database linked to active session
- Detects device disconnect (no data for 30s) → triggers session end + AI summary
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional
from collections import deque

logger = logging.getLogger(__name__)

# ── In-memory stores ──────────────────────────────────────────────────────────
# key: device_id → latest reading dict
latest_readings:    Dict[str, dict]       = {}
# key: device_id → deque of last 60 readings
reading_history:    Dict[str, deque]      = {}
# key: account_number → list of websocket connections
active_connections: Dict[str, List]       = {}
# key: device_id → list of appliance events this session
appliance_events:   Dict[str, List[dict]] = {}
# key: device_id → active session id (int) or None
active_sessions:    Dict[str, Optional[int]] = {}
# key: device_id → account_number for that session
session_accounts:   Dict[str, str]           = {}
# key: device_id → last seen timestamp (for disconnect detection)
last_seen:          Dict[str, datetime]   = {}


class IoTService:

    def __init__(self):
        self.mqtt_client = None
        self.running     = False
        self.loop        = None
        self.broker_host = "broker.hivemq.com"
        self.broker_port = 1883
        self._db_factory = None   # injected at startup

    # ── Start ─────────────────────────────────────────────────────────────────
    def start(self, db_factory=None):
        self.running     = True
        self.loop        = asyncio.get_event_loop()
        self._db_factory = db_factory
        asyncio.create_task(self._mqtt_loop())
        asyncio.create_task(self._disconnect_watchdog())
        logger.info(f"IoT service started — broker: {self.broker_host}:{self.broker_port}")

    # ── MQTT loop ─────────────────────────────────────────────────────────────
    async def _mqtt_loop(self):
        try:
            import paho.mqtt.client as mqtt
            import time
            # Unique client ID to prevent disconnections on public broker
            client_id = f"energyiq-backend-{int(time.time())}"
            client = mqtt.Client(client_id=client_id)
            client.on_connect    = self._on_connect
            client.on_message    = self._on_message
            client.on_disconnect = self._on_disconnect
            client.connect_async(self.broker_host, self.broker_port, keepalive=60)
            client.loop_start()
            self.mqtt_client = client
            logger.info(f"MQTT client [{client_id}] started — connecting to HiveMQ...")
            while self.running:
                await asyncio.sleep(1)
        except ImportError:
            logger.error("paho-mqtt not installed — pip install paho-mqtt")
        except Exception as e:
            logger.error(f"MQTT loop error: {e}")

    # ── MQTT callbacks ────────────────────────────────────────────────────────
    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            # Subscribe to new device-MAC topics AND old account topics
            client.subscribe("energyiq/device/+/live")
            client.subscribe("energyiq/device/+/appliance")
            client.subscribe("energyiq/device/+/status")
            # Keep old topic support for backward compat
            client.subscribe("energyiq/#")
            logger.info("Connected to HiveMQ — subscribed to energyiq/device/+/live")
        else:
            logger.error(f"HiveMQ connect failed: rc={rc}")

    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"HiveMQ disconnected rc={rc} — auto-reconnecting...")

    def _on_message(self, client, userdata, msg):
        try:
            topic   = msg.topic
            payload = json.loads(msg.payload.decode())
            parts   = topic.split("/")

            # New format: energyiq/device/{MAC}/live
            if len(parts) == 4 and parts[0] == "energyiq" and parts[1] == "device":
                device_id = parts[2]
                msg_type  = parts[3]
                if msg_type == "live":
                    self._handle_live_reading_sync(device_id, payload)
                elif msg_type == "appliance":
                    self._handle_appliance_event_sync(device_id, payload)
                elif msg_type == "status":
                    status = payload.get('status')
                    logger.info(f"Device [{device_id}] status: {status}")
                    self._handle_status_sync(device_id, payload)

            # Old format: energyiq/{account}/live (backward compat)
            elif len(parts) == 3 and parts[0] == "energyiq":
                account  = parts[1]
                msg_type = parts[2]
                if msg_type == "live":
                    payload["device_id"] = payload.get("device_id", "LEGACY")
                    self._handle_live_reading_sync(account, payload, account_override=account)

        except json.JSONDecodeError:
            logger.warning("Invalid JSON from MQTT")
        except Exception as e:
            logger.error(f"MQTT message error: {e}")

    # ── Handle live reading ───────────────────────────────────────────────────
    def _handle_live_reading_sync(self, device_id: str, data: dict, account_override: str = None):
        data["server_time"] = datetime.now(timezone.utc).isoformat()
        data["device_id"]   = device_id

        # Update last seen for disconnect detection
        last_seen[device_id] = datetime.now(timezone.utc)

        # Anomaly detection
        data["anomalies"] = self._detect_anomalies(device_id, data)

        # Store in memory
        latest_readings[device_id] = data
        if device_id not in reading_history:
            reading_history[device_id] = deque(maxlen=60)
        reading_history[device_id].append(data)

        # Save to DB if there's an active session for this device
        self._schedule(self._save_reading_to_db(device_id, data))

        # Broadcast to all WebSocket clients watching this device
        # Account is stored in active session; find which accounts to broadcast to
        self._schedule(self._broadcast_to_device_watchers(device_id, {
            "type": "live_reading",
            "data": data,
        }))

    def _handle_status_sync(self, device_id: str, data: dict):
        """Handle status messages (online/offline) to discover devices."""
        last_seen[device_id] = datetime.now(timezone.utc)
        
        # If this is a new device we haven't seen yet, initialize it in latest_readings
        # so it shows up in the 'Scanning' list in the mobile app.
        if device_id not in latest_readings:
            latest_readings[device_id] = {
                "device_id": device_id,
                "status": data.get("status"),
                "server_time": datetime.now(timezone.utc).isoformat(),
                "power": 0,
                "voltage": 0
            }
        else:
            latest_readings[device_id]["status"] = data.get("status")
            latest_readings[device_id]["server_time"] = datetime.now(timezone.utc).isoformat()

    # ── Save reading to database ──────────────────────────────────────────────
    async def _save_reading_to_db(self, device_id: str, data: dict):
        if not self._db_factory:
            return
        session_id = active_sessions.get(device_id)
        if not session_id:
            logger.debug(f"No active session for device {device_id} — reading not saved")
            return

        account_number = session_accounts.get(device_id) or data.get("account_number", "")

        try:
            from src.models.device_session import DeviceReading
            db = self._db_factory()
            reading = DeviceReading(
                session_id          = session_id,
                device_id           = device_id,
                account_number      = account_number,
                voltage             = data.get("voltage", 0),
                current_a           = data.get("current", 0),
                power_w             = data.get("power", 0),
                energy_kwh          = data.get("energy", 0),
                frequency_hz        = data.get("frequency", 50),
                power_factor        = data.get("power_factor", 1),
                apparent_power_va   = data.get("apparent_power"),
                reactive_power_var  = data.get("reactive_power"),
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
            )
            db.add(reading)

            # Update session summary
            from src.models.device_session import DeviceSession
            session = db.query(DeviceSession).filter(DeviceSession.id == session_id).first()
            if session:
                n = (session.total_readings or 0) + 1
                session.total_readings = n

                # Peak power
                pwr = data.get("power_w") or data.get("power") or 0
                if pwr and (not session.peak_power_w or pwr > session.peak_power_w):
                    session.peak_power_w = pwr

                # Running average power
                if pwr:
                    prev_avg = session.avg_power_w or 0
                    session.avg_power_w = round(((prev_avg * (n - 1)) + pwr) / n, 2)

                # Voltage min/max
                v = data.get("voltage") or 0
                if v:
                    if not session.min_voltage_v or v < session.min_voltage_v:
                        session.min_voltage_v = v
                    if not session.max_voltage_v or v > session.max_voltage_v:
                        session.max_voltage_v = v

                # Power factor average
                pf = data.get("power_factor") or 0
                if pf:
                    prev_pf = session.avg_power_factor or 0
                    session.avg_power_factor = round(((prev_pf * (n - 1)) + pf) / n, 3)

                # PQ score average
                pq = data.get("power_quality_score") or 0
                if pq:
                    prev_pq = session.avg_pq_score or 0
                    session.avg_pq_score = round(((prev_pq * (n - 1)) + pq) / n, 1)

                # Session totals from device
                if data.get("session_kwh"):
                    session.total_session_kwh = data["session_kwh"]
                if data.get("session_cost_rs"):
                    session.total_cost_rs = data["session_cost_rs"]

            db.commit()
        except Exception as e:
            logger.error(f"DB save reading error: {e}")
            try: db.rollback()
            except: pass
        finally:
            try: db.close()
            except: pass

    # ── Save appliance event to DB ────────────────────────────────────────────
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
                account_number = data.get("account_number", ""),
                from_appliance = data.get("from", ""),
                to_appliance   = data.get("to", ""),
                watts          = data.get("watts", 0),
            )
            db.add(event)
            db.commit()
        except Exception as e:
            logger.error(f"DB save event error: {e}")
        finally:
            try: db.close()
            except: pass

    # ── Disconnect watchdog ───────────────────────────────────────────────────
    async def _disconnect_watchdog(self):
        """Check every 10s if any device hasn't sent data for 30s → end session."""
        while self.running:
            await asyncio.sleep(10)
            now = datetime.now(timezone.utc)
            for device_id, last_time in list(last_seen.items()):
                elapsed = (now - last_time).total_seconds()
                if elapsed > 30 and active_sessions.get(device_id):
                    logger.info(f"Device {device_id} disconnected ({elapsed:.0f}s) — ending session")
                    await self._end_session(device_id)

    async def _end_session(self, device_id: str):
        """Finalise session in DB, generate AI summary, notify frontend."""
        session_id = active_sessions.get(device_id)
        if not session_id:
            return

        active_sessions[device_id] = None   # mark as ended

        if not self._db_factory:
            return

        try:
            from src.models.device_session import DeviceSession
            db = self._db_factory()
            session = db.query(DeviceSession).filter(DeviceSession.id == session_id).first()
            if not session:
                return

            session.status   = "completed"
            session.ended_at = datetime.now(timezone.utc)

            if session.started_at and session.ended_at:
                delta = (session.ended_at - session.started_at).total_seconds() / 60
                session.actual_duration_min = round(delta, 1)

            # Generate AI analysis
            ai_result = await self._generate_ai_summary(session)
            session.ai_summary         = ai_result.get("summary")
            session.ai_recommendations = json.dumps(ai_result.get("recommendations", []))
            session.comparison_note    = ai_result.get("comparison")

            db.commit()
            db.refresh(session)

            # Broadcast session ended to frontend
            await self._broadcast_to_device_watchers(device_id, {
                "type": "session_ended",
                "data": session.to_dict(),
            })

            logger.info(f"Session {session_id} completed for device {device_id}")
        except Exception as e:
            logger.error(f"End session error: {e}")
        finally:
            try: db.close()
            except: pass

    # ── AI Summary generation ─────────────────────────────────────────────────
    async def _generate_ai_summary(self, session) -> dict:
        """Generate AI summary using Claude API via backend."""
        try:
            avg_pwr   = session.avg_power_w or 0
            peak_pwr  = session.peak_power_w or 0
            kwh       = session.total_session_kwh or 0
            cost      = session.total_cost_rs or 0
            pf        = session.avg_power_factor or 1
            duration  = session.actual_duration_min or 0
            appliance = session.appliance_name
            brand     = session.appliance_brand or "unknown brand"

            # Typical wattage lookup
            typical = self._get_typical_wattage(appliance)
            comparison = ""
            if typical and avg_pwr > 0:
                diff = avg_pwr - typical
                diff_pct = (diff / typical) * 100
                if abs(diff_pct) < 10:
                    comparison = f"Your {appliance} ({avg_pwr:.0f}W) is performing within normal range of typical {typical}W."
                elif diff_pct > 0:
                    comparison = f"Your {appliance} uses {abs(diff_pct):.0f}% more power ({avg_pwr:.0f}W) than typical ({typical}W). Consider servicing it."
                else:
                    comparison = f"Your {appliance} is efficient — uses {abs(diff_pct):.0f}% less power ({avg_pwr:.0f}W) than typical ({typical}W)."

            # Recommendations
            recommendations = []

            if pf < 0.8 and avg_pwr > 50:
                recommendations.append(f"Power factor is {pf:.2f} — consider a power factor correction capacitor to reduce reactive power losses.")

            if peak_pwr > avg_pwr * 1.5 and avg_pwr > 0:
                recommendations.append(f"High startup surge detected (peak {peak_pwr:.0f}W vs avg {avg_pwr:.0f}W). This is normal for motors but ensure your circuit breaker is rated appropriately.")

            if kwh > 0 and duration > 0:
                hourly_rate = (kwh / duration) * 60
                daily_est   = hourly_rate * 8
                monthly_est = daily_est * 30 * 15  # approx Rs/kWh
                if monthly_est > 500:
                    recommendations.append(f"If used 8 hours/day, this appliance costs approximately Rs.{monthly_est:.0f}/month. Consider reducing usage time to save electricity.")

            if not recommendations:
                recommendations.append(f"Your {appliance} appears to be operating normally. Regular maintenance will help maintain efficiency.")

            # Summary
            summary = (
                f"Session completed for {appliance} ({brand}). "
                f"Duration: {duration:.0f} minutes. "
                f"Average power: {avg_pwr:.0f}W, Peak: {peak_pwr:.0f}W. "
                f"Energy consumed: {kwh:.4f} kWh, estimated cost: Rs.{cost:.0f}. "
                f"Power factor: {pf:.2f} ({'good' if pf >= 0.85 else 'poor — inefficient'}). "
            )

            return {
                "summary":         summary,
                "recommendations": recommendations,
                "comparison":      comparison,
            }

        except Exception as e:
            logger.error(f"AI summary error: {e}")
            return {
                "summary":         "Session completed successfully.",
                "recommendations": ["Check your appliance regularly for efficiency."],
                "comparison":      "",
            }

    def _get_typical_wattage(self, appliance_name: str) -> Optional[float]:
        """Return typical wattage for common appliances."""
        name = appliance_name.lower()
        lookup = {
            "fan":             75,
            "ceiling fan":     75,
            "rice cooker":     700,
            "microwave":       1200,
            "refrigerator":    150,
            "air conditioner": 1500,
            "ac":              1500,
            "television":      80,
            "tv":              80,
            "laptop":          50,
            "iron":            1000,
            "washing machine": 500,
            "water heater":    2000,
            "kettle":          1500,
            "toaster":         800,
            "computer":        200,
        }
        for key, wattage in lookup.items():
            if key in name:
                return float(wattage)
        return None

    # ── Anomaly detection ─────────────────────────────────────────────────────
    def _detect_anomalies(self, device_id: str, data: dict) -> List[str]:
        anomalies = []
        voltage = data.get("voltage", 230)
        power   = data.get("power", 0)
        pf      = data.get("power_factor", 1)
        current = data.get("current", 0)

        if voltage < 207:
            anomalies.append(f"LOW_VOLTAGE:{voltage:.0f}V")
        elif voltage > 253:
            anomalies.append(f"HIGH_VOLTAGE:{voltage:.0f}V")

        if pf < 0.6 and current > 0.5:
            anomalies.append(f"LOW_POWER_FACTOR:{pf:.2f}")

        history = reading_history.get(device_id)
        if history and len(history) >= 3:
            recent_avg = sum(r.get("power", 0) for r in list(history)[-3:]) / 3
            if recent_avg > 0 and power > recent_avg * 3:
                anomalies.append(f"POWER_SPIKE:{power:.0f}W")

        return anomalies

    # ── Broadcast helpers ─────────────────────────────────────────────────────
    async def _broadcast_to_device_watchers(self, device_id: str, message: dict):
        """Broadcast to all WebSocket connections watching this device."""
        for account, connections in active_connections.items():
            dead = []
            for ws, ws_device_id in [(ws, getattr(ws, '_device_id', None)) for ws in connections]:
                if ws_device_id == device_id or ws_device_id is None:
                    try:
                        await ws.send_json(message)
                    except Exception:
                        dead.append(ws)
            for ws in dead:
                try: connections.remove(ws)
                except: pass

    async def _broadcast(self, account: str, message: dict):
        if account not in active_connections:
            return
        dead = []
        for ws in active_connections[account]:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            active_connections[account].remove(ws)

    def _schedule(self, coro):
        if self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(coro, self.loop)
        else:
            logger.warning("Event loop not available — skipped")

    # ── Session management (called from API routes) ───────────────────────────
    def set_active_session(self, device_id: str, session_id: int, account_number: str):
        """Called when user starts a new session from the app."""
        active_sessions[device_id] = session_id
        session_accounts[device_id] = account_number
        logger.info(f"Active session set: device={device_id} session={session_id} account={account_number}")

    def get_active_session(self, device_id: str) -> Optional[int]:
        return active_sessions.get(device_id)

    # ── WebSocket registration ────────────────────────────────────────────────
    def register_websocket(self, account: str, ws, device_id: str = None):
        if account not in active_connections:
            active_connections[account] = []
        ws._device_id = device_id
        active_connections[account].append(ws)

    def unregister_websocket(self, account: str, ws):
        if account in active_connections:
            try:
                active_connections[account].remove(ws)
            except ValueError:
                pass

    # ── Getters ───────────────────────────────────────────────────────────────
    def get_latest(self, device_id: str) -> Optional[dict]:
        return latest_readings.get(device_id)

    def get_history(self, device_id: str, minutes: int = 5) -> List[dict]:
        history = reading_history.get(device_id, deque())
        return list(history)[-(minutes * 12):]

    def get_appliance_events(self, device_id: str) -> List[dict]:
        return appliance_events.get(device_id, [])

    def inject_simulated_reading(self, device_id: str, data: dict):
        self._handle_live_reading_sync(device_id, data)

    # ── Stop ──────────────────────────────────────────────────────────────────
    def stop(self):
        self.running = False
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()


iot_service = IoTService()