"""
Response formatting utilities
"""
from typing import Any, Dict, Optional
from datetime import datetime


def format_success_response(
    data: Any,
    message: str = "Operation successful",
    count: Optional[int] = None
) -> Dict[str, Any]:
    """
    Format a successful API response
    """
    response = {
        "success": True,
        "message": message,
        "data": data
    }
    
    if count is not None:
        response["count"] = count
    
    return response


def format_error_response(
    message: str,
    error_code: Optional[str] = None,
    details: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Format an error API response
    """
    response = {
        "success": False,
        "message": message
    }
    
    if error_code:
        response["error_code"] = error_code
    
    if details:
        response["details"] = details
    
    return response


def format_paginated_response(
    data: list,
    page: int,
    page_size: int,
    total: int,
    message: str = "Data fetched successfully"
) -> Dict[str, Any]:
    """
    Format a paginated API response
    """
    return {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0
        }
    }
