"""
File validation utilities
"""
import re
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException, status

# Maximum file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

# Allowed file types
ALLOWED_EXTENSIONS = {
    # Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    # Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # .xlsx
    # Text
    'text/plain', 'text/csv',
    # Archives
    'application/zip', 'application/x-rar-compressed',
    # Code
    'text/javascript', 'application/json', 'text/x-python',
}

ALLOWED_EXTENSIONS_BY_EXT = {
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.txt', '.csv', '.zip', '.rar',
    '.js', '.json', '.py', '.ts', '.tsx', '.jsx',
}


def validate_file(
    file: UploadFile,
    max_size: int = MAX_FILE_SIZE,
    allowed_types: Optional[set] = None
) -> Tuple[bool, Optional[str]]:
    """
    Validate uploaded file
    
    Returns:
        (is_valid, error_message)
    """
    if allowed_types is None:
        allowed_types = ALLOWED_EXTENSIONS
    
    # Check file size
    if hasattr(file, 'size') and file.size and file.size > max_size:
        return False, f"File size exceeds maximum allowed size of {max_size / (1024 * 1024):.1f}MB"
    
    # Check content type
    if file.content_type and file.content_type not in allowed_types:
        # Fallback: check file extension
        if file.filename:
            ext = '.' + file.filename.rsplit('.', 1)[-1].lower()
            if ext not in ALLOWED_EXTENSIONS_BY_EXT:
                return False, f"File type not allowed. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS_BY_EXT))}"
    elif not file.content_type:
        # If no content type, check extension
        if file.filename:
            ext = '.' + file.filename.rsplit('.', 1)[-1].lower()
            if ext not in ALLOWED_EXTENSIONS_BY_EXT:
                return False, f"File type not allowed. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS_BY_EXT))}"
        else:
            return False, "File type could not be determined"
    
    # Filename validation - allow most characters, we'll sanitize it when storing
    # Only reject truly dangerous characters that could cause security issues
    if file.filename:
        # Check for path traversal attempts
        if '..' in file.filename or '/' in file.filename or '\\' in file.filename:
            return False, "Filename contains invalid characters (path separators not allowed)"
        
        # Check for null bytes or control characters
        if '\x00' in file.filename or any(ord(c) < 32 and c not in '\t\n\r' for c in file.filename):
            return False, "Filename contains invalid control characters"
    
    return True, None


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe storage
    Removes or replaces problematic characters while preserving readability
    """
    if not filename:
        return "unnamed_file"
    
    # Remove path components
    filename = filename.replace('..', '').replace('/', '_').replace('\\', '_')
    
    # Replace problematic characters with underscores
    # Keep: letters, numbers, dots, dashes, underscores, spaces, parentheses, brackets
    sanitized = re.sub(r'[^\w\s.\-()\[\]]+', '_', filename)
    
    # Remove leading/trailing dots and spaces (Windows doesn't like these)
    sanitized = sanitized.strip('. ')
    
    # Limit length
    if len(sanitized) > 255:
        name, ext = sanitized.rsplit('.', 1) if '.' in sanitized else (sanitized, '')
        sanitized = name[:250] + ('.' + ext if ext else '')
    
    # Ensure it's not empty
    if not sanitized:
        sanitized = "unnamed_file"
    
    return sanitized


def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"
