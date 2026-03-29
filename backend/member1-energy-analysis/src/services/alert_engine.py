"""
src/services/alert_engine.py
Alert Engine — Telegram bot + in-app push notifications.

Triggers:
  1. Relay safety trip (overcurrent / overvoltage)
  2. Budget plan exceeded or projected to exceed
  3. Bill spike predicted (>20% above average)
  4. Power anomaly (LOW_VOLTAGE, HIGH_VOLTAGE, LOW_PF, POWER_SPIKE)
  5. IoT session completed — health score < 60

Setup:
  Add to .env:
    TELEGRAM_BOT_TOKEN=your_bot_token
    TELEGRAM_CHAT_IDS=123456789,987654321   (comma-separated user chat IDs)

  Get bot token: message @BotFather on Telegram → /newbot
  Get chat ID:   message @userinfobot on Telegram
"""

import os, json, logging, asyncio
from typing import Optional, List, Dict
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"

# Alert severity levels
SEVERITY_INFO    = "ℹ️"
SEVERITY_WARNING = "⚠️"
SEVERITY_DANGER  = "🚨"
SEVERITY_SUCCESS = "✅"


# ─── Telegram helpers ─────────────────────────────────────────────────────────

async def _send_telegram(chat_id: str, text: str, parse_mode: str = "HTML") -> bool:
    """Send a Telegram message to a specific chat ID."""
    if not TELEGRAM_TOKEN:
        logger.debug("Telegram token not set — skipping alert")
        return False
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.post(
                f"{TELEGRAM_API}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": parse_mode},
            )
            if r.status_code == 200:
                return True
            logger.warning(f"Telegram API error: {r.status_code} {r.text[:200]}")
    except Exception as e:
        logger.error(f"Telegram send error: {e}")
    return False


async def _broadcast_telegram(text: str) -> int:
    """Send the same message to all configured chat IDs. Returns sent count."""
    raw = os.getenv("TELEGRAM_CHAT_IDS", "")
    chat_ids = [c.strip() for c in raw.split(",") if c.strip()]
    if not chat_ids:
        logger.debug("No TELEGRAM_CHAT_IDS set")
        return 0
    results = await asyncio.gather(*[_send_telegram(cid, text) for cid in chat_ids])
    return sum(results)


