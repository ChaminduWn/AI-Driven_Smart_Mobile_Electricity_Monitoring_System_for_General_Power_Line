"""
src/services/appliance_recognition_v2.py
Gemini Vision-Powered Appliance Recognition
============================================
Uses Google's new google-genai SDK with gemini-2.0-flash-lite (free tier).
Free tier: 15 requests/minute, 1500 requests/day.
"""

import json, logging, re
from typing import Dict, Optional
from pathlib import Path
from PIL import Image
from google import genai

logger = logging.getLogger(__name__)

from src.config import settings
GEMINI_API_KEY = settings.GEMINI_API_KEY or ""

APPLIANCE_DATABASE = {
    'refrigerator':      {'min': 100,  'max': 800,  'typical': 150,  'category': 'Cooling'},
    'air conditioner':   {'min': 800,  'max': 3500, 'typical': 1500, 'category': 'Cooling'},
    'ceiling fan':       {'min': 50,   'max': 150,  'typical': 75,   'category': 'Cooling'},
    'electric heater':   {'min': 800,  'max': 2500, 'typical': 1500, 'category': 'Heating'},
    'water heater':      {'min': 1500, 'max': 4500, 'typical': 2000, 'category': 'Heating'},
    'microwave':         {'min': 600,  'max': 1800, 'typical': 1200, 'category': 'Cooking'},
    'electric kettle':   {'min': 1000, 'max': 3000, 'typical': 1500, 'category': 'Cooking'},
    'rice cooker':       {'min': 400,  'max': 1000, 'typical': 700,  'category': 'Cooking'},
    'washing machine':   {'min': 300,  'max': 2000, 'typical': 500,  'category': 'Laundry'},
    'iron':              {'min': 800,  'max': 2000, 'typical': 1000, 'category': 'Laundry'},
    'vacuum cleaner':    {'min': 500,  'max': 2000, 'typical': 1000, 'category': 'Cleaning'},
    'television':        {'min': 30,   'max': 400,  'typical': 80,   'category': 'Entertainment'},
    'laptop':            {'min': 30,   'max': 100,  'typical': 50,   'category': 'Office'},
    'desktop computer':  {'min': 100,  'max': 500,  'typical': 200,  'category': 'Office'},
    'water pump':        {'min': 250,  'max': 1500, 'typical': 750,  'category': 'Water'},
    'hair dryer':        {'min': 1000, 'max': 2000, 'typical': 1500, 'category': 'Health/Beauty'},
    'led bulb':          {'min': 3,    'max': 20,   'typical': 9,    'category': 'Lighting'},
}

CATEGORY_MAP = {
    'Cooling': ['refrigerator', 'freezer', 'air conditioner', 'fan', 'ceiling fan'],
    'Heating': ['water heater', 'electric heater', 'geyser', 'iron', 'hair dryer'],
    'Cooking': ['microwave', 'electric kettle', 'rice cooker', 'oven', 'air fryer',
                'toaster', 'blender', 'electric stove', 'induction cooktop'],
    'Laundry': ['washing machine', 'clothes dryer', 'iron'],
    'Cleaning': ['vacuum cleaner', 'dishwasher'],
    'Entertainment': ['television', 'gaming console', 'sound system'],
    'Office': ['laptop', 'desktop computer', 'monitor', 'printer', 'router'],
    'Water': ['water pump', 'water purifier'],
    'Lighting': ['led bulb', 'tube light', 'cfl bulb'],
    'Health/Beauty': ['hair dryer', 'hair straightener', 'electric shaver'],
}


