from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.connection import get_db
from app.core.dependencies import get_current_user, allow_min_role
from app.models.model import User
from app.common.errors import NotFoundError, DatabaseErrors, PermissionDeniedError
from app.core.enums import IssueStatus, Role
from app.schemas.issue import CreateIssueRequest, UpdateIssueRequest
from app.db.crud.logs_crud import get_logs_by_issue_id
from app.common.email_template import send_issue_assigned_mail, send_issue_status_update_mail
from app.common.logging import Logger
from app.db.crud.issue_crud import (
    get_all_issues,
    get_issue_by_id,
    create_issue,
    update_issue,
    delete_issue,
    get_user_issues,
    get_all_sub_issues
)
from app.db.crud.user import get_user_by_id
from app.services.email_service import send_email
from app.tasks.email_task import send_email_task
from app.services.redis_publisher import redis_publisher

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

    if issue_data.get('assigned_to'):
        user = await get_user_by_id(user_id=issue_data.get('assigned_to'), session=session)
        if user:
            issue = await get_issue_by_id(issue_id=created_issue.id, session=session)
            Logger.info(f"Issue assigned mail sent to {user.email}")
            await send_issue_assigned_mail(assigned_to=user, issue=issue, assigned_by=current_user)

    # Convert SQLAlchemy model to dict for Redis publishing
    issue_dict = {
        "id": created_issue.id,
        "name": created_issue.name,
        "description": created_issue.description,
        "status": created_issue.status.value if hasattr(created_issue.status, 'value') else str(created_issue.status),
        "priority": created_issue.priority.value if hasattr(created_issue.priority, 'value') else str(created_issue.priority),
        "type": created_issue.type.value if hasattr(created_issue.type, 'value') else str(created_issue.type),
        "assigned_to": created_issue.assigned_to,
        "assigned_by": created_issue.assigned_by,
        "project_id": created_issue.project_id,
        "sprint_id": created_issue.sprint_id,
        "story_point": created_issue.story_point,
        "time_estimate": float(created_issue.time_estimate) if created_issue.time_estimate else None,
        "created_at": created_issue.created_at.isoformat() if created_issue.created_at else None,
        "updated_at": created_issue.updated_at.isoformat() if created_issue.updated_at else None,
    }
    
    # publish issue update to redis pub/sub
    await redis_publisher.publish_issue_created(project_id=created_issue.project_id, issue_data=issue_dict)



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
    issue_status = issue_data.get('status', None)

    if issue_status and issue_status == IssueStatus.COMPLETED and current_user.role == Role.EMPLOYEE:
        raise PermissionDeniedError(message="You are not authorized to update issue status", response_code=status.HTTP_403_FORBIDDEN)
    
    # Get the issue before updating to capture old status
    old_issue = await get_issue_by_id(issue_id=issue_id, session=session)
    if not old_issue:
        raise NotFoundError(message="Issue not found", response_code=status.HTTP_404_NOT_FOUND)
    
    old_status = old_issue.status.value if hasattr(old_issue.status, 'value') else str(old_issue.status)
    
    updated_issue = await update_issue(session=session, issue_id=issue_id, payload=issue_data)

    if not updated_issue:
        raise DatabaseErrors(message="Failed to update issue", response_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Reload issue with all relationships for email
    updated_issue = await get_issue_by_id(issue_id=issue_id, session=session)
    if not updated_issue:
        raise DatabaseErrors(message="Failed to reload updated issue", response_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Convert SQLAlchemy model to dict for Redis publishing
    issue_dict = {
        "id": updated_issue.id,
        "name": updated_issue.name,
        "description": updated_issue.description,
        "status": updated_issue.status.value if hasattr(updated_issue.status, 'value') else str(updated_issue.status),
        "priority": updated_issue.priority.value if hasattr(updated_issue.priority, 'value') else str(updated_issue.priority),
        "type": updated_issue.type.value if hasattr(updated_issue.type, 'value') else str(updated_issue.type),
        "assigned_to": updated_issue.assigned_to,
        "assigned_by": updated_issue.assigned_by,
        "project_id": updated_issue.project_id,
        "sprint_id": updated_issue.sprint_id,
        "story_point": updated_issue.story_point,
        "time_estimate": float(updated_issue.time_estimate) if updated_issue.time_estimate else None,
        "created_at": updated_issue.created_at.isoformat() if updated_issue.created_at else None,
        "updated_at": updated_issue.updated_at.isoformat() if updated_issue.updated_at else None,
        "assignee": {
            "id": updated_issue.assignee.id,
            "name": updated_issue.assignee.name
        } if updated_issue.assignee else None,
        "reporter": {
            "id": updated_issue.reporter.id,
            "name": updated_issue.reporter.name
        } if updated_issue.reporter else None,
    }
    
    # publish issue update to redis pub/sub
    print(f"[ISSUE UPDATE] Publishing issue update to Redis for project {updated_issue.project_id}, issue {updated_issue.id}")
    # Add updated_by information for notifications
    issue_dict_with_user = {
        **issue_dict,
        "updated_by": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email
        }
    }
    await redis_publisher.publish_issue_update(project_id=updated_issue.project_id, issue_data=issue_dict_with_user)
    print(f"[ISSUE UPDATE] Published issue update to Redis for project {updated_issue.project_id}, issue {updated_issue.id}")

    # Send status update email if status changed
    if issue_status and old_status != updated_issue.status.value:
        recipients = []
        
        # Add assignee if exists
        if updated_issue.assignee and updated_issue.assignee.id != current_user.id:
            recipients.append(updated_issue.assignee)
        
        # Add reporter if exists and different from assignee and current user
        if updated_issue.reporter:
            if updated_issue.reporter.id != current_user.id and updated_issue.reporter.id != (updated_issue.assignee.id if updated_issue.assignee else None):
                recipients.append(updated_issue.reporter)
        
        # Add current user if not already in recipients
        if current_user.id not in [r.id for r in recipients]:
            recipients.append(current_user)
        
        if recipients:
            await send_issue_status_update_mail(
                issue=updated_issue,
                old_status=old_status,
                updated_by=current_user,
                recipients=recipients
            )
    
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
    issue = await get_issue_by_id(issue_id=issue_id, session=session)
    if not issue:
        raise NotFoundError(message="Issue not found", response_code=status.HTTP_404_NOT_FOUND)

    success = await delete_issue(session = session, issue_id = issue_id)
    if not success:
        raise DatabaseErrors(message="Failed to delete issue", response_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # publish issue update to redis pub/sub
    await redis_publisher.publish_issue_deleted(project_id=issue.project_id, issue_id=issue_id)

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


@issue_router.get("/logs/{issue_id}")
async def get_logs_by_issue_api(
    issue_id:int,
    session:AsyncSession = Depends(get_db),
    current_user:User = Depends(allow_min_role(Role.EMPLOYEE))
):
    """
    Get logs by issue id
    """
    logs = await get_logs_by_issue_id(issue_id=issue_id, session=session)
    return {
        "success": True,
        "message": "Logs fetched successfully",
        "data": logs if logs else []
    }



   
    
# 1️⃣ Epic
# 2️⃣ Story
# 3️⃣ Task
# 4️⃣ Sub-task
# 5️⃣ Bug
# 6️⃣ Spike
# 7️⃣ Improvement