def send_telegram_sync(text: str) -> int:
    """Synchronous wrapper — safe to call from non-async FastAPI routes."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(_broadcast_telegram(text))
            return -1  # scheduled
        return loop.run_until_complete(_broadcast_telegram(text))
    except Exception as e:
        logger.error(f"send_telegram_sync error: {e}")
        return 0


# ─── Alert builders ───────────────────────────────────────────────────────────

class AlertEngine:
    """Central alert dispatcher. Call the appropriate method from IoT handlers,
    budget tracking endpoints, and scheduled jobs."""

    def __init__(self):
        self._cooldowns: Dict[str, datetime] = {}   # prevent spam

    def _is_cooling_down(self, key: str, minutes: int = 15) -> bool:
        """Rate-limit repeated alerts of the same type."""
        last = self._cooldowns.get(key)
        if last and (datetime.utcnow() - last).seconds < minutes * 60:
            return True
        self._cooldowns[key] = datetime.utcnow()
        return False

    # ── 1. Relay safety trip ──────────────────────────────────────────────────
    def on_safety_trip(self, device_id: str, reason: str,
                        power_w: float, voltage: float, db=None):
        """Called when the ESP32 reports safety_tripped=true in a live reading."""
        if self._is_cooling_down(f"safety_{device_id}", minutes=5):
            return

        msg = (
            f"{SEVERITY_DANGER} <b>Safety Trip — Power Cut!</b>\n\n"
            f"📡 Device: <code>{device_id}</code>\n"
            f"⚡ Power at trip: <b>{power_w:.0f} W</b>\n"
            f"🔌 Voltage at trip: <b>{voltage:.1f} V</b>\n"
            f"🛑 Reason: <b>{reason}</b>\n\n"
            f"The relay has been opened to protect your appliance.\n"
            f"Send <code>reset_safety</code> from the app after resolving the issue."
        )
        count = send_telegram_sync(msg)
        logger.info(f"Safety trip alert sent to {count} chats")

        if db:
            from src.models.user import Notification
            from src.database import SessionLocal
            _persist_notification(
                db, None, "Safety Trip — Power Cut!",
                f"Overcurrent/voltage trip on {device_id}: {reason}", "danger"
            )

    # ── 2. Power anomaly (non-trip) ───────────────────────────────────────────
    def on_power_anomaly(self, device_id: str, anomaly: str,
                          power_w: float, voltage: float):
        if self._is_cooling_down(f"anomaly_{device_id}_{anomaly[:10]}", minutes=20):
            return

        ICONS = {
            "LOW_VOLTAGE": "⬇️",
            "HIGH_VOLTAGE": "⬆️",
            "LOW_PF": "📉",
            "POWER_SPIKE": "💥",
            "FREQ_DEVIATION": "〰️",
        }
        anomaly_key = anomaly.split(":")[0]
        icon = ICONS.get(anomaly_key, "⚠️")

        msg = (
            f"{SEVERITY_WARNING} <b>Power Anomaly Detected</b>\n\n"
            f"📡 Device: <code>{device_id}</code>\n"
            f"{icon} Anomaly: <b>{anomaly}</b>\n"
            f"⚡ Power: {power_w:.0f} W  |  🔌 Voltage: {voltage:.1f} V\n\n"
            f"Monitor the device. If this persists, check wiring."
        )
        send_telegram_sync(msg)

    # ── 3. Budget exceeded ────────────────────────────────────────────────────
    def on_budget_exceeded(self, account_number: str, user_id: int,
                            actual_cost: float, target_budget: float,
                            projected_cost: float, days_remaining: int, db=None):
        if self._is_cooling_down(f"budget_{account_number}", minutes=60):
            return

        excess = projected_cost - target_budget
        msg = (
            f"{SEVERITY_DANGER} <b>Budget Alert — Over Target!</b>\n\n"
            f"🏠 Account: <code>{account_number}</code>\n"
            f"💰 Spent so far: <b>Rs. {actual_cost:.0f}</b>\n"
            f"🎯 Target budget: <b>Rs. {target_budget:.0f}</b>\n"
            f"📈 Projected total: <b>Rs. {projected_cost:.0f}</b>\n"
            f"💸 Over by: <b>Rs. {excess:.0f}</b>\n"
            f"📅 Days remaining: <b>{days_remaining}</b>\n\n"
            f"Open EnergyIQ to see which appliances to reduce."
        )
        send_telegram_sync(msg)

        if db:
            _persist_notification(
                db, user_id, "Budget Alert ⚠️",
                f"Projected total Rs.{projected_cost:.0f} exceeds target Rs.{target_budget:.0f}", "danger"
            )

    # ── 4. Bill spike predicted ───────────────────────────────────────────────
    def on_spike_predicted(self, account_number: str, user_id: int,
                            spike_probability: float, predicted_high_kwh: float,
                            avg_kwh: float, db=None):
        if self._is_cooling_down(f"spike_{account_number}", minutes=24 * 60):
            return
        if spike_probability < 0.65:
            return  # only alert on high risk

        msg = (
            f"{SEVERITY_WARNING} <b>Bill Spike Risk — Next Month</b>\n\n"
            f"🏠 Account: <code>{account_number}</code>\n"
            f"📊 Spike probability: <b>{spike_probability*100:.0f}%</b>\n"
            f"📈 Predicted: up to <b>{predicted_high_kwh:.0f} kWh</b>\n"
            f"📉 Your average: <b>{avg_kwh:.0f} kWh</b>\n\n"
            f"Open EnergyIQ for tips to avoid the spike."
        )
        send_telegram_sync(msg)

    # ── 5. IoT session completed — appliance health ───────────────────────────
    def on_session_health(self, device_id: str, appliance_name: str,
                           health_score: int, verdict: str, user_id: int, db=None):
        if health_score >= 65:
            return   # only alert on problems

        icon = SEVERITY_DANGER if health_score < 40 else SEVERITY_WARNING
        msg = (
            f"{icon} <b>Appliance Health Alert</b>\n\n"
            f"📡 Device: <code>{device_id}</code>\n"
            f"🔌 Appliance: <b>{appliance_name}</b>\n"
            f"❤️ Health score: <b>{health_score}/100</b>\n"
            f"📋 Verdict: {verdict}\n\n"
            f"Consider servicing or replacing this appliance."
        )
        send_telegram_sync(msg)

        if db:
            _persist_notification(
                db, user_id, f"Health Alert: {appliance_name}",
                f"Score {health_score}/100 — {verdict}", "warning"
            )

    # ── 6. Test alert (for setup verification) ────────────────────────────────
    def send_test_alert(self, chat_id: Optional[str] = None) -> bool:
        msg = (
            f"{SEVERITY_SUCCESS} <b>EnergyIQ Alert System Active</b>\n\n"
            f"Your Telegram alerts are configured correctly.\n"
            f"You will now receive:\n"
            f"• Safety trip notifications\n"
            f"• Budget exceeded warnings\n"
            f"• Bill spike predictions\n"
            f"• Appliance health alerts\n\n"
            f"🕐 {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
        )
        if chat_id:
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.ensure_future(_send_telegram(chat_id, msg))
                    return True
                return loop.run_until_complete(_send_telegram(chat_id, msg))
            except Exception:
                return False
        return send_telegram_sync(msg) > 0


# ─── DB helper ────────────────────────────────────────────────────────────────

def _persist_notification(db, user_id, title, message, type_):
    """Save an in-app notification record."""
    try:
        from src.models.user import Notification
        n = Notification(user_id=user_id, title=title, message=message, type=type_)
        db.add(n)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to persist notification: {e}")


# Singleton
alert_engine = AlertEngine()