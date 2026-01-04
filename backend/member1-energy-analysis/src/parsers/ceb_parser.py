import re
from typing import Dict, List, Optional
from datetime import datetime

class CEBBillParser:
    """Parser for Ceylon Electricity Board (CEB) bills"""
    
    def parse(self, text: str) -> Dict:
        """
        Parse CEB bill text and extract structured data
        
        Args:
            text: Raw text extracted from bill
            
        Returns:
            Dictionary containing parsed bill data
        """
        data = {
            'account_number': self._extract_account_number(text),
            'bill_reference': self._extract_bill_reference(text),
            'bill_date': self._extract_bill_date(text),
            'units_consumed': self._extract_units_consumed(text),
            'units_exported': self._extract_units_exported(text),
            'billing_period_days': self._extract_billing_period_days(text),
            'meter_readings': self._extract_meter_readings(text),
            'fixed_charge': self._extract_fixed_charge(text),
            'unit_charge': self._extract_unit_charge(text),
            'charge_for_consumed': self._extract_charge_for_consumed(text),
            'total_charge': self._extract_total_charge(text),  # ✅ FIXED!
            'customer_name': self._extract_customer_name(text),
            'customer_address': self._extract_customer_address(text),
            'tariff_type': self._extract_tariff_type(text),
            'connection_type': self._extract_connection_type(text),
            'confidence_score': self._calculate_confidence(text)
        }
        
        # Debug output
        print(f"\n🔍 Parser Results:")
        print(f"  Total Charge: Rs. {data['total_charge']}")
        print(f"  Unit Charge: Rs. {data['unit_charge']}")
        print(f"  Fixed Charge: Rs. {data['fixed_charge']}")
        
        return data
    
    def _extract_account_number(self, text: str) -> Optional[str]:
        """Extract electricity account number"""
        patterns = [
            r'Electricity\s+A/C\s+No\.?:\s*(\d+)',
            r'Account\s+No\.?:\s*(\d+)',
            r'A/C\s+No\.?:\s*(\d+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
    
    def _extract_bill_reference(self, text: str) -> Optional[str]:
        """Extract bill reference number"""
        pattern = r'Bill\s+Ref\.?:\s*([\d\-]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else None
    
    def _extract_bill_date(self, text: str) -> Optional[str]:
        """Extract bill date and convert to ISO format"""
        pattern = r'Bill\s+Date:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            date_str = match.group(1)
            try:
                date_obj = datetime.strptime(date_str.replace('-', '/'), '%m/%d/%Y')
                return date_obj.strftime('%Y-%m-%d')
            except:
                try:
                    date_obj = datetime.strptime(date_str.replace('-', '/'), '%d/%m/%Y')
                    return date_obj.strftime('%Y-%m-%d')
                except:
                    pass
        return None
    
    def _extract_units_consumed(self, text: str) -> Optional[int]:
        """Extract units consumed (kWh)"""
        patterns = [
            r'No\.\s+of\s+Units\s+Consumed\s+\(kWh\)\s+(\d+)',
            r'Units\s+Consumed.*?(\d+)\s*kWh',
            r'Consumed\s+\(kWh\)\s*:?\s*(\d+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return int(match.group(1))
        return None
    
    def _extract_units_exported(self, text: str) -> int:
        """Extract units exported (kWh)"""
        pattern = r'No\.\s+of\s+Units\s+Exported\s+\(kWh\)\s+(\d+)'
        match = re.search(pattern, text, re.IGNORECASE)
        return int(match.group(1)) if match else 0
    
    def _extract_billing_period_days(self, text: str) -> Optional[int]:
        """Extract billing period in days"""
        pattern = r'(\d+)\s*Days'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            days = int(match.group(1))
            if days > 100:
                days = int(str(days)[-2:])
            if 28 <= days <= 35:
                return days
        return None
    
    def _extract_meter_readings(self, text: str) -> List[Dict]:
        """Extract meter readings with dates"""
        readings = []
        lines = text.split('\n')
        
        for line in lines:
            date_match = re.search(r'(\d{4})-(\d{2})-(\d{2})', line)
            if date_match:
                date_str = date_match.group(0)
                reading_match = re.search(r'(\d+)\s*' + re.escape(date_str), line)
                if reading_match:
                    reading = int(reading_match.group(1))
                    if reading < 1000000:
                        readings.append({
                            'date': date_str,
                            'reading': reading
                        })
        
        readings.sort(key=lambda x: x['date'])
        return readings
    
    def _extract_fixed_charge(self, text: str) -> float:
        """Extract fixed charge amount"""
        patterns = [
            r'Fixed\s+Charge\s+\(Rs\.\)\s+(\d+(?:,\d{3})*\.?\d*)',
            r'Fixed\s+Charge\s*\n?\s*(\d+(?:,\d{3})*\.?\d*)\s*x\s*1\s*=\s*(\d+(?:,\d{3})*\.?\d*)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount = match.group(2) if len(match.groups()) > 1 else match.group(1)
                return float(amount.replace(',', ''))
        return 0.0
    
    def _extract_unit_charge(self, text: str) -> float:
        """Extract unit charge (energy charge)"""
        return self._extract_charge_for_consumed(text)
    
    def _extract_charge_for_consumed(self, text: str) -> float:
        """Extract charge for electricity consumed"""
        patterns = [
            r'Charge\s+for\s+Units\s+Consumed\s+\(Rs\.\)\s+(\d+(?:,\d{3})*\.?\d*)',
            r'Charge\s+for\s+Electricity\s+Consumed\s+\(Rs\.\)\s*\n?\s*(\d+(?:,\d{3})*\.?\d*)',
            r'Energy\s+Charge.*?(\d+(?:,\d{3})*\.?\d*)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1).replace(',', ''))
        return 0.0
    
    def _extract_total_charge(self, text: str) -> Optional[float]:
        """
        Extract total charge (This Month Charge) - THE MOST IMPORTANT FIELD!
        
        This is the actual amount you need to pay for THIS MONTH ONLY.
        """
        
        # PRIORITY 1: Look in the payment calculation table
        # Format: "Previous Due Payments Credits Debits This Month Charge Total Due"
        #         "600.00 0.00 0.00 1,603.08 1,517.09"
        # We want the 4th number (This Month Charge = 1,603.08)
        
        # Pattern to match the payment table row
        payment_pattern = r'Previous\s+Due\s+Payments\s+Credits\s+Debits\s+This\s+Month\s+Charge\s+Total\s+Due\s*\n?\s*(\d+(?:,\d{3})*\.?\d{2})\s+(\d+(?:,\d{3})*\.?\d{2})\s+(\d+(?:,\d{3})*\.?\d{2})\s+(\d+(?:,\d{3})*\.?\d{2})\s+(\d+(?:,\d{3})*\.?\d{2})'
        
        match = re.search(payment_pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            # Group 4 is "This Month Charge"
            this_month_charge = match.group(4).replace(',', '')
            total = float(this_month_charge)
            print(f"✅ Found This Month Charge in payment table: Rs. {total}")
            return total
        
        # PRIORITY 2: Look for just the row of numbers
        # "600.00 0.00 0.00 1,603.08 1,517.09"
        number_row_pattern = r'(\d+(?:,\d{3})*\.?\d{2})\s+(\d+(?:,\d{3})*\.?\d{2})\s+(\d+(?:,\d{3})*\.?\d{2})\s+(\d+(?:,\d{3})*\.?\d{2})\s+(\d+(?:,\d{3})*\.?\d{2})'
        
        matches = list(re.finditer(number_row_pattern, text))
        for match in matches:
            # Check if this looks like the payment row
            prev_due = float(match.group(1).replace(',', ''))
            payments = float(match.group(2).replace(',', ''))
            credits = float(match.group(3).replace(',', ''))
            this_month = float(match.group(4).replace(',', ''))
            total_due = float(match.group(5).replace(',', ''))
            
            # Validation: this_month should be > 100 and < 100000
            if 100 < this_month < 100000:
                print(f"✅ Found This Month Charge in number row: Rs. {this_month}")
                return this_month
        
        # PRIORITY 3: Look near "This Month Charge" text
        # Sometimes OCR puts it on different lines
        context_pattern = r'This\s+Month\s+Charge.*?(\d+,\d{3}\.\d{2})'
        match = re.search(context_pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            total = float(match.group(1).replace(',', ''))
            if 100 < total < 100000:
                print(f"✅ Found near This Month Charge label: Rs. {total}")
                return total
        
        # PRIORITY 4: Calculate from "Charge for Electricity Consumed (Rs.)"
        # This is the subtotal BEFORE tax (1,563.00 in your bill)
        # We need to add 2.5% SSCL tax
        consumed_pattern = r'Charge\s+for\s+Electricity\s+Consumed\s+\(Rs\.\)\s*\n?\s*(\d+(?:,\d{3})*\.?\d{2})'
        match = re.search(consumed_pattern, text, re.IGNORECASE)
        if match:
            subtotal = float(match.group(1).replace(',', ''))
            # Add 2.5% SSCL tax
            total_with_tax = subtotal * 1.025
            print(f"⚠️  Calculated from subtotal: Rs. {subtotal} × 1.025 = Rs. {total_with_tax:.2f}")
            return round(total_with_tax, 2)
        
        # PRIORITY 5: Fallback - calculate from components
        fixed = self._extract_fixed_charge(text)
        consumed = self._extract_charge_for_consumed(text)
        if fixed > 0 and consumed > 0:
            subtotal = fixed + consumed
            total = subtotal * 1.025
            print(f"⚠️  Fallback calculation: ({fixed} + {consumed}) × 1.025 = Rs. {total:.2f}")
            return round(total, 2)
        
        print("❌ Could not extract total_charge!")
        return None
    
    def _extract_customer_name(self, text: str) -> Optional[str]:
        """Extract customer name"""
        patterns = [
            r'Rev\./\s*Mr\./\s*Mrs\.\s+([A-Z\s]+)',
            r'Name:\s*([A-Z\s]+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                name = match.group(1).strip()
                name = re.sub(r'\s+', ' ', name)
                return name if len(name) > 2 else None
        return None
    
    def _extract_customer_address(self, text: str) -> str:
        """Extract customer address"""
        patterns = [
            r'NO\.(\d+[A-Z/\d\s,]+(?:MW|MAWATHA|ROAD|LANE|STREET)[A-Z\s,]*)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                address = match.group(0).strip()
                address = re.sub(r'\s+', ' ', address)
                return address if len(address) > 5 else "Address not available"
        
        return "Address not available"
    
    def _extract_tariff_type(self, text: str) -> Optional[str]:
        """Extract tariff type"""
        pattern = r'Tariff:\s*([A-Za-z\s\-]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else None
    
    def _extract_connection_type(self, text: str) -> Optional[str]:
        """Extract connection type"""
        pattern = r'Connection:\s*([A-Za-z0-9\s]+(?:Phase)?)'
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else None
    
    def _calculate_confidence(self, text: str) -> float:
        """Calculate extraction confidence score"""
        required_fields = [
            'Bill Ref',
            'Account',
            'Units Consumed',
            'Total',
        ]
        
        found = sum(1 for field in required_fields if field.lower() in text.lower())
        confidence = (found / len(required_fields)) * 100
        
        return round(confidence, 1)