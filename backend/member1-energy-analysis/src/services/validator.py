"""
Data validation service
"""
from typing import Dict, List, Optional
from datetime import datetime


class BillDataValidator:
    """Validate extracted bill data"""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
    
    def validate(self, data: Dict) -> Dict:
        """
        Validate extracted bill data
        
        Args:
            data: Extracted bill data dictionary
            
        Returns:
            Validation result with errors and warnings
        """
        self.errors = []
        self.warnings = []
        
        # Check required fields
        self._validate_units_consumed(data.get('units_consumed'))
        self._validate_total_due(data.get('total_due'))
        self._validate_bill_date(data.get('bill_date'))
        self._validate_meter_readings(data.get('meter_readings', []))
        
        # Check optional but important fields
        if not data.get('account_number'):
            self.warnings.append("Account number not found")
        
        if not data.get('bill_reference'):
            self.warnings.append("Bill reference not found")
        
        return {
            'is_valid': len(self.errors) == 0,
            'errors': self.errors,
            'warnings': self.warnings,
            'confidence_score': self._calculate_confidence(data)
        }
    
    def _validate_units_consumed(self, units: Optional[int]):
        """Validate units consumed"""
        if units is None:
            self.errors.append("Units consumed not found")
        elif units < 0:
            self.errors.append("Units consumed cannot be negative")
        elif units > 10000:
            self.warnings.append(f"Units consumed ({units}) seems unusually high")
    
    def _validate_total_due(self, total: Optional[float]):
        """Validate total due amount"""
        if total is None:
            self.errors.append("Total due amount not found")
        elif total < 0:
            self.errors.append("Total due cannot be negative")
        elif total > 1000000:
            self.warnings.append(f"Total due (Rs. {total}) seems unusually high")
    
    def _validate_bill_date(self, date: Optional[str]):
        """Validate bill date"""
        if not date:
            self.errors.append("Bill date not found")
            return
        
        try:
            # Try to parse the date
            if isinstance(date, str):
                datetime.fromisoformat(date.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            self.errors.append(f"Invalid bill date format: {date}")
    
    def _validate_meter_readings(self, readings: List[Dict]):
        """Validate meter readings"""
        if len(readings) < 2:
            self.warnings.append("Incomplete meter reading data")
            return
        
        # Check if current reading is greater than previous
        if len(readings) >= 2:
            prev = readings[0].get('reading', 0)
            curr = readings[1].get('reading', 0)
            
            if curr < prev:
                self.errors.append(
                    f"Current reading ({curr}) is less than previous reading ({prev})"
                )
    
    def _calculate_confidence(self, data: Dict) -> float:
        """Calculate overall confidence score"""
        total_fields = 10
        found_fields = 0
        
        # Critical fields (higher weight)
        critical_fields = [
            'units_consumed', 'total_due', 'bill_date', 'meter_readings'
        ]
        
        for field in critical_fields:
            value = data.get(field)
            if value and (not isinstance(value, list) or len(value) > 0):
                found_fields += 2  # Weight critical fields higher
        
        # Optional fields
        optional_fields = [
            'account_number', 'bill_reference', 'customer_name',
            'tariff_type', 'fixed_charge', 'unit_charge'
        ]
        
        for field in optional_fields:
            if data.get(field):
                found_fields += 1
        
        # Penalty for errors
        error_penalty = len(self.errors) * 10
        warning_penalty = len(self.warnings) * 5
        
        confidence = max(0, min(100, 
            (found_fields / total_fields * 100) - error_penalty - warning_penalty
        ))
        
        return round(confidence, 2)