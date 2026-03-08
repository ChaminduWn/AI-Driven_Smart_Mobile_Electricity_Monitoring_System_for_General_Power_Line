"""
src/services/appliance_recognition.py
Appliance Image Recognition Service
"""
import os
import torch
import easyocr
from PIL import Image
from typing import Dict, Optional, Tuple, List
import re
import logging
from transformers import CLIPProcessor, CLIPModel
import numpy as np

logger = logging.getLogger(__name__)


class ApplianceRecognitionService:
    """
    Recognizes appliances from images and extracts power consumption data
    """
    
    APPLIANCE_DATABASE = {
        # Cooling
        'refrigerator': {'min': 100, 'max': 800, 'typical': 150, 'category': 'Cooling'},
        'air conditioner': {'min': 800, 'max': 3500, 'typical': 1500, 'category': 'Cooling'},
        'fan': {'min': 50, 'max': 150, 'typical': 75, 'category': 'Cooling'},
        'freezer': {'min': 100, 'max': 1000, 'typical': 200, 'category': 'Cooling'},
        
        # Heating
        'electric heater': {'min': 800, 'max': 2500, 'typical': 1500, 'category': 'Heating'},
        'water heater': {'min': 1500, 'max': 4500, 'typical': 2000, 'category': 'Heating'},
        
        # Cooking
        'microwave': {'min': 600, 'max': 1800, 'typical': 1200, 'category': 'Cooking'},
        'electric kettle': {'min': 1000, 'max': 3000, 'typical': 1500, 'category': 'Cooking'},
        'rice cooker': {'min': 400, 'max': 1000, 'typical': 700, 'category': 'Cooking'},
        'toaster': {'min': 800, 'max': 1500, 'typical': 1000, 'category': 'Cooking'},
        'blender': {'min': 300, 'max': 1000, 'typical': 500, 'category': 'Cooking'},
        'electric stove': {'min': 1000, 'max': 5000, 'typical': 2000, 'category': 'Cooking'},
        'air fryer': {'min': 1000, 'max': 2000, 'typical': 1500, 'category': 'Cooking'},
        
        # Laundry
        'washing machine': {'min': 300, 'max': 2000, 'typical': 500, 'category': 'Laundry'},
        'clothes dryer': {'min': 2000, 'max': 5000, 'typical': 3000, 'category': 'Laundry'},
        'iron': {'min': 800, 'max': 2000, 'typical': 1000, 'category': 'Laundry'},
        
        # Cleaning
        'vacuum cleaner': {'min': 500, 'max': 2000, 'typical': 1000, 'category': 'Cleaning'},
        'dishwasher': {'min': 1000, 'max': 2500, 'typical': 1500, 'category': 'Cleaning'},
        
        # Entertainment
        'television': {'min': 30, 'max': 400, 'typical': 80, 'category': 'Entertainment'},
        'gaming console': {'min': 100, 'max': 300, 'typical': 200, 'category': 'Entertainment'},
        'sound system': {'min': 50, 'max': 500, 'typical': 150, 'category': 'Entertainment'},
        
        # Lighting
        'lamp': {'min': 5, 'max': 60, 'typical': 15, 'category': 'Lighting'},
        'led bulb': {'min': 3, 'max': 20, 'typical': 9, 'category': 'Lighting'},

        # Office
        'laptop': {'min': 30, 'max': 100, 'typical': 50, 'category': 'Office'},
        'desktop computer': {'min': 100, 'max': 500, 'typical': 200, 'category': 'Office'},
        'printer': {'min': 10, 'max': 500, 'typical': 50, 'category': 'Office'},
        'monitor': {'min': 20, 'max': 100, 'typical': 40, 'category': 'Office'},
        
        # Water
        'water pump': {'min': 250, 'max': 1500, 'typical': 750, 'category': 'Water'},
        'water purifier': {'min': 20, 'max': 100, 'typical': 50, 'category': 'Water'},
        
        # Safety
        'security camera': {'min': 5, 'max': 50, 'typical': 15, 'category': 'Safety'},
        'alarm system': {'min': 5, 'max': 50, 'typical': 20, 'category': 'Safety'},
        
        # Health/Beauty
        'hair dryer': {'min': 1000, 'max': 2000, 'typical': 1500, 'category': 'Health/Beauty'},
        'hair straightener': {'min': 30, 'max': 200, 'typical': 100, 'category': 'Health/Beauty'},
        'electric shaver': {'min': 5, 'max': 30, 'typical': 15, 'category': 'Health/Beauty'},

        # Outdoor/Garden
        'lawn mower': {'min': 1000, 'max': 3000, 'typical': 1500, 'category': 'Outdoor/Garden'},
        'pool pump': {'min': 500, 'max': 2500, 'typical': 1500, 'category': 'Outdoor/Garden'},
    }
    
    def __init__(self):
        """Initialize models"""
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        # Initialize CLIP for appliance classification
        try:
            logger.info("Loading CLIP model...")
            self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            self.clip_model.to(self.device)
            logger.info("CLIP model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load CLIP model: {e}")
            self.clip_model = None
            self.clip_processor = None
        
        # Initialize EasyOCR for reading labels
        try:
            logger.info("Loading EasyOCR...")
            self.ocr_reader = easyocr.Reader(['en'], gpu=self.device == "cuda")
            logger.info("EasyOCR loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load EasyOCR: {e}")
            self.ocr_reader = None
    
    def classify_appliance(self, image_path: str) -> Dict:
        """
        Classify appliance type from image using CLIP
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dict with appliance type, confidence, category, and typical wattage
        """
        if not self.clip_model:
            return {
                'success': False,
                'error': 'CLIP model not available'
            }
        
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            
            # Define possible appliance types
            appliance_types = list(self.APPLIANCE_DATABASE.keys())
            texts = [f"a photo of a {appliance}" for appliance in appliance_types]
            
            # Process inputs
            inputs = self.clip_processor(
                text=texts,
                images=image,
                return_tensors="pt",
                padding=True
            ).to(self.device)
            
            # Get predictions
            with torch.no_grad():
                outputs = self.clip_model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=1)
            
            # Get top prediction
            confidence, idx = probs[0].max(0)
            predicted_appliance = appliance_types[idx.item()]
            confidence_score = confidence.item()
            
            # Get appliance details
            appliance_info = self.APPLIANCE_DATABASE[predicted_appliance]
            
            logger.info(f"Classified as: {predicted_appliance} (confidence: {confidence_score:.2%})")
            
            return {
                'success': True,
                'appliance_type': predicted_appliance,
                'confidence': float(confidence_score),
                'category': appliance_info['category'],
                'typical_wattage': appliance_info['typical'],
                'wattage_range': {
                    'min': appliance_info['min'],
                    'max': appliance_info['max']
                },
                'top_predictions': [
                    {
                        'appliance': appliance_types[i],
                        'confidence': float(probs[0][i].item())
                    }
                    for i in torch.argsort(probs[0], descending=True)[:3].tolist()
                ]
            }
            
        except Exception as e:
            logger.error(f"Error classifying appliance: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def extract_power_from_label(self, image_path: str) -> Dict:
        """
        Extract power consumption from appliance label using OCR
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dict with extracted wattage values
        """
        if not self.ocr_reader:
            return {
                'success': False,
                'error': 'OCR reader not available'
            }
        
        try:
            # Read text from image
            results = self.ocr_reader.readtext(image_path)
            
            # Extract text
            all_text = ' '.join([text for (_, text, _) in results])
            logger.info(f"OCR extracted text: {all_text}")
            
            # Find power values (W, watts, kW, etc.)
            power_patterns = [
                r'(\d+(?:\.\d+)?)\s*(?:W|watts|WATTS)',  # 100W, 100 watts
                r'(\d+(?:\.\d+)?)\s*(?:kW|KW|kilowatts)',  # 1.5kW
                r'Power:\s*(\d+(?:\.\d+)?)',  # Power: 100
                r'Rated\s*Power:\s*(\d+(?:\.\d+)?)',  # Rated Power: 100
                r'(\d+(?:\.\d+)?)\s*W\b',  # 100W
            ]
            
            found_values = []
            
            for pattern in power_patterns:
                matches = re.finditer(pattern, all_text, re.IGNORECASE)
                for match in matches:
                    value = float(match.group(1))
                    
                    # Convert kW to W
                    if 'kw' in match.group(0).lower() or 'kilowatt' in match.group(0).lower():
                        value *= 1000
                    
                    found_values.append(value)
            
            if found_values:
                # Return most likely value (usually the largest reasonable one)
                primary_value = max(found_values)
                
                return {
                    'success': True,
                    'wattage': int(primary_value),
                    'all_found_values': found_values,
                    'extracted_text': all_text,
                    'confidence': 'high' if len(found_values) == 1 else 'medium'
                }
            else:
                return {
                    'success': False,
                    'error': 'No power values found in image',
                    'extracted_text': all_text
                }
                
        except Exception as e:
            logger.error(f"Error extracting power from label: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def recognize_appliance(self, image_path: str) -> Dict:
        """
        Complete appliance recognition: classify + extract power
        
        Args:
            image_path: Path to image file
            
        Returns:
            Combined results from classification and OCR
        """
        # Step 1: Classify appliance type
        classification = self.classify_appliance(image_path)
        
        # Step 2: Try to extract power from label
        power_extraction = self.extract_power_from_label(image_path)
        
        # Combine results
        result = {
            'success': True,
            'classification': classification,
            'power_extraction': power_extraction,
        }
        
        # Determine final recommendation
        if power_extraction.get('success'):
            # Use extracted wattage
            result['recommended_wattage'] = power_extraction['wattage']
            result['wattage_source'] = 'ocr'
        elif classification.get('success'):
            # Use typical wattage for appliance type
            result['recommended_wattage'] = classification['typical_wattage']
            result['wattage_source'] = 'database'
        else:
            result['success'] = False
            result['error'] = 'Could not determine appliance or power'
        
        if classification.get('success'):
            result['appliance_name'] = classification['appliance_type'].title()
            result['category'] = classification['category']
            result['confidence'] = classification['confidence']
        
        return result


# Singleton instance
_recognition_service = None

def get_recognition_service() -> ApplianceRecognitionService:
    """Get or create recognition service instance"""
    global _recognition_service
    if _recognition_service is None:
        _recognition_service = ApplianceRecognitionService()
    return _recognition_service