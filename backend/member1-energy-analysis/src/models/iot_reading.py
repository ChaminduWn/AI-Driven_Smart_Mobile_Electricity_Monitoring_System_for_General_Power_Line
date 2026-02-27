"""
models/iot_reading.py
Database models for storing live IoT meter readings from ESP32 PZEM-004T
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Index
from sqlalchemy.sql import func
from src.database import Base


class LiveMeterReading(Base):
    """Live meter readings from ESP32 via MQTT"""
    __tablename__ = "live_meter_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Device information
    account_number = Column(String(100), index=True, nullable=False)
    
    # Electrical readings
    voltage = Column(Float, nullable=False)  # V
    current = Column(Float, nullable=False)  # A
    power = Column(Float, nullable=False)    # W
    energy = Column(Float, nullable=False)   # kWh (total)
    frequency = Column(Float, nullable=False)  # Hz
    power_factor = Column(Float, nullable=False)  # 0.0-1.0
    
    # Session tracking
    session_kwh = Column(Float, nullable=False)  # kWh since startup
    session_cost_rs = Column(Float, nullable=False)  # Estimated cost in RS
    
    # Appliance detection & anomalies
    detected_appliance = Column(String(255), nullable=True)
    anomaly = Column(String(255), nullable=True)
    
    # Device status
    read_count = Column(Integer, nullable=False)  # Read number
    uptime_ms = Column(Integer, nullable=False)   # Device uptime in ms
    wifi_rssi = Column(Integer, nullable=False)   # WiFi signal strength
    
    # Raw JSON for extensibility
    raw_data = Column(JSON, nullable=True)
    
    # Timestamps
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Index for fast queries by account and time
    __table_args__ = (
        Index('ix_account_time', 'account_number', 'recorded_at'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'account_number': self.account_number,
            'voltage': round(self.voltage, 1),
            'current': round(self.current, 3),
            'power': round(self.power, 1),
            'energy': round(self.energy, 3),
            'frequency': round(self.frequency, 1),
            'power_factor': round(self.power_factor, 2),
            'session_kwh': round(self.session_kwh, 3),
            'session_cost_rs': round(self.session_cost_rs, 2),
            'detected_appliance': self.detected_appliance,
            'anomaly': self.anomaly,
            'read_count': self.read_count,
            'uptime_ms': self.uptime_ms,
            'wifi_rssi': self.wifi_rssi,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None,
        }
    
    def __repr__(self):
        return f"<LiveMeterReading(id={self.id}, account={self.account_number}, power={self.power}W)>"


class ApplianceEvent(Base):
    """Appliance change events detected by NILM"""
    __tablename__ = "appliance_events"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Device information
    account_number = Column(String(100), index=True, nullable=False)
    
    # Event information
    event_type = Column(String(50), default='appliance_change')
    from_appliance = Column(String(255), nullable=False)
    to_appliance = Column(String(255), nullable=False)
    watts = Column(Float, nullable=False)
    
    # Raw event data
    raw_data = Column(JSON, nullable=True)
    
    # Timestamps
    event_time = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Index for fast queries
    __table_args__ = (
        Index('ix_event_account_time', 'account_number', 'event_time'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'account_number': self.account_number,
            'event_type': self.event_type,
            'from': self.from_appliance,
            'to': self.to_appliance,
            'watts': round(self.watts, 1),
            'event_time': self.event_time.isoformat() if self.event_time else None,
        }
    
    def __repr__(self):
        return f"<ApplianceEvent(id={self.id}, {self.from_appliance} -> {self.to_appliance})>"
