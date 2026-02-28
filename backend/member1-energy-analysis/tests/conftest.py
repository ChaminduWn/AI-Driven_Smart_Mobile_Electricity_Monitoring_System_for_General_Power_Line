"""
Pytest configuration and shared fixtures
"""
import pytest
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Add src to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.database import Base
from src.main import app
from src.config import settings


# Test database URL (in-memory SQLite for fast tests)
TEST_DATABASE_URL = "sqlite:///./test_energy.db"


@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine"""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Cleanup
    Base.metadata.drop_all(bind=engine)
    
    # Remove test database file
    if os.path.exists("test_energy.db"):
        os.remove("test_energy.db")


@pytest.fixture(scope="function")
def test_db(test_engine):
    """Create a test database session for each test"""
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine
    )
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def test_client():
    """Create a test client for API testing"""
    return TestClient(app)


@pytest.fixture(scope="function")
def sample_pdf_file():
    """Create a sample PDF file for testing"""
    import tempfile
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.pdf', delete=False) as f:
        f.write("%PDF-1.4 Test PDF content")
        temp_path = f.name
    
    yield temp_path
    
    # Cleanup
    if os.path.exists(temp_path):
        os.remove(temp_path)


@pytest.fixture(scope="function")
def sample_image_file():
    """Create a sample image file for testing"""
    import tempfile
    from PIL import Image
    import io
    
    # Create a simple test image
    img = Image.new('RGB', (100, 100), color='white')
    
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.jpg', delete=False) as f:
        img.save(f, format='JPEG')
        temp_path = f.name
    
    yield temp_path
    
    # Cleanup
    if os.path.exists(temp_path):
        os.remove(temp_path)


@pytest.fixture(autouse=True)
def create_upload_dirs():
    """Ensure upload directories exist for tests"""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    yield
    # Cleanup is optional - keep directories for inspection