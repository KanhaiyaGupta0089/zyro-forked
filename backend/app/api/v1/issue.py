from app.services.email_service import send_email
from app.tasks.email_task import send_email_task
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.connection import get_db
from app.core.dependencies import get_current_user, allow_min_role
from app.models.model import User
from app.common.errors import NotFoundError,DatabaseErrors,PermissionDeniedError
from app.core.enums import IssueStatus
from fastapi import status
from app.schemas.issue import CreateIssueRequest,UpdateIssueRequest
from app.core.enums import Role
from typing import List
from app.db.crud.issue_crud import (
    get_all_issues,
    get_issue_by_id,
    create_issue,
    update_issue,
    delete_issue,
    get_user_issues,
    get_all_sub_issues
)

issue_router = APIRouter()

@issue_router.get("/")  
async def get_all_issues_api(
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Get all issues for the current user
    """
    if current_user.role == Role.EMPLOYEE:
        issues = await get_user_issues(
            user_id = current_user.id,
            session = session
        )
    else:
        issues = await get_all_issues(
        user_id = current_user.id,
        session = session
    )

    return {
        "success": True,
        "issue_count": len(issues),
        "message": "Issues fetched successfully",
        "data": issues if issues else []
    }

@issue_router.get("/{issue_id}")
async def get_issue_by_id_api(
    issue_id:int,
    session:AsyncSession = Depends(get_db),
):
    """
    Get an issue by id
    """
    issue = await get_issue_by_id(
        issue_id = issue_id,
        session = session
    )
    if not issue:
        raise NotFoundError(message="Issue not found", response_code=status.HTTP_404_NOT_FOUND)

    
    return {
        "success": True,
        "message": "Issue fetched successfully",
        "data": issue
    }

@issue_router.post("/")
async def create_issue_api(
    request:CreateIssueRequest,
    session:AsyncSession = Depends(get_db),
    current_user:User = Depends(get_current_user),
):
    """
    Create a new issue
    """
    issue_data = request.model_dump()
    created_issue = await create_issue(     
        session = session,  
        user_id = current_user.id,
        payload = issue_data
    )

    if not created_issue:
        raise DatabaseErrors(message="Failed to create issue", response_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return {
        "success": True,
        "message": "Issue created successfully",
        "data": created_issue
    }

@issue_router.put("/{issue_id}")
async def update_issue_api(
    request:UpdateIssueRequest,
    issue_id:int,
    session:AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
):
    """
    Update an issue by id
    """
    issue_data = request.model_dump(exclude_unset=True, exclude_none=True)
    print(issue_data)
    issue_status = issue_data.get('status',None)


    if issue_status and issue_status == IssueStatus.COMPLETED and current_user.role == Role.EMPLOYEE:
        raise PermissionDeniedError(message="You are not authorized to update issue status", response_code=status.HTTP_403_FORBIDDEN)
    
    updated_issue = await update_issue(session=session,issue_id=issue_id,payload=issue_data)

    if not updated_issue:
        raise DatabaseErrors(message="Failed to update issue", response_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    subject = "Issue Status Updated"
    body = f"""
Hi,
your related issue status updated to {issue_data['status']}
"""
    send_email_task.delay(subject=subject,body= body , to_email=[current_user.email])
    return {
        "success": True,
        "message": "Issue updated successfully",
        "data": updated_issue
    }   

@issue_router.delete("/{issue_id}")
async def delete_issue_api(
    issue_id:int,
    session:AsyncSession = Depends(get_db),
    current_user:User = Depends(allow_min_role(Role.MANAGER))
):
    """
    Delete an issue by id
    """

    success = await delete_issue(session = session, issue_id = issue_id)
    if not success:
        raise DatabaseErrors(message="Failed to delete issue", response_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return {
        "success": True,
        "message": "Issue deleted successfully",
    }

@issue_router.get("/sub-issues/{issue_id}")
async def get_all_sub_issues_api(
    issue_id:int,
    session:AsyncSession = Depends(get_db),
    current_user:User = Depends(allow_min_role(Role.EMPLOYEE))
):
    """
    Get all sub issues for a given issue
    """

    sub_issues = await get_all_sub_issues(
        issue_id=issue_id,
        session=session
    )

    return {
        "success": True,
        "message": "Sub issues fetched successfully",
        "data": sub_issues if sub_issues else []
    }




   
    
