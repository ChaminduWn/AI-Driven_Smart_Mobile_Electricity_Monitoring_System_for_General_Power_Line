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


@router.get("/member-types")
def get_default_member_types():
    """
    Predefined household member categories for the UI.
    Users can tick which ones they have and then enter exact ages.
    """
    categories = [
        {"code": "newborn", "label": "Newborn (0–1 year)", "suggested_age_range": [0, 1], "gender_options": ["male", "female"]},
        {"code": "toddler", "label": "Toddler (1–4 years)", "suggested_age_range": [1, 4], "gender_options": ["male", "female"]},
        {"code": "school_boy", "label": "School Boy (5–17)", "suggested_age_range": [5, 17], "gender_options": ["male"]},
        {"code": "school_girl", "label": "School Girl (5–17)", "suggested_age_range": [5, 17], "gender_options": ["female"]},
        {"code": "adult_male", "label": "Adult Male (18–59)", "suggested_age_range": [18, 59], "gender_options": ["male"]},
        {"code": "adult_female", "label": "Adult Female (18–59)", "suggested_age_range": [18, 59], "gender_options": ["female"]},
        {"code": "elder_male", "label": "Elderly Male (60+)", "suggested_age_range": [60, 100], "gender_options": ["male"]},
        {"code": "elder_female", "label": "Elderly Female (60+)", "suggested_age_range": [60, 100], "gender_options": ["female"]},
    ]
    return {"success": True, "categories": categories}


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