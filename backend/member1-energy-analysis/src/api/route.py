from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import shutil
from datetime import datetime
from sqlalchemy import func

from src.database import get_db
from src.schemas.bill import (
    BillExtractResponse,
    BillListResponse,
    BillDetailResponse,
    BillData,
    BillUpdate,
)
from src.services.extractor import BillExtractionService
from src.models.bill import ElectricityBill
from src.models.user import User
from src.api.dependencies import get_user_from_token
from src.config import settings

router = APIRouter(prefix=settings.API_V1_PREFIX, tags=["bills"])


@router.post("/bills/extract", response_model=BillExtractResponse)
async def extract_bill(
    file: UploadFile = File(..., description="Bill file (PDF or image)"),
    title: Optional[str] = Form(None, description="Title/Name of the bill"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """Extract data from an uploaded electricity bill"""
    
    # Validate file type
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}",
        )

    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Save uploaded file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_name = f"{timestamp}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, file_name)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract bill data
        extraction_service = BillExtractionService()
        result = extraction_service.extract_bill_data(
            file_path=file_path,
            file_name=file.filename,
            file_type=file_ext,
            title=title,
            db=db,
            user_id=current_user.id
        )

        return BillExtractResponse(
            success=result["success"],
            message=result["message"],
            data=result.get("extracted_data"),
            bill_id=result.get("bill_id"),
        )

    except Exception as e:
        # Clean up file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bills", response_model=BillListResponse)
def get_all_bills(
    skip: int = 0,
    limit: int = 100,
    account_number: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """Get list of all bills for current user"""
    query = db.query(ElectricityBill).filter(ElectricityBill.user_id == current_user.id)

    if account_number:
        query = query.filter(ElectricityBill.account_number == account_number)

    count = query.count()
    bills = query.order_by(ElectricityBill.bill_date.desc()).all()  # ✅ Added ordering

    return BillListResponse(
        success=True,
        count=count,
        data=[BillData.from_orm(bill) for bill in bills],
    )


@router.get("/bills/{bill_id}", response_model=BillDetailResponse)
def get_bill_by_id(
    bill_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """Get detailed information about a specific bill"""
    bill = db.query(ElectricityBill).filter(
        ElectricityBill.id == bill_id,
        ElectricityBill.user_id == current_user.id
    ).first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    return BillDetailResponse(success=True, data=BillData.from_orm(bill))


@router.patch("/bills/{bill_id}", response_model=BillDetailResponse)
def update_bill(
    bill_id: int,
    request: BillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """Update specific fields of a bill"""
    bill = db.query(ElectricityBill).filter(
        ElectricityBill.id == bill_id,
        ElectricityBill.user_id == current_user.id
    ).first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    # Update only provided fields
    update_data = request.dict(exclude_unset=True)
    
    # If setting to active, deactivate all other bills for this account
    if update_data.get("is_active_for_dashboard") is True:
        db.query(ElectricityBill).filter(
            ElectricityBill.user_id == current_user.id,
            ElectricityBill.account_number == bill.account_number,
            ElectricityBill.id != bill_id
        ).update({"is_active_for_dashboard": False}, synchronize_session='fetch')
        
    for key, value in update_data.items():
        setattr(bill, key, value)

    try:
        db.commit()
        db.refresh(bill)
        return BillDetailResponse(success=True, data=BillData.from_orm(bill))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/bills/{bill_id}")
def delete_bill(
    bill_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """Delete a bill record"""
    bill = db.query(ElectricityBill).filter(
        ElectricityBill.id == bill_id,
        ElectricityBill.user_id == current_user.id
    ).first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    # Delete file
    if bill.file_path and os.path.exists(bill.file_path):
        os.remove(bill.file_path)

    db.delete(bill)
    db.commit()

    return {"success": True, "message": "Bill deleted successfully"}


@router.get("/bills/account/{account_number}", response_model=BillListResponse)
def get_bills_by_account(
    account_number: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """Get all bills for a specific account"""
    bills = (
        db.query(ElectricityBill)
        .filter(
            ElectricityBill.account_number == account_number,
            ElectricityBill.user_id == current_user.id
        )
        .order_by(ElectricityBill.bill_date.desc())
        .all()
    )

    return BillListResponse(
        success=True,
        count=len(bills),
        data=[BillData.from_orm(bill) for bill in bills],
    )


@router.get("/bills/stats/summary")
def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_from_token)
):
    """Get summary statistics for current user"""
    try:
        total_bills = db.query(ElectricityBill).filter(ElectricityBill.user_id == current_user.id).count()
        total_units = db.query(func.sum(ElectricityBill.units_consumed)).filter(ElectricityBill.user_id == current_user.id).scalar() or 0
        total_amount = db.query(func.sum(ElectricityBill.total_charge)).filter(ElectricityBill.user_id == current_user.id).scalar() or 0

        return {
            "success": True,
            "message": "Statistics retrieved successfully",
            "data": {
                "total_bills": total_bills,
                "total_units_consumed": int(total_units),
                "total_amount": float(total_amount),  # ✅ Changed name
                "average_units_per_bill": (
                    int(total_units / total_bills) if total_bills > 0 else 0
                ),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bills/backfill-readings")
def backfill_bill_readings(db: Session = Depends(get_db)):
    """
    Backfill previous_reading, current_reading, previous_reading_date, current_reading_date
    for bills that have extracted_data but null meter reading fields.
    Uses meter_readings and bill_date/units_consumed from extracted_data.
    """
    bills = (
        db.query(ElectricityBill)
        .filter(ElectricityBill.current_reading.is_(None), ElectricityBill.extracted_data.isnot(None))
        .all()
    )
    updated = 0
    for bill in bills:
        data = bill.extracted_data if isinstance(bill.extracted_data, dict) else None
        if not data:
            continue
        derived = BillExtractionService.derive_readings_from_parsed(data)
        if derived['current_reading'] is None:
            continue
        bill.previous_reading = derived['previous_reading']
        bill.current_reading = derived['current_reading']
        bill.previous_reading_date = derived['previous_reading_date']
        bill.current_reading_date = derived['current_reading_date']
        updated += 1
    db.commit()
    return {
        "success": True,
        "message": f"Backfilled meter readings for {updated} bill(s).",
        "updated_count": updated,
        "checked_count": len(bills),
    }