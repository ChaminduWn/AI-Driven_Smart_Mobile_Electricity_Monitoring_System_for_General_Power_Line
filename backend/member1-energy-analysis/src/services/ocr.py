import pytesseract
from PIL import Image
import cv2
import numpy as np
from typing import Optional
import PyPDF2
import io
from src.config import settings

class OCRService:
    """Service for extracting text from images and PDFs"""
    
    def __init__(self):
        if settings.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
    
    def extract_text_from_image(self, image_path: str) -> str:
        """Extract text from an image file"""
        try:
            # Read image
            img = cv2.imread(image_path)
            
            # Preprocess image
            processed_img = self._preprocess_image(img)
            
            # Extract text
            text = pytesseract.image_to_string(
                processed_img, 
                lang=settings.OCR_LANG,
                config='--psm 6'
            )
            
            return text.strip()
        except Exception as e:
            raise Exception(f"Error extracting text from image: {str(e)}")
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from a PDF file"""
        try:
            text = ""
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Extract text from all pages
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            # If PDF text extraction failed, try OCR on converted images
            if not text.strip():
                text = self._ocr_pdf_pages(pdf_path)
            
            return text.strip()
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")
    
    def _preprocess_image(self, img: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
        
        return denoised
    
    def _ocr_pdf_pages(self, pdf_path: str) -> str:
        """OCR individual PDF pages as images"""
        # This is a placeholder - you'd need pdf2image library for full implementation
        # For now, return empty string
        return ""
    
    def extract_text(self, file_path: str, file_type: str) -> str:
        """Main method to extract text based on file type"""
        file_type = file_type.lower()
        
        if file_type == 'pdf':
            return self.extract_text_from_pdf(file_path)
        elif file_type in ['jpg', 'jpeg', 'png']:
            return self.extract_text_from_image(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")