from app.models.model import Issue, Sprint, Project, ProjectMember
from app.core.enums import IssueStatus
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

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
