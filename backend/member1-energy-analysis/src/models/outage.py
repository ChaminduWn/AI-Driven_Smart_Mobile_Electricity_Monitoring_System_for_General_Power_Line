from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, JSON, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
import uuid

from src.database import Base

class BoardReportStatus(str, enum.Enum):
    REPORTED = "Reported"
    WORKING_ON_IT = "WorkingOnIt"
    DONE = "Done"

class JobStatus(str, enum.Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    IN_PROGRESS = "InProgress"
    PAYMENT_PENDING = "PaymentPending"
    AWAITING_CONFIRMATION = "AwaitingTechnicianConfirmation"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class PaymentMethod(str, enum.Enum):
    CASH = "Cash"
    DIGITAL = "Digital"

class DigitalPaymentStatus(str, enum.Enum):
    PENDING = "Pending"
    PAID = "Paid"
    CONFIRMED = "Confirmed"

class BoardReport(Base):
    """Outage reports submitted to the electricity board (from Member 2)"""
    __tablename__ = "board_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    householder_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    category_id = Column(String(100), nullable=False)
    category_title = Column(String(255), nullable=False)
    issue_points = Column(JSON, nullable=False, default=[]) # List of strings
    
    address = Column(Text, nullable=False)
    district = Column(String(100), nullable=True)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    
    issue_photos = Column(JSON, nullable=False, default=[]) # List of URLs
    
    status = Column(SQLEnum(BoardReportStatus), default=BoardReportStatus.REPORTED, nullable=False)
    status_message = Column(String(255), default="Issue reported to the electricity board")
    admin_notes = Column(Text, nullable=True)
    
    status_updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    householder = relationship("User", backref="board_reports")

class Job(Base):
    """Jobs assigned to electricians for specific outage tasks (from Member 2)"""
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    householder_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    electrician_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    service_id = Column(String(100), nullable=True)
    service_name = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    
    issue_address = Column(String(500), nullable=True)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    district = Column(String(100), nullable=False)
    
    category = Column(String(100), nullable=True)
    sub_category = Column(String(100), nullable=True)
    
    status = Column(SQLEnum(JobStatus), default=JobStatus.PENDING)
    issue_photos = Column(JSON, nullable=True, default=[])
    
    start_code = Column(String(4), nullable=True)
    
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    start_code_verified_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancellation_reason = Column(String(255), nullable=True)
    
    travel_fee_applied = Column(Boolean, default=False)
    estimated_cost = Column(Float, nullable=True)
    
    electrician_travel_distance_km = Column(Float, nullable=True)
    electrician_location_lat = Column(Float, nullable=True)
    electrician_location_lng = Column(Float, nullable=True)
    electrician_travel_duration_minutes = Column(Integer, nullable=True)
    
    final_cost = Column(Float, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    payment_method = Column(SQLEnum(PaymentMethod), nullable=True)
    digital_payment_status = Column(SQLEnum(DigitalPaymentStatus), nullable=True)
    digital_payment_amount = Column(Float, nullable=True)
    digital_payment_reference = Column(String(255), nullable=True)
    digital_payment_meta = Column(JSON, nullable=True)
    digital_paid_at = Column(DateTime(timezone=True), nullable=True)
    payment_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    
    householder_rating = Column(Float, nullable=True)
    householder_feedback = Column(Text, nullable=True)
    rated_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    householder = relationship("User", foreign_keys=[householder_id], backref="requested_jobs")
    electrician = relationship("User", foreign_keys=[electrician_id], backref="assigned_jobs")

class Message(Base):
    """Chat messages between householder and electrician for a specific job (from Member 2)"""
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    text = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    job = relationship("Job", backref="messages")
    sender = relationship("User")
