"""
Tests for BillExtractionService
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from src.services.extractor import BillExtractionService
from sqlalchemy.orm import Session
import tempfile
import os


@pytest.fixture
def mock_db_session():
    """Mock database session"""
    session = MagicMock(spec=Session)
    return session


@pytest.fixture
def sample_bill_text():
    """Sample CEB bill text for testing"""
    return """
    Statement of Electricity Account
    Bill Ref: 448-4124076606-20251213130529
    Bill Date: 12/7/2025 9:08:21 AM
    Electricity A/C No.: 4124076606
    
    Rev./ Mr./ Mrs. W N CHAMINDU
    NO .744/9/3 15TH LANE,
    ROMIYEL MAWATHA,
    PANAGODA
    
    Tariff: Domestic
    Connection: 1 Phase
    
    2025-11-03 1150
    2025-12-07 1227
    34 Days
    
    No. of Units Consumed (kWh): 77
    No. of Units Exported (kWh): 0
    
    Fixed Charge (Rs.): 400.00
    Charge for Units Consumed (Rs.): 1,033.50
    Total Due: 2,086.59
    """


class TestBillExtractionService:
    """Test suite for BillExtractionService"""
    
    def test_service_initialization(self):
        """Test that service can be initialized"""
        service = BillExtractionService()
        assert service is not None
        assert service.ocr_service is not None
        assert service.parser is not None
    
    @patch('src.services.extractor.OCRService')
    def test_extract_bill_data_success(self, mock_ocr_class, mock_db_session, sample_bill_text):
        """Test successful bill extraction"""
        # Setup mock
        mock_ocr_instance = Mock()
        mock_ocr_instance.extract_text.return_value = sample_bill_text
        mock_ocr_class.return_value = mock_ocr_instance
        
        # Mock database add and commit
        mock_db_session.add = Mock()
        mock_db_session.commit = Mock()
        mock_db_session.refresh = Mock()
        
        # Create temporary test file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.pdf', delete=False) as f:
            temp_path = f.name
        
        try:
            # Initialize service and extract
            service = BillExtractionService()
            result = service.extract_bill_data(
                file_path=temp_path,
                file_name="test_bill.pdf",
                file_type="pdf",
                db=mock_db_session
            )
            
            # Assertions
            assert result['success'] is True
            assert 'bill_id' in result
            assert 'extracted_data' in result
            assert result['message'] == 'Bill extracted successfully'
            
        finally:
            # Cleanup
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    @patch('src.services.extractor.OCRService')
    def test_extract_bill_data_failure(self, mock_ocr_class, mock_db_session):
        """Test bill extraction failure handling"""
        # Setup mock to raise exception
        mock_ocr_instance = Mock()
        mock_ocr_instance.extract_text.side_effect = Exception("OCR failed")
        mock_ocr_class.return_value = mock_ocr_instance
        
        # Mock database
        mock_db_session.add = Mock()
        mock_db_session.commit = Mock()
        mock_db_session.refresh = Mock()
        
        service = BillExtractionService()
        result = service.extract_bill_data(
            file_path="nonexistent.pdf",
            file_name="test.pdf",
            file_type="pdf",
            db=mock_db_session
        )
        
        assert result['success'] is False
        assert 'error' in result
        assert 'Extraction failed' in result['message']
    
    def test_save_to_database(self, mock_db_session):
        """Test saving bill data to database"""
        service = BillExtractionService()
        
        parsed_data = {
            'account_number': '4124076606',
            'units_consumed': 77,
            'total_due': 2086.59,
            'confidence_score': 85.5,
            'meter_readings': [
                {'date': '2025-11-03', 'reading': 1150},
                {'date': '2025-12-07', 'reading': 1227}
            ]
        }
        
        # Mock the Bill object that would be created
        from unittest.mock import MagicMock
        mock_bill = MagicMock()
        mock_bill.id = 1
        
        mock_db_session.add = Mock()
        mock_db_session.commit = Mock()
        mock_db_session.refresh = Mock(side_effect=lambda x: setattr(x, 'id', 1))
        
        bill = service._save_to_database(
            db=mock_db_session,
            file_name="test.pdf",
            file_path="/path/to/test.pdf",
            file_type="pdf",
            raw_text="sample text",
            parsed_data=parsed_data
        )
        
        assert mock_db_session.add.called
        assert mock_db_session.commit.called