"""
CRUD operations for comments
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.models.model import Comment, Issue, User
from app.common.errors import NotFoundError, ClientErrors


async def get_comments_by_issue_id(
    issue_id: int,
    session: AsyncSession
) -> List[Comment]:
    """
    Get all comments for an issue
    """
    stmt = select(Comment).where(
        Comment.issue_id == issue_id
    ).options(
        selectinload(Comment.user)
    ).order_by(
        Comment.created_at.asc()
    )
    
    result = await session.execute(stmt)
    comments = result.scalars().all()
    return list(comments)


async def get_comment_by_id(
    comment_id: int,
    session: AsyncSession
) -> Optional[Comment]:
    """
    Get a comment by ID
    """
    stmt = select(Comment).where(
        Comment.id == comment_id
    ).options(
        selectinload(Comment.user),
        selectinload(Comment.issue)
    )
    
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_comment(
    session: AsyncSession,
    issue_id: int,
    user_id: int,
    content: str
) -> Comment:
    """
    Create a new comment
    """
    # Verify issue exists
    issue_stmt = select(Issue).where(Issue.id == issue_id)
    issue_result = await session.execute(issue_stmt)
    issue = issue_result.scalar_one_or_none()
    
    if not issue:
        raise NotFoundError(message="Issue not found")
    
    comment = Comment(
        issue_id=issue_id,
        user_id=user_id,
        content=content,
        edited=False
    )
    
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    
    # Reload with relationships
    return await get_comment_by_id(comment.id, session)


async def update_comment(
    session: AsyncSession,
    comment_id: int,
    user_id: int,
    content: str
) -> Comment:
    """
    Update a comment
    Only the comment author can update
    """
    comment = await get_comment_by_id(comment_id, session)
    
    if not comment:
        raise NotFoundError(message="Comment not found")
    
    if comment.user_id != user_id:
        raise ClientErrors(message="You can only edit your own comments")
    
    comment.content = content
    comment.edited = True
    
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    
    # Reload with relationships
    return await get_comment_by_id(comment.id, session)


async def delete_comment(
    session: AsyncSession,
    comment_id: int,
    user_id: int
) -> bool:
    """
    Delete a comment
    Only the comment author can delete
    """
    comment = await get_comment_by_id(comment_id, session)
    
    if not comment:
        raise NotFoundError(message="Comment not found")
    
    if comment.user_id != user_id:
        raise ClientErrors(message="You can only delete your own comments")
    
    await session.delete(comment)
    await session.commit()
    
    return True
