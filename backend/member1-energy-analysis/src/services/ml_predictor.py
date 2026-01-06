"""
ML-powered Household Consumption Predictor
"""
import joblib
import numpy as np
from typing import Dict, List
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Model paths
MODEL_DIR = Path(__file__).parent.parent.parent / 'ml_models' / 'trained_models'
MODEL_PATH = MODEL_DIR / 'consumption_predictor.pkl'
ENCODERS_PATH = MODEL_DIR / 'encoders.pkl'


class ConsumptionPredictor:
    """AI-powered household consumption predictor"""
    
    def __init__(self):
        """Load trained model and encoders"""
        try:
            logger.info("Loading ML model...")
            
            # Load model
            model_data = joblib.load(MODEL_PATH)
            self.model = model_data['model']
            self.feature_names = model_data['feature_names']
            self.metrics = model_data['metrics']
            self.feature_importance = model_data['feature_importance']
            
            # Load encoders
            encoders = joblib.load(ENCODERS_PATH)
            self.house_type_encoder = encoders['house_type']
            
            logger.info(f"✅ Model loaded: {model_data['model_name']}")
            logger.info(f"   R²: {self.metrics['r2']:.3f}")
            logger.info(f"   MAE: {self.metrics['mae']:.2f} kWh")
            
        except Exception as e:
            logger.error(f"Failed to load ML model: {e}")
            raise
    
    def predict(self, household_data: Dict) -> Dict:
        """
        Predict monthly consumption for a household
        
        Args:
            household_data: {
                'house_type': 'Single-story house',
                'total_people': 4,
                'num_males': 2,
                'num_females': 2,
                'num_children_4_17': 1,
                'num_preschool': 0,
                'num_toddlers': 0,
                'num_elderly': 0,
                'appliances': {
                    'has_ac': True,
                    'has_tv': True,
                    'has_refrigerator': True,
                    'has_washing_machine': True,
                    'has_water_heater': False,
                    'has_electric_oven': False,
                    'has_rice_cooker': True,
                    'has_iron': True,
                    'has_desktop': True,
                    'has_water_pump': True,
                    'has_ceiling_fan': True
                }
            }
        
        Returns:
            {
                'predicted_kwh': 105.3,
                'confidence_interval': {'min': 95.2, 'max': 115.4},
                'confidence_level': 'high',
                'comparison': {...},
                'recommendations': [...]
            }
        """
        try:
            # Calculate derived features
            total_children = (
                household_data.get('num_children_4_17', 0) +
                household_data.get('num_preschool', 0) +
                household_data.get('num_toddlers', 0)
            )
            
            adults = household_data['total_people'] - total_children
            people_per_adult = household_data['total_people'] / (adults + 1)
            
            # Count appliances
            appliances = household_data.get('appliances', {})
            total_appliances = sum(1 for v in appliances.values() if v)
            
            # Encode house type
            house_type_encoded = self.house_type_encoder.transform(
                [household_data.get('house_type', 'Single-story house')]
            )[0]
            
            # Prepare feature vector
            features = np.array([[
                household_data['total_people'],
                household_data['num_males'],
                household_data['num_females'],
                total_children,
                household_data.get('num_elderly', 0),
                adults,
                people_per_adult,
                house_type_encoded,
                int(appliances.get('has_ac', False)),
                int(appliances.get('has_tv', False)),
                int(appliances.get('has_refrigerator', False)),
                int(appliances.get('has_washing_machine', False)),
                int(appliances.get('has_water_heater', False)),
                int(appliances.get('has_electric_oven', False)),
                int(appliances.get('has_rice_cooker', False)),
                int(appliances.get('has_iron', False)),
                int(appliances.get('has_desktop', False)),
                int(appliances.get('has_water_pump', False)),
                int(appliances.get('has_ceiling_fan', False)),
                total_appliances
            ]])
            
            # Predict
            prediction = self.model.predict(features)[0]
            
            # Calculate confidence interval using tree predictions
            if hasattr(self.model, 'estimators_'):
                tree_predictions = np.array([
                    tree.predict(features)[0] 
                    for tree in self.model.estimators_
                ])
                lower_bound = np.percentile(tree_predictions, 10)
                upper_bound = np.percentile(tree_predictions, 90)
            else:
                # Fallback for non-ensemble models
                margin = prediction * 0.15
                lower_bound = prediction - margin
                upper_bound = prediction + margin
            
            confidence_range = upper_bound - lower_bound
            confidence_level = 'high' if confidence_range < 30 else 'medium' if confidence_range < 50 else 'low'
            
            # Generate comparison insights
            comparison = self._generate_comparison(household_data, prediction)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(household_data, prediction)
            
            return {
                'success': True,
                'predicted_kwh': round(prediction, 1),
                'confidence_interval': {
                    'min': round(lower_bound, 1),
                    'max': round(upper_bound, 1)
                },
                'confidence_level': confidence_level,
                'model_accuracy': {
                    'r2_score': round(self.metrics['r2'], 3),
                    'mae': round(self.metrics['mae'], 1)
                },
                'comparison': comparison,
                'recommendations': recommendations
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_comparison(self, household_data: Dict, predicted_kwh: float) -> Dict:
        """Generate comparison with typical households"""
        total_people = household_data['total_people']
        
        # Rough benchmarks based on household size
        benchmarks = {
            1: {'avg': 50, 'min': 30, 'max': 80},
            2: {'avg': 70, 'min': 45, 'max': 100},
            3: {'avg': 90, 'min': 60, 'max': 120},
            4: {'avg': 110, 'min': 75, 'max': 145},
            5: {'avg': 130, 'min': 90, 'max': 170},
            6: {'avg': 150, 'min': 105, 'max': 195}
        }
        
        benchmark = benchmarks.get(min(total_people, 6), benchmarks[4])
        
        deviation = ((predicted_kwh - benchmark['avg']) / benchmark['avg']) * 100
        
        if deviation > 20:
            status = 'high'
            message = f"Your predicted consumption is {abs(deviation):.0f}% above average"
        elif deviation < -20:
            status = 'low'
            message = f"Your predicted consumption is {abs(deviation):.0f}% below average"
        else:
            status = 'normal'
            message = "Your predicted consumption is within normal range"
        
        return {
            'status': status,
            'message': message,
            'benchmark_avg': benchmark['avg'],
            'benchmark_range': [benchmark['min'], benchmark['max']],
            'your_prediction': round(predicted_kwh, 1),
            'deviation_percent': round(deviation, 1)
        }
    
    def _generate_recommendations(self, household_data: Dict, predicted_kwh: float) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        appliances = household_data.get('appliances', {})
        
        # AC recommendation
        if appliances.get('has_ac') and predicted_kwh > 120:
            recommendations.append(
                "💡 Your AC contributes ~25-35% of consumption. Use timer mode to save 20-30 kWh/month."
            )
        
        # Water heater recommendation
        if appliances.get('has_water_heater'):
            recommendations.append(
                "🚿 Turn off water heater when not in use. Can save 10-15 kWh/month."
            )
        
        # High appliance count
        total_appliances = sum(1 for v in appliances.values() if v)
        if total_appliances > 10:
            recommendations.append(
                f"⚡ You have {total_appliances} appliances. Unplug devices when not in use to reduce standby power."
            )
        
        # High consumption warning
        if predicted_kwh > 150:
            recommendations.append(
                "⚠️ High consumption predicted. Consider LED bulbs, energy-efficient appliances, and smart power strips."
            )
        
        # Low consumption praise
        if predicted_kwh < 60:
            recommendations.append(
                "✅ Excellent! Your consumption is very efficient. Keep up the good habits!"
            )
        
        return recommendations
    
    def get_feature_importance(self) -> List[Dict]:
        """Get feature importance rankings"""
        return self.feature_importance[:10]  # Top 10


# Singleton instance
_predictor = None

def get_predictor() -> ConsumptionPredictor:
    """Get or create predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = ConsumptionPredictor()
    return _predictor