class GeminiVisionRecognitionService:
    """
    Uses Gemini 2.0 Flash Lite Vision to identify appliances and extract wattage.
    Uses new google-genai SDK. Free tier: 15 RPM, 1500 RPD.
    """

    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set. Add it to your .env file.")
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model = "gemini-2.5-flash"
        logger.info(f"GeminiVisionRecognitionService initialized with {self.model}")

    def _lookup_typical_wattage(self, appliance_name: str) -> Optional[Dict]:
        name_lower = appliance_name.lower()
        for key, data in APPLIANCE_DATABASE.items():
            if key in name_lower or name_lower in key:
                return data
        words = set(name_lower.split())
        for key, data in APPLIANCE_DATABASE.items():
            if words & set(key.split()):
                return data
        return None

    def _infer_category(self, appliance_name: str) -> str:
        name_lower = appliance_name.lower()
        for category, keywords in CATEGORY_MAP.items():
            for kw in keywords:
                if kw in name_lower:
                    return category
        return "Other"

    def recognize_appliance(self, image_path: str) -> Dict:
        try:
            image = Image.open(image_path)
            image.load()          # Force read into memory
            image = image.copy()  # Detach from file handle (Windows fix)
        except Exception as e:
            return {"success": False, "error": f"Cannot read image: {e}"}

        prompt = """You are an expert electrical engineer analyzing an appliance image.

Your job is to identify the appliance and extract its power consumption.

Look carefully at:
1. The appliance itself (shape, design, brand logos, visible components)
2. Any specification labels, energy rating stickers, nameplates
3. Power/wattage markings (W, Watts, kW, VA, etc.)
4. Voltage and ampere ratings that can calculate wattage (W = V x A)

Respond with ONLY valid JSON, no markdown, no explanation outside the JSON:

{
  "appliance_name": "exact common name (e.g. Ceiling Fan, Rice Cooker)",
  "brand": "brand name if visible, else null",
  "model": "model number if visible, else null",
  "category": "one of: Cooling, Heating, Cooking, Laundry, Cleaning, Entertainment, Office, Water, Lighting, Health/Beauty, Safety, Other",
  "wattage_from_label": integer watts if found on label else null,
  "wattage_estimated": integer watts based on typical for this appliance type,
  "recommended_wattage": integer (prefer label value; fall back to estimated),
  "wattage_source": "label_extracted" if read from label else "ai_estimated",
  "confidence": float 0.0 to 1.0,
  "label_text_found": "exact text from label if any, else null",
  "reasoning": "one sentence explaining your identification",
  "typical_usage_hours_per_day": integer hours this appliance typically runs
}

If you cannot identify the appliance, set confidence to 0.1 and appliance_name to "Unknown Appliance"."""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=[prompt, image],
            )
            response_text = response.text.strip()

            # Strip markdown fences if model wraps in ```json
            response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
            response_text = re.sub(r"\s*```$", "", response_text)

            data = json.loads(response_text)

        except json.JSONDecodeError as e:
            logger.error(f"Gemini returned invalid JSON: {e}\nResponse: {response_text[:300]}")
            return {"success": False, "error": "AI returned malformed response — retry with a clearer image"}
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return {"success": False, "error": str(e)}

        # Post-process: fill gaps using our database
        appliance_name = data.get("appliance_name", "Unknown Appliance")
        confidence = float(data.get("confidence", 0.5))

        wattage_from_label = data.get("wattage_from_label")
        wattage_estimated = data.get("wattage_estimated")
        recommended = data.get("recommended_wattage")

        if not recommended:
            db_entry = self._lookup_typical_wattage(appliance_name)
            recommended = db_entry["typical"] if db_entry else (wattage_estimated or 100)
            data["wattage_source"] = "database"

        category = data.get("category") or self._infer_category(appliance_name)

        db_entry = self._lookup_typical_wattage(appliance_name)
        if db_entry:
            rec_clamped = max(db_entry["min"] * 0.5, min(recommended, db_entry["max"] * 1.5))
            if abs(rec_clamped - recommended) > 50:
                logger.info(f"Wattage clamped: {recommended}W -> {rec_clamped}W for {appliance_name}")
                recommended = int(rec_clamped)

        return {
            "success": True,
            "appliance_name": appliance_name,
            "brand": data.get("brand"),
            "model": data.get("model"),
            "category": category,
            "recommended_wattage": int(recommended),
            "wattage_from_label": wattage_from_label,
            "wattage_estimated": wattage_estimated,
            "wattage_source": data.get("wattage_source", "ai_estimated"),
            "confidence": round(confidence, 2),
            "label_text_found": data.get("label_text_found"),
            "reasoning": data.get("reasoning", ""),
            "typical_usage_hours": data.get("typical_usage_hours_per_day", 2),
            "classification": {
                "success": True,
                "appliance_type": appliance_name,
                "confidence": confidence,
                "category": category,
                "typical_wattage": int(recommended),
                "wattage_range": {
                    "min": db_entry["min"] if db_entry else max(50, int(recommended * 0.6)),
                    "max": db_entry["max"] if db_entry else int(recommended * 1.4),
                },
            },
            "power_extraction": {
                "success": wattage_from_label is not None,
                "wattage": wattage_from_label or recommended,
                "extracted_text": data.get("label_text_found"),
                "confidence": "high" if wattage_from_label else "medium",
            },
        }


# ─── Singleton with lazy init ───────────────────────────────────────────────

_recognition_service_v2 = None


def get_recognition_service():
    global _recognition_service_v2

    if not GEMINI_API_KEY:
        logger.warning(
            "GEMINI_API_KEY not set — falling back to CLIP-based recognition."
        )
        try:
            from src.services.appliance_recognition import ApplianceRecognitionService
            return ApplianceRecognitionService()
        except Exception as e:
            logger.error(f"Legacy recognition service also failed: {e}")
            return None

    if _recognition_service_v2 is None:
        _recognition_service_v2 = GeminiVisionRecognitionService()

    return _recognition_service_v2