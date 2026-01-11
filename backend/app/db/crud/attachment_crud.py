"""
CRUD operations for attachments
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.models.model import Attachment, Issue, User
from app.common.errors import NotFoundError, ClientErrors


async def get_attachments_by_issue_id(
    issue_id: int,
    session: AsyncSession
) -> List[Attachment]:
    """
    Get all attachments for an issue
    """
    stmt = select(Attachment).where(
        Attachment.issue_id == issue_id
    ).options(
        selectinload(Attachment.uploader)
    ).order_by(
        Attachment.created_at.desc()
    )
    
    result = await session.execute(stmt)
    attachments = result.scalars().all()
    return list(attachments)


async def get_attachment_by_id(
    attachment_id: int,
    session: AsyncSession
) -> Optional[Attachment]:
    """
    Get an attachment by ID
    """
    stmt = select(Attachment).where(
        Attachment.id == attachment_id
    ).options(
        selectinload(Attachment.uploader),
        selectinload(Attachment.issue)
    )
    
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_attachment(
    session: AsyncSession,
    issue_id: int,
    file_name: str,
    file_size: int,
    file_type: str,
    file_url: str,
    cloudinary_public_id: str,
    uploaded_by: int
) -> Attachment:
    """
    Create a new attachment record
    """
    # Verify issue exists
    issue_stmt = select(Issue).where(Issue.id == issue_id)
    issue_result = await session.execute(issue_stmt)
    issue = issue_result.scalar_one_or_none()
    
    if not issue:
        raise NotFoundError(message="Issue not found")
    
    attachment = Attachment(
        issue_id=issue_id,
        file_name=file_name,
        file_size=file_size,
        file_type=file_type,
        file_url=file_url,
        cloudinary_public_id=cloudinary_public_id,
        uploaded_by=uploaded_by
    )
    
    session.add(attachment)
    await session.commit()
    await session.refresh(attachment)
    
    # Reload with relationships
    return await get_attachment_by_id(attachment.id, session)


async def delete_attachment(
    session: AsyncSession,
    attachment_id: int,
    user_id: int
) -> bool:
    """
    Delete an attachment
    Only the uploader or issue assignee can delete
    """
    attachment = await get_attachment_by_id(attachment_id, session)
    
    if not attachment:
        raise NotFoundError(message="Attachment not found")
    
    # Check permissions: uploader or issue assignee
    if attachment.uploaded_by != user_id:
        # Check if user is assignee of the issue
        issue_stmt = select(Issue).where(Issue.id == attachment.issue_id)
        issue_result = await session.execute(issue_stmt)
        issue = issue_result.scalar_one_or_none()
        
        if not issue or issue.assigned_to != user_id:
            raise ClientErrors(message="You don't have permission to delete this attachment")
    
    # Delete from Cloudinary (handled in API layer)
    # Delete from database
    await session.delete(attachment)
    await session.commit()
    
    return True
