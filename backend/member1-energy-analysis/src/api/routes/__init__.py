# src/api/routes/__init__.py
from . import bill_analysis
from . import appliances
from . import household
from . import nilm
from . import ml_predictions
from . import auth

__all__ = ["bill_analysis", "appliances", "household", "nilm", "ml_predictions", "auth"]