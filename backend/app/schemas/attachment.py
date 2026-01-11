from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class AttachmentResponse(BaseModel):
    """Response schema for attachment"""
    id: int
    issue_id: int
    file_name: str
    file_size: int
    file_type: str
    file_url: str
    uploaded_by: int
    uploader_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttachmentListResponse(BaseModel):
    """Response schema for list of attachments"""
    success: bool = True
    message: str = "Attachments fetched successfully"
    data: list[AttachmentResponse]
    count: int


class AttachmentUploadResponse(BaseModel):
    """Response schema for attachment upload"""
    success: bool = True
    message: str = "File uploaded successfully"
    data: AttachmentResponse


class AttachmentDeleteResponse(BaseModel):
    """Response schema for attachment deletion"""
    success: bool = True
    message: str = "Attachment deleted successfully"
