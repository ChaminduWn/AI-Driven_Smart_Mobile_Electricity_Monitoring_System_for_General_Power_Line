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
        # Print raw text for debugging
        print("="*70)
        print("RAW TEXT RECEIVED:")
        print(text[:500])  # First 500 chars
        print("="*70)
        
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
            'total_charge': self._extract_total_charge(text),  # This is the key field
            'customer_name': self._extract_customer_name(text),
            'customer_address': self._extract_customer_address(text),
            'tariff_type': self._extract_tariff_type(text),
            'connection_type': self._extract_connection_type(text),
            'confidence_score': self._calculate_confidence()
        }
        
        print(f"\nExtracted total_charge: {data['total_charge']}")
        print(f"Confidence: {data['confidence_score']}%")
        
        return data
    
    def _extract_total_charge(self, text: str) -> Optional[float]:
        """
        Extract the ACTUAL monthly bill amount
        This is THE MOST IMPORTANT field!
        
        Look for:
        1. "This Month Charge" (most common)
        2. "Total with Tax (Rs.)" (alternative)
        3. The number before "Total Due" in the payment section
        """
        
        # Pattern 1: "This Month Charge" followed by amount
        patterns = [
            # Direct "This Month Charge" pattern
            r'This\s*Month\s*Charge\s*[:\s]*(?:Rs\.?)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',
            
            # With line break
            r'This\s*Month\s*Charge\s*\n\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',
            
            # "Total with Tax (Rs.)" pattern
            r'Total\s*with\s*Tax\s*\(Rs\.\)\s*[:\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)',
            
            # In the payment calculation section (before Total Due)
            # Format: "600.00 0.00 0.00 1,603.08 1,517.09"
            #          Previous Due Payments Credits Debits [THIS MONTH CHARGE] Total Due
            r'(\d+(?:,\d{3})*\.\d{2})\s+(\d+(?:,\d{3})*\.\d{2})\s*$',
            
            # Standalone number before "Total Due" line
            r'(\d+(?:,\d{3})*\.\d{2})\s+Total\s+Due',
            
            # In the charges breakdown table
            r'\(Including\s*Taxes\)\s*\n?\s*(\d+(?:,\d{3})*\.\d{2})',
        ]
        
        for i, pattern in enumerate(patterns, 1):
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                # Get the last captured group (the amount)
                amount_str = match.group(match.lastindex) if match.lastindex else match.group(1)
                try:
                    amount = float(amount_str.replace(',', ''))
                    # Sanity check: monthly bill should be between 100 and 100,000
                    if 100 < amount < 100000:
                        print(f"✅ Found total_charge using pattern {i}: Rs. {amount}")
                        self.fields_found += 1
                        return amount
                except (ValueError, AttributeError):
                    continue
        
        # Fallback: Look for "Charge for Electricity Consumed (Rs.)" and add tax
        try:
            elec_charge_pattern = r'Charge\s*for\s*Electricity\s*Consumed\s*\(Rs\.\)\s*[:\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)'
            match = re.search(elec_charge_pattern, text, re.IGNORECASE)
            if match:
                subtotal = float(match.group(1).replace(',', ''))
                # Add 2.5% SSCL tax
                total_with_tax = subtotal * 1.025
                print(f"⚠️  Using fallback: Subtotal Rs.{subtotal} + 2.5% tax = Rs.{total_with_tax:.2f}")
                return round(total_with_tax, 2)
        except:
            pass
        
        print("❌ Could not extract total_charge")
        return None
    
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
        patterns = [
            r'Bill\s*Date[:\s]*(\d{1,2})/(\d{1,2})/(\d{4})',
            r'Bill\s*Date[:\s]*(\d{4})-(\d{1,2})-(\d{1,2})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                self.fields_found += 1
                g1, g2, g3 = match.groups()
                if len(g1) == 4:
                    return f"{g1}-{g2.zfill(2)}-{g3.zfill(2)}"
                else:
                    return f"{g3}-{g1.zfill(2)}-{g2.zfill(2)}"
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
        pattern = r'Fixed\s*Charge[:\s]*(?:\(Rs\.\))?\s*[:\s]*(?:Rs\.?)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1).replace(',', ''))
        return 0.0
    
    def _extract_unit_charge(self, text: str) -> float:
        pattern = r'Charge\s*for\s*Units\s*Consumed\s*\(Rs\.\)\s*[:\s]*(?:Rs\.?)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1).replace(',', ''))
        return 0.0
    
    def _extract_customer_name(self, text: str) -> Optional[str]:
        pattern = r'(?:Rev\.|Mr\.|Mrs\.|Ms\.)\s*/?\s*([A-Z\s]+?)(?:\n|Tariff)'
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