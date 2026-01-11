"""
Attachment API endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.connection import get_db
from app.core.dependencies import get_current_user, allow_min_role
from app.models.model import User
from app.core.enums import Role
from app.common.errors import NotFoundError, ClientErrors, DatabaseErrors
from app.db.crud.attachment_crud import (
    get_attachments_by_issue_id,
    get_attachment_by_id,
    create_attachment,
    delete_attachment
)
from app.services.cloudinary_service import CloudinaryService
from app.schemas.attachment import (
    AttachmentListResponse,
    AttachmentUploadResponse,
    AttachmentDeleteResponse,
    AttachmentResponse
)
from app.utils.file_validator import validate_file, format_file_size, sanitize_filename
from app.db.crud.issue_crud import get_issue_by_id
import uuid

attachment_router = APIRouter()
cloudinary_service = CloudinaryService()


@attachment_router.get("/issue/{issue_id}", response_model=AttachmentListResponse)
async def get_issue_attachments(
    issue_id: int,
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Get all attachments for an issue
    """
    # Verify issue exists
    issue = await get_issue_by_id(issue_id, session)
    if not issue:
        raise NotFoundError(message="Issue not found")
    
    attachments = await get_attachments_by_issue_id(issue_id, session)
    
    attachment_data = []
    for attachment in attachments:
        attachment_data.append(AttachmentResponse(
            id=attachment.id,
            issue_id=attachment.issue_id,
            file_name=attachment.file_name,
            file_size=attachment.file_size,
            file_type=attachment.file_type,
            file_url=attachment.file_url,
            uploaded_by=attachment.uploaded_by,
            uploader_name=attachment.uploader.name if attachment.uploader else None,
            created_at=attachment.created_at,
            updated_at=attachment.updated_at
        ))
    
    return AttachmentListResponse(
        data=attachment_data,
        count=len(attachment_data)
    )


@attachment_router.post("/issue/{issue_id}/upload", response_model=AttachmentUploadResponse)
async def upload_attachment(
    issue_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Upload an attachment to an issue
    """
    # Verify issue exists
    issue = await get_issue_by_id(issue_id, session)
    if not issue:
        raise NotFoundError(message="Issue not found")
    
    # Validate file
    is_valid, error_message = validate_file(file)
    if not is_valid:
        raise ClientErrors(message=error_message or "Invalid file")
    
    try:
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise ClientErrors(message="File size exceeds maximum allowed size of 10MB")
        
        # Sanitize filename for safe storage
        sanitized_filename = sanitize_filename(file.filename or "unnamed_file")
        
        # Generate unique public_id for Cloudinary
        public_id = f"zyro/attachments/issue_{issue_id}/{uuid.uuid4().hex}_{sanitized_filename}"
        
        # Upload to Cloudinary
        upload_result = await cloudinary_service.upload_from_bytes(
            file_bytes=file_content,
            public_id=public_id
        )
        
        # Extract URL and public_id from result
        if isinstance(upload_result, dict):
            file_url = upload_result.get('secure_url') or upload_result.get('url')
            cloudinary_public_id = upload_result.get('public_id')
        else:
            file_url = str(upload_result)
            cloudinary_public_id = public_id
        
        if not file_url:
            raise DatabaseErrors(message="Failed to upload file to storage")
        
        # Create attachment record (use original filename for display, sanitized for storage)
        attachment = await create_attachment(
            session=session,
            issue_id=issue_id,
            file_name=sanitized_filename,  # Use sanitized filename for storage
            file_size=file_size,
            file_type=file.content_type or "application/octet-stream",
            file_url=file_url,
            cloudinary_public_id=cloudinary_public_id,
            uploaded_by=current_user.id
        )
        
        return AttachmentUploadResponse(
            data=AttachmentResponse(
                id=attachment.id,
                issue_id=attachment.issue_id,
                file_name=attachment.file_name,
                file_size=attachment.file_size,
                file_type=attachment.file_type,
                file_url=attachment.file_url,
                uploaded_by=attachment.uploaded_by,
                uploader_name=attachment.uploader.name if attachment.uploader else None,
                created_at=attachment.created_at,
                updated_at=attachment.updated_at
            )
        )
        
    except Exception as e:
        raise DatabaseErrors(message=f"Failed to upload file: {str(e)}")


@attachment_router.delete("/{attachment_id}", response_model=AttachmentDeleteResponse)
async def delete_attachment_api(
    attachment_id: int,
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Delete an attachment
    """
    attachment = await get_attachment_by_id(attachment_id, session)
    if not attachment:
        raise NotFoundError(message="Attachment not found")
    
    try:
        # Delete from Cloudinary
        await cloudinary_service.delete_file(attachment.cloudinary_public_id)
    except Exception as e:
        # Log error but continue with database deletion
        pass
    
    # Delete from database
    await delete_attachment(session, attachment_id, current_user.id)
    
    return AttachmentDeleteResponse()


@attachment_router.get("/{attachment_id}", response_model=AttachmentResponse)
async def get_attachment_api(
    attachment_id: int,
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Get attachment details by ID
    """
    attachment = await get_attachment_by_id(attachment_id, session)
    if not attachment:
        raise NotFoundError(message="Attachment not found")
    
    return AttachmentResponse(
        id=attachment.id,
        issue_id=attachment.issue_id,
        file_name=attachment.file_name,
        file_size=attachment.file_size,
        file_type=attachment.file_type,
        file_url=attachment.file_url,
        uploaded_by=attachment.uploaded_by,
        uploader_name=attachment.uploader.name if attachment.uploader else None,
        created_at=attachment.created_at,
        updated_at=attachment.updated_at
    )
