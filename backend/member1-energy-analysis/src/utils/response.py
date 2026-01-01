"""
Standardized API response utilities
"""
from typing import Any, Optional, Dict
from fastapi.responses import JSONResponse


class ResponseFormatter:
    """Format API responses consistently"""
    
    @staticmethod
    def success(
        message: str,
        data: Any = None,
        status_code: int = 200
    ) -> Dict:
        """
        Format success response
        
        Args:
            message: Success message
            data: Response data
            status_code: HTTP status code
            
        Returns:
            Formatted response dictionary
        """
        response = {
            "success": True,
            "message": message,
        }
        
        if data is not None:
            response["data"] = data
            
        return response
    
    @staticmethod
    def error(
        message: str,
        error: Optional[str] = None,
        status_code: int = 400
    ) -> Dict:
        """
        Format error response
        
        Args:
            message: Error message
            error: Detailed error information
            status_code: HTTP status code
            
        Returns:
            Formatted error response dictionary
        """
        response = {
            "success": False,
            "message": message,
        }
        
        if error:
            response["error"] = error
            
        return response