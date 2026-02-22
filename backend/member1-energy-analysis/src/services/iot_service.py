"""
src/services/iot_service.py
===========================
FIXED: 'no running event loop' error caused by asyncio.create_task()
being called from paho-mqtt's background thread.
Solution: capture the event loop at startup and use
asyncio.run_coroutine_threadsafe() for all cross-thread async calls.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
from collections import deque

logger = logging.getLogger(__name__)

# ── In-memory stores ──────────────────────────────────────────────────────────
latest_readings:    Dict[str, dict]       = {}
reading_history:    Dict[str, deque]      = {}
active_connections: Dict[str, List]       = {}
appliance_events:   Dict[str, List[dict]] = {}


class IoTService:

    def __init__(self):
        self.mqtt_client = None
        self.running     = False
        self.loop        = None          # ← captured event loop
        self.broker_host = "broker.hivemq.com"
        self.broker_port = 1883

    # ── Start ─────────────────────────────────────────────────────────────────
    def start(self):
        self.running = True
        self.loop    = asyncio.get_event_loop()          # ← capture FastAPI loop
        asyncio.create_task(self._mqtt_loop())
        logger.info(f"IoT service started -- broker: {self.broker_host}:{self.broker_port}")

    # ── MQTT loop (runs inside FastAPI's async loop) ──────────────────────────
    async def _mqtt_loop(self):
        try:
            import paho.mqtt.client as mqtt

            client = mqtt.Client(client_id="energyiq-backend-fastapi")
            client.on_connect    = self._on_connect
            client.on_message    = self._on_message
            client.on_disconnect = self._on_disconnect

            client.connect_async(self.broker_host, self.broker_port, keepalive=60)
            client.loop_start()
            self.mqtt_client = client
            logger.info("MQTT client started -- connecting to HiveMQ...")

            while self.running:
                await asyncio.sleep(1)

        except ImportError:
            logger.error("paho-mqtt not installed -- run: pip install paho-mqtt")
        except Exception as e:
            logger.error(f"MQTT loop error: {e}")

    # ── MQTT callbacks (called from paho background thread) ───────────────────
    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            client.subscribe("energyiq/#")
            logger.info("Connected to HiveMQ -- subscribed to energyiq/#")
        else:
            logger.error(f"HiveMQ connect failed: rc={rc}")

    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"HiveMQ disconnected rc={rc} -- auto-reconnecting...")

    def _on_message(self, client, userdata, msg):
        """
        Called from paho's background thread — must NOT use asyncio.create_task().
        Use run_coroutine_threadsafe() to schedule coroutines on the main loop.
        """
        try:
            topic   = msg.topic
            payload = json.loads(msg.payload.decode())
            parts   = topic.split("/")          # ['energyiq', 'ACC001', 'live']

            if len(parts) < 3:
                return

            account  = parts[1]
            msg_type = parts[2]

            if msg_type == "live":
                self._handle_live_reading_sync(account, payload)
            elif msg_type == "appliance":
                self._handle_appliance_event_sync(account, payload)
            elif msg_type == "status":
                logger.info(f"Device [{account}] status: {payload.get('status')}")

        except json.JSONDecodeError:
            logger.warning("Invalid JSON from MQTT")
        except Exception as e:
            logger.error(f"MQTT message error: {e}")

    # ── Sync wrappers (safe to call from any thread) ──────────────────────────
    def _handle_live_reading_sync(self, account: str, data: dict):
        """Process + store synchronously, then schedule broadcast on event loop."""
        data["server_time"]    = datetime.utcnow().isoformat()
        data["account_number"] = account
        data["apparent_power"] = round(
            data.get("voltage", 0) * data.get("current", 0), 1
        )
        data["anomalies"] = self._detect_anomalies(account, data)

        latest_readings[account] = data

        if account not in reading_history:
            reading_history[account] = deque(maxlen=60)
        reading_history[account].append(data)

        self._schedule(self._broadcast(account, {
            "type": "live_reading",
            "data": data,
        }))

    def _handle_appliance_event_sync(self, account: str, data: dict):
        data["server_time"] = datetime.utcnow().isoformat()

        if account not in appliance_events:
            appliance_events[account] = []
        appliance_events[account].append(data)

        if len(appliance_events[account]) > 50:
            appliance_events[account] = appliance_events[account][-50:]

        self._schedule(self._broadcast(account, {
            "type": "appliance_event",
            "data": data,
        }))

    def _schedule(self, coro):
        """
        Thread-safe: schedule a coroutine on the captured event loop.
        Works whether called from async context or paho's background thread.
        """
        if self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(coro, self.loop)
        else:
            logger.warning("Event loop not available -- broadcast skipped")

    # ── Anomaly detection (pure sync, safe anywhere) ──────────────────────────
    def _detect_anomalies(self, account: str, data: dict) -> List[str]:
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

        history = reading_history.get(account)
        if history and len(history) >= 3:
            recent_avg = sum(r.get("power", 0) for r in list(history)[-3:]) / 3
            if recent_avg > 0 and power > recent_avg * 3:
                anomalies.append(f"POWER_SPIKE:{power:.0f}W")

        return anomalies

    # ── WebSocket broadcast (async, runs on main loop) ────────────────────────
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

    # ── WebSocket registration ────────────────────────────────────────────────
    def register_websocket(self, account: str, ws):
        if account not in active_connections:
            active_connections[account] = []
        active_connections[account].append(ws)
        logger.info(f"WebSocket connected for account: {account}")

    def unregister_websocket(self, account: str, ws):
        if account in active_connections:
            try:
                active_connections[account].remove(ws)
            except ValueError:
                pass

    # ── inject_simulated_reading (called from async route) ───────────────────
    def inject_simulated_reading(self, account: str, data: dict):
        """Called from /iot/simulate — already on the event loop, safe to use directly."""
        self._handle_live_reading_sync(account, data)

    # ── Getters ───────────────────────────────────────────────────────────────
    def get_latest(self, account: str) -> Optional[dict]:
        return latest_readings.get(account)

    def get_history(self, account: str, minutes: int = 5) -> List[dict]:
        history = reading_history.get(account, deque())
        return list(history)[-(minutes * 12):]

    def get_appliance_events(self, account: str) -> List[dict]:
        return appliance_events.get(account, [])

    # ── Stop ──────────────────────────────────────────────────────────────────
    def stop(self):
        self.running = False
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
            logger.info("IoT service stopped")


# Singleton
iot_service = IoTService()