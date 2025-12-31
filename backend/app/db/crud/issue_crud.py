from app.models.model import Issue, Sprint, Project, ProjectMember
from app.core.enums import IssueStatus
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, delete
from sqlalchemy.orm import selectinload

from typing import List
from app.db.crud.project_crud import get_project_by_id
from app.common.errors import NotFoundError,ClientErrors
async def get_all_active_issues(user_id: int, session: AsyncSession) -> List[Issue]:
    """
    Get all active issues from projects where manager is involved.
    Active issues = issues with status TODO, IN_PROGRESS, HOLD, QA (not COMPLETED or CANCELLED)
    """
    # Get project IDs where manager is a member
    project_ids = select(ProjectMember.project_id).where(
        ProjectMember.user_id == user_id
    )
    
    # Get issues in sprints of those projects
    # Active statuses: TODO, IN_PROGRESS, HOLD, QA (exclude COMPLETED, CANCELLED)
    stmt = select(Issue).where(
        Issue.sprint_id.in_(
            select(Sprint.id).where(
                Sprint.project_id.in_(project_ids)
            )
        ),
        Issue.status.in_([
            IssueStatus.TODO,
            IssueStatus.IN_PROGRESS,
            IssueStatus.HOLD
        ])
    )
    
    result = await session.execute(stmt)
    issues = result.scalars().all()
    return list(issues)

async def get_all_issues(user_id: int, session: AsyncSession) -> List[Issue]:
    """
    Get all issues related to the user.
    """
    stmt = select(Issue).where(
        or_(
            Issue.assigned_to == user_id,
            Issue.assigned_by == user_id
        )
    ).options(
        selectinload(Issue.assignee),
        selectinload(Issue.reporter),
        selectinload(Issue.project),
        selectinload(Issue.sprint)
    ).order_by(
        Issue.updated_at.desc()
    )
    
    result = await session.execute(stmt)
    issues = result.scalars().all()
    return list(issues)


async def get_issue_by_id(issue_id:int,session:AsyncSession) -> Issue:
    """
    Get an issue by id
    """
    # issue_stmt = select(Issue).where(Issue.id == issue_id).options(
    #     selectinload(Issue.assignee),
    #     selectinload(Issue.reporter),
    #     selectinload(Issue.project),
    #     selectinload(Issue.sprint)
    # )
    issue_stmt = select(Issue).where(Issue.id == issue_id)

    result = await session.execute(issue_stmt)
    issue = result.scalar_one_or_none()

    return issue

async def create_issue(session:AsyncSession,user_id:int,payload:dict) -> Issue:
    """
    Function to create a new issue in the database
    """

    project_id = payload['project_id']
    if not project_id:
        raise ClientErrors(message="Project ID is required")
    
    project = await get_project_by_id(project_id,user_id,session)
    if not project:
        raise NotFoundError(message="Project not found or you don't have access to it")
    
    issue = Issue(**payload,assigned_by = user_id)

   

    session.add(issue)
    await session.commit()
    await session.refresh(issue)
    return issue 

async def update_issue(
    session:AsyncSession,
    issue_id:int,
    payload:dict,
) -> Issue:
    """
    Update an issue by id
    """
    issue = await get_issue_by_id(issue_id=issue_id,session=session)
    if not issue:
        raise NotFoundError(message = "Issue not found")

    for key, value in payload.items():
        setattr(issue, key, value)
    
    session.add(issue)
    await session.commit()
    await session.refresh(issue)
    return issue

async def delete_issue(session:AsyncSession,issue_id:int)->bool:
    """
    Function to Delete an issue by id
    """
    issue = await get_issue_by_id(issue_id=issue_id,session=session)
    if not issue:
        raise NotFoundError(message="Issue not found")

    await session.delete(issue)
    await session.commit()
    return True

async def get_user_issues(user_id:int,session:AsyncSession) -> List[Issue]:
    """
    Get all issues for a user
    """
    # stmt = select(Issue).where(Issue.assigned_to == user_id).options(
    #     selectinload(Issue.assignee),
    #     selectinload(Issue.reporter),
    #     selectinload(Issue.project),
    #     selectinload(Issue.sprint)
    # )
    stmt = select(Issue).where(Issue.assigned_to == user_id)
    result = await session.execute(stmt)
    issues = result.scalars().all()
    return list(issues)

async def get_all_sub_issues(issue_id:int,session:AsyncSession) -> List[Issue]:
    """
    Function to get all sub issues of an issues
    """

    stmt = select(Issue).where(
        Issue.parent_issue_id == issue_id,
    )

    result = await session.execute(stmt)
    sub_issues = result.scalars().all()
    return list(sub_issues)
