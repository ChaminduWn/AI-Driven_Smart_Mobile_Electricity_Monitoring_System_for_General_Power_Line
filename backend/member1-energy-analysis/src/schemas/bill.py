from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class MeterReading(BaseModel):
    date: str
    reading: int
    
class BillExtractRequest(BaseModel):
    file_name: str
    file_type: str

class BillExtractResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    bill_id: Optional[int] = None
    


class BillData(BaseModel):
    id: int
    account_number: Optional[str] = None
    bill_reference: Optional[str] = None
    title: Optional[str] = None
    is_manual: Optional[bool] = False
    is_active_for_dashboard: Optional[bool] = False
    bill_date: Optional[datetime] = None
    units_consumed: Optional[int] = None
    billing_period_days: Optional[int] = None
    total_charge: Optional[float] = None  # Changed from total_due
    
    # Meter Readings
    previous_reading: Optional[int] = None
    current_reading: Optional[int] = None
    previous_reading_date: Optional[datetime] = None
    current_reading_date: Optional[datetime] = None
    
    processing_status: str
    confidence_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class BillUpdate(BaseModel):
    account_number: Optional[str] = None
    title: Optional[str] = None
    is_manual: Optional[bool] = None
    is_active_for_dashboard: Optional[bool] = None
    bill_date: Optional[datetime] = None
    units_consumed: Optional[int] = None
    billing_period_days: Optional[int] = None
    total_charge: Optional[float] = None
    
    # Meter Readings update
    previous_reading: Optional[int] = None
    current_reading: Optional[int] = None
    previous_reading_date: Optional[datetime] = None
    current_reading_date: Optional[datetime] = None

class BillListResponse(BaseModel):
    success: bool
    count: int
    data: List[BillData]

class BillDetailResponse(BaseModel):
    success: bool
    data: BillData