"""
src/models/device_session.py
============================
SQLAlchemy models for EnergyIQ IoT appliance testing.
"""

import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, BigInteger, Float, Boolean,
    String, Text, DateTime, ForeignKey, Index,
)
from sqlalchemy.orm import relationship

from src.database import Base


# ─────────────────────────────────────────────────────────────────────────────
class DeviceSession(Base):
    """One complete appliance test session."""
    __tablename__ = "device_sessions"

    id             = Column(Integer,  primary_key=True, index=True)
    user_id        = Column(Integer,  ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id      = Column(String(64), nullable=False, index=True)
    account_number = Column(String(64), nullable=False, index=True)

    appliance_name        = Column(String(256))
    appliance_brand       = Column(String(256))
    appliance_description = Column(Text)

    status              = Column(String(32),  default="active")
    test_duration_min   = Column(Integer)
    actual_duration_min = Column(Float)
    started_at          = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at            = Column(DateTime(timezone=True))

    total_readings    = Column(Integer, default=0)
    avg_power_w       = Column(Float,   default=0)
    peak_power_w      = Column(Float,   default=0)
    min_voltage_v     = Column(Float)
    max_voltage_v     = Column(Float)
    avg_power_factor  = Column(Float)
    avg_pq_score      = Column(Float)
    total_session_kwh = Column(Float,  default=0)
    total_cost_rs     = Column(Float,   default=0)

    avg_temperature = Column(Float)
    avg_humidity    = Column(Float)

    dataset_json  = Column(Text)
    dataset_count = Column(Integer, default=0)

    health_assessment = Column(Text)
    fault_detected    = Column(Boolean, default=False)

    ai_summary         = Column(Text)
    ai_recommendations = Column(Text)
    comparison_note    = Column(Text)

    readings = relationship("DeviceReading",        back_populates="session", cascade="all, delete-orphan")
    events   = relationship("DeviceApplianceEvent", back_populates="session", cascade="all, delete-orphan")

    def to_dict(self, include_dataset: bool = False) -> dict:
        health  = {}
        ai_recs = []
        try:
            if self.health_assessment:
                health = json.loads(self.health_assessment)
        except Exception:
            pass
        try:
            if self.ai_recommendations:
                ai_recs = json.loads(self.ai_recommendations)
        except Exception:
            pass

        d = {
            "id":                    self.id,
            "device_id":             self.device_id,
            "account_number":        self.account_number,
            "appliance_name":        self.appliance_name,
            "appliance_brand":       self.appliance_brand,
            "appliance_description": self.appliance_description,
            "status":                self.status,
            "test_duration_min":     self.test_duration_min,
            "actual_duration_min":   self.actual_duration_min,
            "started_at":            self.started_at.isoformat() if self.started_at else None,
            "ended_at":              self.ended_at.isoformat()   if self.ended_at   else None,
            "total_readings":        self.total_readings,
            "avg_power_w":           self.avg_power_w,
            "peak_power_w":          self.peak_power_w,
            "min_voltage_v":         self.min_voltage_v,
            "max_voltage_v":         self.max_voltage_v,
            "avg_power_factor":      self.avg_power_factor,
            "avg_pq_score":          self.avg_pq_score,
            "total_session_kwh":     self.total_session_kwh,
            "total_cost_rs":         self.total_cost_rs,
            "avg_temperature":       self.avg_temperature,
            "avg_humidity":          self.avg_humidity,
            "dataset_count":         self.dataset_count,
            "health_assessment":     health,
            "fault_detected":        self.fault_detected,
            "ai_analysis": {
                "summary":         self.ai_summary,
                "recommendations": ai_recs,
                "comparison":      self.comparison_note,
            },
        }

        if include_dataset and self.dataset_json:
            try:
                d["dataset"] = json.loads(self.dataset_json)
            except Exception:
                d["dataset"] = []

        return d


# ─────────────────────────────────────────────────────────────────────────────
class DeviceReading(Base):
    """Single 5-second reading from PZEM-004T + DHT22."""
    __tablename__ = "device_readings"

    id             = Column(Integer,  primary_key=True, index=True)
    session_id     = Column(Integer,  ForeignKey("device_sessions.id", ondelete="CASCADE"), nullable=False)
    device_id      = Column(String(64), nullable=False)
    account_number = Column(String(64))
    recorded_at    = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    voltage      = Column(Float)
    current_a    = Column(Float)
    power_w      = Column(Float)
    energy_kwh   = Column(Float)
    frequency_hz = Column(Float)
    power_factor = Column(Float)

    apparent_power_va  = Column(Float)
    reactive_power_var = Column(Float)
    resistance_ohm     = Column(Float)
    voltage_deviation  = Column(Float)
    voltage_dev_pct    = Column(Float)

    power_quality_score = Column(Float)
    efficiency_class    = Column(String(16))

    session_kwh      = Column(Float)
    session_cost_rs  = Column(Float)
    session_minutes  = Column(Float)
    avg_power_w      = Column(Float)
    peak_power_w     = Column(Float)
    avg_power_factor = Column(Float)

    detected_appliance = Column(String(128))
    anomaly            = Column(Text)

    temperature_c = Column(Float)
    humidity_pct  = Column(Float)
    heat_index_c  = Column(Float)

    wifi_rssi  = Column(Integer)
    read_count = Column(Integer)
    uptime_ms  = Column(BigInteger)

    session = relationship("DeviceSession", back_populates="readings")

    def to_dict(self) -> dict:
        return {
            "id":                  self.id,
            "session_id":          self.session_id,
            "device_id":           self.device_id,
            "recorded_at":         self.recorded_at.isoformat() if self.recorded_at else None,
            "voltage":             self.voltage,
            "current_a":           self.current_a,
            "power_w":             self.power_w,
            "energy_kwh":          self.energy_kwh,
            "frequency_hz":        self.frequency_hz,
            "power_factor":        self.power_factor,
            "apparent_power_va":   self.apparent_power_va,
            "reactive_power_var":  self.reactive_power_var,
            "resistance_ohm":      self.resistance_ohm,
            "voltage_dev_pct":     self.voltage_dev_pct,
            "power_quality_score": self.power_quality_score,
            "efficiency_class":    self.efficiency_class,
            "session_kwh":         self.session_kwh,
            "session_cost_rs":     self.session_cost_rs,
            "session_minutes":     self.session_minutes,
            "avg_power_w":         self.avg_power_w,
            "peak_power_w":        self.peak_power_w,
            "detected_appliance":  self.detected_appliance,
            "anomaly":             self.anomaly,
            "temperature_c":       self.temperature_c,
            "humidity_pct":        self.humidity_pct,
            "heat_index_c":        self.heat_index_c,
            "wifi_rssi":           self.wifi_rssi,
            "read_count":          self.read_count,
            "uptime_ms":           self.uptime_ms,
        }


# ─────────────────────────────────────────────────────────────────────────────
class DeviceApplianceEvent(Base):
    __tablename__ = "device_appliance_events"

    id             = Column(Integer, primary_key=True, index=True)
    session_id     = Column(Integer, ForeignKey("device_sessions.id", ondelete="CASCADE"))
    device_id      = Column(String(64), nullable=False)
    account_number = Column(String(64))
    from_appliance = Column(String(128))
    to_appliance   = Column(String(128))
    watts          = Column(Float)
    event_time     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session = relationship("DeviceSession", back_populates="events")

    def to_dict(self) -> dict:
        return {
            "id":             self.id,
            "session_id":     self.session_id,
            "device_id":      self.device_id,
            "from_appliance": self.from_appliance,
            "to_appliance":   self.to_appliance,
            "watts":          self.watts,
            "event_time":     self.event_time.isoformat() if self.event_time else None,
        }


Index("idx_device_readings_session",  DeviceReading.session_id)
Index("idx_device_readings_device",   DeviceReading.device_id)
Index("idx_device_readings_recorded", DeviceReading.recorded_at)
Index("idx_dae_session",              DeviceApplianceEvent.session_id)
Index("idx_dae_device",               DeviceApplianceEvent.device_id)