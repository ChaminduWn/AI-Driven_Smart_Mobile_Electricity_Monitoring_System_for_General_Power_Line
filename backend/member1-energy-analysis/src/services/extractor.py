from typing import Dict, Optional
from datetime import datetime, timedelta
from src.services.ocr import OCRService
from src.parsers.ceb_parser import CEBBillParser
from src.models.bill import ElectricityBill
from sqlalchemy.orm import Session

class BillExtractionService:
    """Service for extracting and processing electricity bills"""
    
    def __init__(self):
        self.ocr_service = OCRService()
        self.parser = CEBBillParser()
    
    def extract_bill_data(
        self, 
        file_path: str, 
        file_name: str, 
        file_type: str,
        db: Session,
        user_id: Optional[int] = None
    ) -> Dict:
        """
        Main extraction method
        
        Args:
            file_path: Path to the uploaded file
            file_name: Original filename
            file_type: File extension (pdf, jpg, etc.)
            db: Database session
            
        Returns:
            Dictionary containing extraction results
        """
        try:
            # Step 1: Extract text using OCR
            raw_text = self.ocr_service.extract_text(file_path, file_type)
            
            if not raw_text:
                raise Exception("No text could be extracted from the file")
            
            # Step 2: Parse the extracted text
            parsed_data = self.parser.parse(raw_text)
            
            # Step 3: Save to database
            bill = self._save_to_database(
                db=db,
                file_path=file_path,
                file_name=file_name,
                file_type=file_type,
                raw_text=raw_text,
                parsed_data=parsed_data,
                user_id=user_id
            )
            
            return {
                'success': True,
                'bill_id': bill.id,
                'extracted_data': parsed_data,
                'confidence_score': parsed_data.get('confidence_score', 0),
                'message': 'Bill extracted successfully'
            }
            
        except Exception as e:
            # Log error and save failed extraction to database
            error_bill = self._save_failed_extraction(
                db=db,
                file_name=file_name,
                file_path=file_path,
                file_type=file_type,
                error_message=str(e),
                user_id=user_id
            )
            
            return {
                'success': False,
                'bill_id': error_bill.id if error_bill else None,
                'message': f'Extraction failed: {str(e)}',
                'error': str(e)
            }
    
    def _save_to_database(
        self,
        db: Session,
        file_name: str,
        file_path: str,
        file_type: str,
        raw_text: str,
        parsed_data: Dict,
        user_id: Optional[int] = None
    ) -> ElectricityBill:
        """Save extracted bill data to database"""
        
        # Parse meter readings and bill date first (needed for derivation)
        bill_date = None
        if parsed_data.get('bill_date'):
            try:
                bill_date = datetime.strptime(parsed_data['bill_date'], '%Y-%m-%d')
            except Exception:
                pass

        meter_readings = parsed_data.get('meter_readings', [])
        units_consumed = parsed_data.get('units_consumed')
        billing_days = parsed_data.get('billing_period_days') or 0
        previous_reading = None
        current_reading = None
        previous_date = None
        current_date = None

        if len(meter_readings) >= 2:
            # Two readings: first = previous month, second = current (bill issue)
            previous_reading = meter_readings[0]['reading']
            current_reading = meter_readings[1]['reading']
            try:
                previous_date = datetime.strptime(meter_readings[0]['date'], '%Y-%m-%d')
                current_date = datetime.strptime(meter_readings[1]['date'], '%Y-%m-%d')
            except Exception:
                previous_date = bill_date
                current_date = bill_date
        elif len(meter_readings) == 1 and units_consumed is not None and bill_date:
            # One reading: treat as previous month end; derive current from previous + units
            previous_reading = meter_readings[0]['reading']
            current_reading = previous_reading + units_consumed
            try:
                previous_date = datetime.strptime(meter_readings[0]['date'], '%Y-%m-%d')
            except Exception:
                # Derive previous date: bill_date minus billing period days
                previous_date = (bill_date - timedelta(days=billing_days)) if billing_days else bill_date
            current_date = bill_date
        
        # IMPORTANT: Use total_charge instead of total_due
        # total_charge represents the actual monthly bill amount
        # We're not tracking dues, payments, or balances
        total_monthly_charge = parsed_data.get('total_charge')
        
        # Calculate total charge from components if not directly extracted
        if not total_monthly_charge:
            unit_charge = parsed_data.get('unit_charge', 0.0)
            fixed_charge = parsed_data.get('fixed_charge', 0.0)
            if unit_charge or fixed_charge:
                total_monthly_charge = unit_charge + fixed_charge
        
        # Create bill record
        bill = ElectricityBill(
            user_id=user_id,
            file_name=file_name,
            file_path=file_path,
            file_type=file_type,
            account_number=parsed_data.get('account_number'),
            bill_reference=parsed_data.get('bill_reference'),
            bill_date=bill_date,
            units_consumed=parsed_data.get('units_consumed'),
            units_exported=parsed_data.get('units_exported', 0),
            billing_period_days=parsed_data.get('billing_period_days'),
            previous_reading=previous_reading,
            current_reading=current_reading,
            previous_reading_date=previous_date,
            current_reading_date=current_date,
            fixed_charge=parsed_data.get('fixed_charge', 0.0),
            unit_charge=parsed_data.get('unit_charge', 0.0),
            total_charge=total_monthly_charge,  # This is the actual monthly bill
            # Remove previous_due and total_due - not needed
            customer_name=parsed_data.get('customer_name'),
            customer_address=parsed_data.get('customer_address'),
            tariff_type=parsed_data.get('tariff_type'),
            connection_type=parsed_data.get('connection_type'),
            raw_text=raw_text,
            extracted_data=parsed_data,
            confidence_score=parsed_data.get('confidence_score', 0.0),
            processing_status='completed'
        )
        
        db.add(bill)
        db.commit()
        db.refresh(bill)
        
        return bill
    
    @staticmethod
    def derive_readings_from_parsed(parsed_data: Dict) -> Dict:
        """
        Derive previous_reading, current_reading, previous_reading_date, current_reading_date
        from parsed_data (e.g. from extracted_data JSON). Used for backfilling existing bills.
        """
        bill_date = None
        if parsed_data.get('bill_date'):
            try:
                bill_date = datetime.strptime(parsed_data['bill_date'], '%Y-%m-%d')
            except Exception:
                pass
        meter_readings = parsed_data.get('meter_readings', [])
        units_consumed = parsed_data.get('units_consumed')
        billing_days = parsed_data.get('billing_period_days') or 0
        out = {
            'previous_reading': None,
            'current_reading': None,
            'previous_reading_date': None,
            'current_reading_date': None,
        }
        if len(meter_readings) >= 2:
            out['previous_reading'] = meter_readings[0]['reading']
            out['current_reading'] = meter_readings[1]['reading']
            try:
                out['previous_reading_date'] = datetime.strptime(meter_readings[0]['date'], '%Y-%m-%d')
                out['current_reading_date'] = datetime.strptime(meter_readings[1]['date'], '%Y-%m-%d')
            except Exception:
                out['previous_reading_date'] = bill_date
                out['current_reading_date'] = bill_date
        elif len(meter_readings) == 1 and units_consumed is not None and bill_date:
            out['previous_reading'] = meter_readings[0]['reading']
            out['current_reading'] = meter_readings[0]['reading'] + units_consumed
            try:
                out['previous_reading_date'] = datetime.strptime(meter_readings[0]['date'], '%Y-%m-%d')
            except Exception:
                out['previous_reading_date'] = (bill_date - timedelta(days=billing_days)) if billing_days else bill_date
            out['current_reading_date'] = bill_date
        return out

    def _save_failed_extraction(
        self,
        db: Session,
        file_name: str,
        file_path: str,
        file_type: str,
        error_message: str,
        user_id: Optional[int] = None
    ) -> Optional[ElectricityBill]:
        """Save failed extraction attempt to database"""
        try:
            bill = ElectricityBill(
                user_id=user_id,
                file_name=file_name,
                file_path=file_path,
                file_type=file_type,
                processing_status='failed',
                error_message=error_message
            )
            
            db.add(bill)
            db.commit()
            db.refresh(bill)
            
            return bill
        except Exception as e:
            print(f"Error saving failed extraction: {str(e)}")
            return None