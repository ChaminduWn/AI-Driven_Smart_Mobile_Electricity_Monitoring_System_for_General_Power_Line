"""
ML Prediction API Routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Optional
from src.services.ml_predictor import get_predictor
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ml", tags=["ML Predictions"])


class ApplianceSet(BaseModel):
    has_ac: bool = False
    has_tv: bool = True
    has_refrigerator: bool = True
    has_washing_machine: bool = True
    has_water_heater: bool = False
    has_electric_oven: bool = False
    has_rice_cooker: bool = True
    has_iron: bool = True
    has_desktop: bool = False
    has_water_pump: bool = False
    has_ceiling_fan: bool = True


class HouseholdPredictionRequest(BaseModel):
    house_type: str = Field("Single-story house", description="Type of house")
    total_people: int = Field(..., ge=1, le=15, description="Total people in household")
    num_males: int = Field(0, ge=0, description="Number of males")
    num_females: int = Field(0, ge=0, description="Number of females")
    num_children_4_17: int = Field(0, ge=0, description="Children aged 4-17")
    num_preschool: int = Field(0, ge=0, description="Preschool children (3-5)")
    num_toddlers: int = Field(0, ge=0, description="Toddlers (0-2)")
    num_elderly: int = Field(0, ge=0, description="Elderly (60+)")
    appliances: ApplianceSet


@router.post("/predict-consumption")
def predict_household_consumption(request: HouseholdPredictionRequest):
    """
    🔮 Predict monthly electricity consumption using AI
    
    Uses a trained Random Forest model to predict consumption based on:
    - Household composition (people, ages)
    - House type
    - Registered appliances
    
    Returns prediction with confidence interval and personalized recommendations.
    """
    try:
        predictor = get_predictor()
        
        # Convert request to dict
        household_data = {
            'house_type': request.house_type,
            'total_people': request.total_people,
            'num_males': request.num_males,
            'num_females': request.num_females,
            'num_children_4_17': request.num_children_4_17,
            'num_preschool': request.num_preschool,
            'num_toddlers': request.num_toddlers,
            'num_elderly': request.num_elderly,
            'appliances': request.appliances.dict()
        }
        
        # Get prediction
        result = predictor.predict(household_data)
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=result.get('error', 'Prediction failed'))
        
        return {
            'success': True,
            'message': f"Households like yours typically consume {result['predicted_kwh']} kWh/month",
            'prediction': result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-info")
def get_model_info():
    """Get information about the trained model"""
    try:
        predictor = get_predictor()
        
        return {
            'success': True,
            'model': {
                'type': 'Random Forest Regressor',
                'accuracy': predictor.metrics,
                'features_used': len(predictor.feature_names),
                'top_features': predictor.get_feature_importance()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))