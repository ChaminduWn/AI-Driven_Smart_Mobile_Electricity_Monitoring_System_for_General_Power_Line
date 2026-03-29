"""
src/api/routes/analytics.py
Charts + Analytics Backend
===========================
Provides aggregated time-series data for frontend charts:
  - Daily/weekly/monthly consumption trends
  - Relay on/off timeline
  - Budget vs actual comparison
  - Spike risk trend over time
  - Power quality metrics over sessions
  - Alert configuration endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, cast, Date
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from src.database import get_db
from src.models.user import User
from src.models.bill import ElectricityBill
from src.models.budget_plan import BudgetPlan, MeterReading as PlanReading
from src.models.iot_reading import LiveMeterReading
from src.models.device_session import DeviceSession
from src.api.routes.auth import get_user_from_token
from src.services.alert_engine import alert_engine

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ── Request models ────────────────────────────────────────────────────────────

class TelegramConfigRequest(BaseModel):
    chat_id: str
    send_test: bool = True


# ─── 1. Bill history trend (line chart data) ──────────────────────────────────

@router.get("/bill-trend/{account_number}")
def bill_trend(
    account_number: str,
    months: int = Query(12, ge=3, le=36),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token),
):
    """
    Returns monthly kWh and cost for the last N months.
    Used for the main trend line chart on the dashboard.
    """
    cutoff = datetime.now() - timedelta(days=months * 31)
    bills = (
        db.query(ElectricityBill)
        .filter(
            ElectricityBill.user_id == current_user.id,
            ElectricityBill.account_number == account_number,
            ElectricityBill.bill_date >= cutoff,
            ElectricityBill.units_consumed.isnot(None),
        )
        .order_by(ElectricityBill.bill_date.asc())
        .all()
    )

    labels, kwh_data, cost_data, daily_avg_data = [], [], [], []

    for b in bills:
        label = b.bill_date.strftime("%b %Y") if b.bill_date else "?"
        labels.append(label)
        kwh_data.append(b.units_consumed or 0)
        cost_data.append(round(b.total_charge or 0, 2))
        days = b.billing_period_days or 30
        daily_avg_data.append(round((b.units_consumed or 0) / days, 2))

    # Compute 3-month moving average for spike overlay
    ma3 = []
    for i in range(len(kwh_data)):
        window = kwh_data[max(0, i-2) : i+1]
        ma3.append(round(sum(window) / len(window), 1))

    return {
        "success": True,
        "account_number": account_number,
        "labels": labels,
        "datasets": {
            "kwh": kwh_data,
            "cost": cost_data,
            "daily_average": daily_avg_data,
            "moving_avg_3m": ma3,
        },
        "summary": {
            "avg_monthly_kwh": round(sum(kwh_data) / len(kwh_data), 1) if kwh_data else 0,
            "avg_monthly_cost": round(sum(cost_data) / len(cost_data), 2) if cost_data else 0,
            "peak_kwh": max(kwh_data, default=0),
            "min_kwh": min(kwh_data, default=0),
            "total_spent": round(sum(cost_data), 2),
        },
    }


# ─── 2. Budget plan tracking chart ────────────────────────────────────────────

@router.get("/budget-chart/{plan_id}")
def budget_chart(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token),
):
    """
    Returns actual vs target cost data over the budget plan period.
    Used for the tracking screen's progress chart.
    """
    plan = db.query(BudgetPlan).filter(
        BudgetPlan.id == plan_id,
        BudgetPlan.user_id == current_user.id,
    ).first()
    if not plan:
        raise HTTPException(404, "Plan not found")

    readings = (
        db.query(PlanReading)
        .filter(PlanReading.budget_plan_id == plan_id)
        .order_by(PlanReading.reading_date.asc())
        .all()
    )

    # Build day-by-day target line
    total_days = plan.planning_days
    daily_target_cost = plan.target_daily_cost

    target_labels = [f"Day {d}" for d in range(0, total_days + 1, max(1, total_days // 10))]
    target_values = [round(d * daily_target_cost, 2) for d in range(0, total_days + 1, max(1, total_days // 10))]

    # Actual reading points
    actual_labels = ["Day 0"] + [f"Day {r.days_elapsed}" for r in readings]
    actual_values = [0.0]     + [round(r.actual_cost_so_far or 0, 2) for r in readings]
    projected_values = [None] + [round(r.projected_total_cost or 0, 2) for r in readings]

    return {
        "success": True,
        "plan_id": plan_id,
        "target_budget": plan.target_budget,
        "planning_days": total_days,
        "plan_start": plan.plan_start_date.isoformat() if plan.plan_start_date else None,
        "plan_end": plan.plan_end_date.isoformat()   if plan.plan_end_date   else None,
        "target_line": {"labels": target_labels, "values": target_values},
        "actual_line": {"labels": actual_labels, "values": actual_values},
        "projected_values": projected_values,
        "reading_statuses": ["on_track"] + [r.status for r in readings],
    }


# ─── 3. IoT live readings chart (last N minutes) ──────────────────────────────

@router.get("/live-chart/{device_id}")
def live_chart(
    device_id: str,
    minutes: int = Query(30, ge=5, le=120),
    current_user: User = Depends(get_user_from_token),
):
    """
    Returns recent live power readings for the real-time chart.
    Reads from in-memory history (no DB query — instant response).
    """
    from src.services.iot_service import reading_history, latest_readings
    from collections import deque

    history = list((reading_history.get(device_id) or []))[-(minutes * 12):]

    timestamps, power_vals, voltage_vals, pf_vals = [], [], [], []
    for r in history:
        ts = r.get("server_time") or r.get("recorded_at", "")
        timestamps.append(ts[-8:] if len(ts) >= 8 else ts)  # HH:MM:SS
        power_vals.append(round(r.get("power_w") or r.get("power") or 0, 1))
        voltage_vals.append(round(r.get("voltage") or 0, 1))
        pf_vals.append(round(r.get("power_factor") or 0, 3))

    latest = latest_readings.get(device_id) or {}

    return {
        "success": True,
        "device_id": device_id,
        "data_points": len(timestamps),
        "labels": timestamps,
        "power_w": power_vals,
        "voltage": voltage_vals,
        "power_factor": pf_vals,
        "latest": {
            "power_w": latest.get("power_w") or latest.get("power", 0),
            "voltage": latest.get("voltage", 0),
            "relay_on": latest.get("relay_on", False),
            "safety_tripped": latest.get("safety_tripped", False),
        },
    }


# ─── 4. Session history chart (per-appliance) ─────────────────────────────────

@router.get("/session-history")
def session_history(
    account_number: Optional[str] = None,
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token),
):
    """
    Returns completed IoT test sessions with avg power, health score, cost.
    Used for the per-appliance efficiency history chart.
    """
    q = db.query(DeviceSession).filter(
        DeviceSession.user_id == current_user.id,
        DeviceSession.status == "completed",
    )
    if account_number:
        q = q.filter(DeviceSession.account_number == account_number)

    sessions = q.order_by(DeviceSession.ended_at.desc()).limit(limit).all()

    rows = []
    for s in sessions:
        import json as _json
        health = {}
        try:
            health = _json.loads(s.health_assessment or "{}")
        except Exception:
            pass
        rows.append({
            "session_id":      s.id,
            "appliance_name":  s.appliance_name,
            "ended_at":        s.ended_at.isoformat() if s.ended_at else None,
            "avg_power_w":     round(s.avg_power_w or 0, 1),
            "peak_power_w":    round(s.peak_power_w or 0, 1),
            "health_score":    health.get("health_score"),
            "session_kwh":     round(s.total_session_kwh or 0, 4),
            "session_cost_rs": round(s.total_cost_rs or 0, 2),
            "duration_min":    round(s.actual_duration_min or 0, 1),
            "status":          health.get("status", "UNKNOWN"),
            "fault_detected":  s.fault_detected,
        })

    # Group by appliance for comparison chart
    by_appliance: dict = {}
    for r in rows:
        name = r["appliance_name"] or "Unknown"
        if name not in by_appliance:
            by_appliance[name] = []
        by_appliance[name].append(r)

    return {
        "success":        True,
        "sessions":       rows,
        "by_appliance":   by_appliance,
        "total_sessions": len(rows),
    }


# ─── 5. Power quality overview ────────────────────────────────────────────────

@router.get("/power-quality/{account_number}")
def power_quality_overview(
    account_number: str,
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token),
):
    """
    Aggregates power quality metrics from live readings for the last N days.
    Returns hourly averages for voltage, PF, and frequency.
    """
    cutoff = datetime.now() - timedelta(days=days)
    readings = (
        db.query(LiveMeterReading)
        .filter(
            LiveMeterReading.account_number == account_number,
            LiveMeterReading.recorded_at >= cutoff,
        )
        .order_by(LiveMeterReading.recorded_at.asc())
        .all()
    )

    if not readings:
        return {"success": False, "message": "No IoT readings in this period"}

    voltages = [r.voltage for r in readings if r.voltage]
    pfs      = [r.power_factor for r in readings if r.power_factor]
    powers   = [r.power for r in readings if r.power]

    def safe_avg(lst):
        return round(sum(lst) / len(lst), 2) if lst else 0

    anomaly_count = sum(
        1 for r in readings
        if r.raw_data and r.raw_data.get("anomaly")
    )

    # Hourly buckets for chart
    hourly: dict = {}
    for r in readings:
        hour_key = r.recorded_at.strftime("%Y-%m-%d %H:00")
        if hour_key not in hourly:
            hourly[hour_key] = {"voltage": [], "pf": [], "power": []}
        if r.voltage:    hourly[hour_key]["voltage"].append(r.voltage)
        if r.power_factor: hourly[hour_key]["pf"].append(r.power_factor)
        if r.power:      hourly[hour_key]["power"].append(r.power)

    hourly_labels, hourly_voltage, hourly_pf, hourly_power = [], [], [], []
    for label, vals in sorted(hourly.items())[-48:]:  # last 48 hours
        hourly_labels.append(label[-5:])  # HH:00
        hourly_voltage.append(safe_avg(vals["voltage"]))
        hourly_pf.append(safe_avg(vals["pf"]))
        hourly_power.append(safe_avg(vals["power"]))

    return {
        "success": True,
        "account_number": account_number,
        "period_days": days,
        "total_readings": len(readings),
        "anomaly_count": anomaly_count,
        "averages": {
            "voltage": safe_avg(voltages),
            "power_factor": safe_avg(pfs),
            "power_w": safe_avg(powers),
            "voltage_stability": round(
                (1 - (max(voltages) - min(voltages)) / 230) * 100, 1
            ) if voltages else 0,
        },
        "chart": {
            "labels": hourly_labels,
            "voltage": hourly_voltage,
            "power_factor": hourly_pf,
            "power_w": hourly_power,
        },
        "voltage_range": {
            "min": min(voltages) if voltages else 0,
            "max": max(voltages) if voltages else 0,
        },
    }


# ─── 6. Alert configuration ───────────────────────────────────────────────────

@router.post("/alerts/configure-telegram")
def configure_telegram(
    req: TelegramConfigRequest,
    current_user: User = Depends(get_user_from_token),
):
    """
    Save a Telegram chat ID for this user and optionally send a test message.
    In production store chat_id in the user profile table.
    For now relies on the environment variable TELEGRAM_CHAT_IDS.
    """
    result = {"success": True, "chat_id": req.chat_id}

    if req.send_test:
        sent = alert_engine.send_test_alert(chat_id=req.chat_id)
        result["test_sent"] = sent
        result["message"] = (
            "Test alert sent! Check your Telegram." if sent
            else "Could not send test — check TELEGRAM_BOT_TOKEN in .env"
        )
    else:
        result["message"] = "Chat ID saved. Enable send_test to verify."

    return result


@router.post("/alerts/test")
def send_test_alert(
    current_user: User = Depends(get_user_from_token),
):
    """Broadcast a test alert to all configured Telegram chat IDs."""
    sent = alert_engine.send_test_alert()
    return {
        "success": sent,
        "message": "Test alert sent" if sent else "No Telegram chat IDs configured or MQTT error",
    }


# ─── 7. Dashboard summary ─────────────────────────────────────────────────────

@router.get("/dashboard/{account_number}")
def dashboard_summary(
    account_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token),
):
    """
    Single endpoint for the home dashboard — aggregates key metrics.
    """
    from src.services.iot_service import latest_readings, last_seen
    from datetime import timezone

    # Latest bill
    latest_bill = (
        db.query(ElectricityBill)
        .filter(
            ElectricityBill.user_id == current_user.id,
            ElectricityBill.account_number == account_number,
        )
        .order_by(ElectricityBill.bill_date.desc())
        .first()
    )

    # Active budget plan
    active_plan = (
        db.query(BudgetPlan)
        .filter(
            BudgetPlan.user_id == current_user.id,
            BudgetPlan.account_number == account_number,
            BudgetPlan.is_active == True,
        )
        .first()
    )

    # Latest meter reading for active plan
    latest_reading = None
    if active_plan:
        latest_reading = (
            db.query(PlanReading)
            .filter(PlanReading.budget_plan_id == active_plan.id)
            .order_by(PlanReading.reading_date.desc())
            .first()
        )

    # Online devices
    now = datetime.now(timezone.utc)
    online_devices = [
        did for did, ts in last_seen.items()
        if (now - ts).total_seconds() < 30
    ]

    # Live power from first online device (if any)
    live_power = 0
    relay_on = False
    for did in online_devices:
        d = latest_readings.get(did, {})
        live_power = d.get("power_w") or d.get("power") or 0
        relay_on   = d.get("relay_on", False)
        break

    return {
        "success": True,
        "account_number": account_number,
        "latest_bill": {
            "units": latest_bill.units_consumed if latest_bill else None,
            "cost": latest_bill.total_charge if latest_bill else None,
            "date": latest_bill.bill_date.isoformat() if latest_bill and latest_bill.bill_date else None,
        } if latest_bill else None,
        "budget_plan": {
            "target": active_plan.target_budget if active_plan else None,
            "status": active_plan.current_progress_status if active_plan else None,
            "days_left": (
                (active_plan.plan_end_date - datetime.now()).days
                if active_plan and active_plan.plan_end_date else None
            ),
            "actual_cost": latest_reading.actual_cost_so_far if latest_reading else None,
            "projected_cost": latest_reading.projected_total_cost if latest_reading else None,
        } if active_plan else None,
        "iot": {
            "online_devices": len(online_devices),
            "device_ids": online_devices,
            "live_power_w": round(live_power, 1),
            "relay_on": relay_on,
        },
    }