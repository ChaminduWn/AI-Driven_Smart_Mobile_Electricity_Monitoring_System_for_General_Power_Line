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
    bill_date: Optional[datetime] = None
    units_consumed: Optional[int] = None
    billing_period_days: Optional[int] = None
    total_due: Optional[float] = None
    processing_status: str
    confidence_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class BillListResponse(BaseModel):
    success: bool
    count: int
    data: List[BillData]

class BillDetailResponse(BaseModel):
    success: bool
    data: BillData