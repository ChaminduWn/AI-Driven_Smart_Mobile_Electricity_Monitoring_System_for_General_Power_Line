from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
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
)
from src.services.extractor import BillExtractionService
from src.models.bill import ElectricityBill
from src.config import settings

router = APIRouter(prefix=settings.API_V1_PREFIX, tags=["bills"])


@router.post("/bills/extract", response_model=BillExtractResponse)
async def extract_bill(
    file: UploadFile = File(..., description="Bill file (PDF or image)"),
    db: Session = Depends(get_db),
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
            db=db,
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
):
    """Get list of all bills with pagination"""
    query = db.query(ElectricityBill)

    if account_number:
        query = query.filter(ElectricityBill.account_number == account_number)

    count = query.count()
    bills = query.offset(skip).limit(limit).all()

    return BillListResponse(
        success=True,
        count=count,
        data=[BillData.from_orm(bill) for bill in bills],
    )


@router.get("/bills/{bill_id}", response_model=BillDetailResponse)
def get_bill_by_id(bill_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific bill"""
    bill = db.query(ElectricityBill).filter(ElectricityBill.id == bill_id).first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    return BillDetailResponse(success=True, data=BillData.from_orm(bill))


@router.delete("/bills/{bill_id}")
def delete_bill(bill_id: int, db: Session = Depends(get_db)):
    """Delete a bill record"""
    bill = db.query(ElectricityBill).filter(ElectricityBill.id == bill_id).first()

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    # Delete file
    if bill.file_path and os.path.exists(bill.file_path):
        os.remove(bill.file_path)

    db.delete(bill)
    db.commit()

    return {"success": True, "message": "Bill deleted successfully"}


@router.get("/bills/account/{account_number}", response_model=BillListResponse)
def get_bills_by_account(account_number: str, db: Session = Depends(get_db)):
    """Get all bills for a specific account"""
    bills = (
        db.query(ElectricityBill)
        .filter(ElectricityBill.account_number == account_number)
        .all()
    )

    return BillListResponse(
        success=True,
        count=len(bills),
        data=[BillData.from_orm(bill) for bill in bills],
    )


@router.get("/bills/stats/summary")
def get_statistics(db: Session = Depends(get_db)):
    """Get summary statistics"""
    try:
        total_bills = db.query(ElectricityBill).count()
        total_units = db.query(func.sum(ElectricityBill.units_consumed)).scalar() or 0
        total_amount = db.query(func.sum(ElectricityBill.total_due)).scalar() or 0

        return {
            "success": True,
            "message": "Statistics retrieved successfully",
            "data": {
                "total_bills": total_bills,
                "total_units_consumed": int(total_units),
                "total_amount_due": float(total_amount),
                "average_units_per_bill": (
                    int(total_units / total_bills) if total_bills > 0 else 0
                ),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


print("=" * 70)
print("POSTGRESQL-ONLY FILES READY!")
print("=" * 70)
print("\nKey changes from your original:")
print("1. .env - Fixed array syntax (no brackets)")
print("2. config.py - Added Optional type and list parsing")
print("3. database.py - PostgreSQL only (no SQLite)")
print("4. main.py - Better error handling for DB")
print("5. routes.py - Complete working version")
print("\n" + "=" * 70)