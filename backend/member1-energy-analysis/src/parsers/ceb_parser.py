import re
from typing import Dict, List, Optional

class CEBBillParser:
    """Parser specifically for Sri Lankan CEB electricity bills"""
    
    def __init__(self):
        self.confidence_score = 0.0
        self.fields_found = 0
        self.total_fields = 10
    
    def parse(self, text: str) -> Dict:
        """Main parsing method"""
        data = {
            'account_number': self._extract_account_number(text),
            'bill_reference': self._extract_bill_reference(text),
            'bill_date': self._extract_bill_date(text),
            'units_consumed': self._extract_units_consumed(text),
            'units_exported': self._extract_units_exported(text),
            'billing_period_days': self._extract_billing_days(text),
            'meter_readings': self._extract_meter_readings(text),
            'fixed_charge': self._extract_fixed_charge(text),
            'unit_charge': self._extract_unit_charge(text),
            'total_due': self._extract_total_due(text),
            'previous_due': self._extract_previous_due(text),
            'customer_name': self._extract_customer_name(text),
            'customer_address': self._extract_customer_address(text),
            'tariff_type': self._extract_tariff_type(text),
            'connection_type': self._extract_connection_type(text),
            'confidence_score': self._calculate_confidence()
        }
        return data
    
    def _extract_account_number(self, text: str) -> Optional[str]:
        patterns = [
            r'Electricity\s*A/?C\s*No\.?[:\s]*(\d+)',
            r'Account\s*(?:Number|No\.?)[:\s]*(\d+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                self.fields_found += 1
                return match.group(1)
        return None
    
    def _extract_bill_reference(self, text: str) -> Optional[str]:
        pattern = r'Bill\s*Ref[:\s]*(\d+-\d+-\d+)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            self.fields_found += 1
            return match.group(1)
        return None
    
    def _extract_bill_date(self, text: str) -> Optional[str]:
        pattern = r'Bill\s*Date[:\s]*(\d{1,2})/(\d{1,2})/(\d{4})'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            self.fields_found += 1
            month, day, year = match.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        return None
    
    def _extract_units_consumed(self, text: str) -> Optional[int]:
        patterns = [
            r'No\.\s*of\s*Units\s*Consumed\s*\(kWh\)\s*[:\s]*(\d+)',
            r'Units\s*Consumed[:\s]*(\d+)',
            r'(\d+)\s*kWh\s*consumed'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                self.fields_found += 1
                return int(match.group(1))
        return None
    
    def _extract_units_exported(self, text: str) -> int:
        pattern = r'No\.\s*of\s*Units\s*Exported\s*\(kWh\)\s*[:\s]*(\d+)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return 0
    
    def _extract_billing_days(self, text: str) -> Optional[int]:
        pattern = r'(\d+)\s*Days'
        match = re.search(pattern, text)
        if match:
            self.fields_found += 1
            return int(match.group(1))
        return None
    
    def _extract_meter_readings(self, text: str) -> List[Dict]:
        pattern = r'(\d{4})-(\d{2})-(\d{2})\s*(\d+)'
        matches = re.findall(pattern, text)
        readings = []
        
        for match in matches:
            year, month, day, reading = match
            readings.append({
                'date': f"{year}-{month}-{day}",
                'reading': int(reading)
            })
        
        if readings:
            self.fields_found += 1
        return readings
    
    def _extract_fixed_charge(self, text: str) -> float:
        pattern = r'Fixed\s*Charge[:\s]*(?:Rs\.?)?\s*(\d+(?:\.\d{2})?)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1))
        return 0.0
    
    def _extract_unit_charge(self, text: str) -> float:
        pattern = r'Charge\s*for\s*Units\s*Consumed[:\s]*(?:Rs\.?)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1).replace(',', ''))
        return 0.0
    
    def _extract_total_due(self, text: str) -> Optional[float]:
        patterns = [
            r'Total\s*Due[:\s]*(?:Rs\.?)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'(?:Total|Amount)\s*(?:Payable|Due)[:\s]*(?:Rs\.?)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                self.fields_found += 1
                return float(match.group(1).replace(',', ''))
        return None
    
    def _extract_previous_due(self, text: str) -> float:
        pattern = r'Previous\s*Due[:\s]*(?:Rs\.?)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1).replace(',', ''))
        return 0.0
    
    def _extract_customer_name(self, text: str) -> Optional[str]:
        pattern = r'(?:Rev\.|Mr\.|Mrs\.|Ms\.)\s+([A-Z\s]+?)(?:\n|Tariff)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            self.fields_found += 1
            return match.group(1).strip()
        return None
    
    def _extract_customer_address(self, text: str) -> Optional[str]:
        pattern = r'(?:Rev\.|Mr\.|Mrs\.|Ms\.)\s+[A-Z\s]+?\n(.*?)(?:Connection:|Tariff:)'
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            address = match.group(1).strip()
            return ' '.join(address.split())
        return None
    
    def _extract_tariff_type(self, text: str) -> Optional[str]:
        pattern = r'Tariff[:\s]*([^\n]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return None
    
    def _extract_connection_type(self, text: str) -> Optional[str]:
        pattern = r'Connection[:\s]*(\d+\s*Phase)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return None
    
    def _calculate_confidence(self) -> float:
        return (self.fields_found / self.total_fields) * 100