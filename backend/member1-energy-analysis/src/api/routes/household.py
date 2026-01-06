"""
src/api/routes/household.py
Household Member Management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from src.database import get_db
from src.models.budget_plan import HouseholdMember

router = APIRouter(prefix="/household", tags=["Household Management"])


class HouseholdMemberCreate(BaseModel):
    account_number: str
    member_type: str
    occupation_status: str
    age: int
    weekday_hours_at_home: float = 12
    weekend_hours_at_home: float = 24


@router.post("/members")
def add_household_member(
    member: HouseholdMemberCreate,
    db: Session = Depends(get_db)
):
    """Add a household member"""
    try:
        member_record = HouseholdMember(
            account_number=member.account_number,
            member_type=member.member_type,
            age=member.age,
            occupation_status=member.occupation_status,
            weekday_hours_at_home=member.weekday_hours_at_home,
            weekend_hours_at_home=member.weekend_hours_at_home
        )
        
        db.add(member_record)
        db.commit()
        db.refresh(member_record)
        
        return {
            'success': True,
            'message': 'Household member added successfully',
            'member': {
                'id': member_record.id,
                'member_type': member_record.member_type,
                'age': member_record.age,
                'occupation_status': member_record.occupation_status
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/members/{account_number}")
def get_household_members(
    account_number: str,
    db: Session = Depends(get_db)
):
    """Get all household members for an account"""
    members = db.query(HouseholdMember).filter(
        HouseholdMember.account_number == account_number
    ).all()
    
    return {
        'success': True,
        'count': len(members),
        'members': [
            {
                'id': m.id,
                'member_type': m.member_type,
                'age': m.age,
                'occupation_status': m.occupation_status,
                'weekday_hours_at_home': m.weekday_hours_at_home,
                'weekend_hours_at_home': m.weekend_hours_at_home
            }
            for m in members
        ]
    }


@router.delete("/members/{member_id}")
def delete_household_member(
    member_id: int,
    db: Session = Depends(get_db)
):
    """Delete a household member"""
    member = db.query(HouseholdMember).filter(
        HouseholdMember.id == member_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    try:
        db.delete(member)
        db.commit()
        return {'success': True, 'message': 'Member deleted'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))