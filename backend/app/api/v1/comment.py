"""
Comment API endpoints
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.connection import get_db
from app.core.dependencies import get_current_user, allow_min_role
from app.models.model import User
from app.core.enums import Role
from app.common.errors import NotFoundError, ClientErrors
from app.db.crud.comment_crud import (
    get_comments_by_issue_id,
    get_comment_by_id,
    create_comment,
    update_comment,
    delete_comment
)
from app.schemas.comment import (
    CommentCreateRequest,
    CommentUpdateRequest,
    CommentListResponse,
    CommentCreateResponse,
    CommentUpdateResponse,
    CommentDeleteResponse,
    CommentResponse
)

comment_router = APIRouter()


@comment_router.get("/issue/{issue_id}", response_model=CommentListResponse)
async def get_issue_comments(
    issue_id: int,
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Get all comments for an issue
    """
    comments = await get_comments_by_issue_id(issue_id, session)
    
    comment_data = []
    for comment in comments:
        comment_data.append(CommentResponse(
            id=comment.id,
            issue_id=comment.issue_id,
            user_id=comment.user_id,
            user_name=comment.user.name if comment.user else None,
            user_email=comment.user.email if comment.user else None,
            content=comment.content,
            edited=comment.edited,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        ))
    
    return CommentListResponse(
        data=comment_data,
        count=len(comment_data)
    )


@comment_router.post("/", response_model=CommentCreateResponse)
async def create_comment_api(
    request: CommentCreateRequest,
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Create a new comment
    """
    comment = await create_comment(
        session=session,
        issue_id=request.issue_id,
        user_id=current_user.id,
        content=request.content
    )
    
    return CommentCreateResponse(
        data=CommentResponse(
            id=comment.id,
            issue_id=comment.issue_id,
            user_id=comment.user_id,
            user_name=comment.user.name if comment.user else None,
            user_email=comment.user.email if comment.user else None,
            content=comment.content,
            edited=comment.edited,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        )
    )


@comment_router.put("/{comment_id}", response_model=CommentUpdateResponse)
async def update_comment_api(
    comment_id: int,
    request: CommentUpdateRequest,
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Update a comment
    """
    comment = await update_comment(
        session=session,
        comment_id=comment_id,
        user_id=current_user.id,
        content=request.content
    )
    
    return CommentUpdateResponse(
        data=CommentResponse(
            id=comment.id,
            issue_id=comment.issue_id,
            user_id=comment.user_id,
            user_name=comment.user.name if comment.user else None,
            user_email=comment.user.email if comment.user else None,
            content=comment.content,
            edited=comment.edited,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        )
    )


@comment_router.delete("/{comment_id}", response_model=CommentDeleteResponse)
async def delete_comment_api(
    comment_id: int,
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Delete a comment
    """
    await delete_comment(
        session=session,
        comment_id=comment_id,
        user_id=current_user.id
    )
    
    return CommentDeleteResponse()


@comment_router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment_api(
    comment_id: int,
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Get comment details by ID
    """
    comment = await get_comment_by_id(comment_id, session)
    if not comment:
        raise NotFoundError(message="Comment not found")
    
    return CommentResponse(
        id=comment.id,
        issue_id=comment.issue_id,
        user_id=comment.user_id,
        user_name=comment.user.name if comment.user else None,
        user_email=comment.user.email if comment.user else None,
        content=comment.content,
        edited=comment.edited,
        created_at=comment.created_at,
        updated_at=comment.updated_at
    )
