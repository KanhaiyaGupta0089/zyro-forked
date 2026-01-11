from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class CommentCreateRequest(BaseModel):
    """Request schema for creating a comment"""
    issue_id: int = Field(..., description="ID of the issue")
    content: str = Field(..., min_length=1, max_length=5000, description="Comment content")

    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Comment content cannot be empty')
        return v.strip()


class CommentUpdateRequest(BaseModel):
    """Request schema for updating a comment"""
    content: str = Field(..., min_length=1, max_length=5000, description="Updated comment content")

    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Comment content cannot be empty')
        return v.strip()


class CommentResponse(BaseModel):
    """Response schema for comment"""
    id: int
    issue_id: int
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    content: str
    edited: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommentListResponse(BaseModel):
    """Response schema for list of comments"""
    success: bool = True
    message: str = "Comments fetched successfully"
    data: list[CommentResponse]
    count: int


class CommentCreateResponse(BaseModel):
    """Response schema for comment creation"""
    success: bool = True
    message: str = "Comment created successfully"
    data: CommentResponse


class CommentUpdateResponse(BaseModel):
    """Response schema for comment update"""
    success: bool = True
    message: str = "Comment updated successfully"
    data: CommentResponse


class CommentDeleteResponse(BaseModel):
    """Response schema for comment deletion"""
    success: bool = True
    message: str = "Comment deleted successfully"
