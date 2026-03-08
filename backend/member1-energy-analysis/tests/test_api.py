"""
Tests for API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from src.main import app
from io import BytesIO


# Create test client
client = TestClient(app)


class TestAPIEndpoints:
    """Test suite for API endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint returns correct information"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "status" in data
        assert data["status"] == "running"
    
    def test_health_check_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
    
    def test_extract_bill_no_file(self):
        """Test bill extraction without providing a file"""
        response = client.post("/api/v1/bills/extract")
        assert response.status_code == 422  # Unprocessable Entity (validation error)
    
    def test_extract_bill_invalid_file_type(self):
        """Test bill extraction with invalid file type"""
        # Create a fake text file
        file_content = b"This is not a valid bill file"
        files = {
            'file': ('test.txt', BytesIO(file_content), 'text/plain')
        }
        
        response = client.post("/api/v1/bills/extract", files=files)
        assert response.status_code == 400
        assert "Invalid file type" in response.json()["detail"]
    
    def test_get_all_bills(self):
        """Test getting all bills"""
        response = client.get("/api/v1/bills")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "count" in data
        assert "data" in data
        assert isinstance(data["data"], list)
    
    def test_get_all_bills_with_pagination(self):
        """Test bills endpoint with pagination parameters"""
        response = client.get("/api/v1/bills?skip=0&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) <= 10
    
    def test_get_bill_by_id_not_found(self):
        """Test getting a non-existent bill"""
        response = client.get("/api/v1/bills/99999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_delete_bill_not_found(self):
        """Test deleting a non-existent bill"""
        response = client.delete("/api/v1/bills/99999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_bills_by_account(self):
        """Test getting bills by account number"""
        response = client.get("/api/v1/bills/account/123456")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
    
    def test_get_statistics(self):
        """Test getting bill statistics"""
        response = client.get("/api/v1/bills/stats/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        stats = data["data"]
        assert "total_bills" in stats
        assert "total_units_consumed" in stats
        assert "total_amount_due" in stats