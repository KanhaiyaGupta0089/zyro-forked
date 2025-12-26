from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.crud.project_crud import get_recent_projects
from app.models.model import Project,Issue,Sprint,ProjectMember,User
from sqlalchemy  import func,select,case,or_,desc
from sqlalchemy.orm import joinedload,selectinload
from app.core.enums import IssueStatus
from app.core.enums import ProjectStatus
from typing import Dict
from datetime import datetime,timezone




async def get_recent_projects_dashboard_data(user_id:int,session:AsyncSession,limit:int=5) -> List[Dict]:
    """
    Get recent projects dashboard data
    """
    recent_projects = await get_recent_projects(user_id=user_id,session=session,limit=limit)

    recent_projects_data = []

    #TODO: Optimize the query
    
    for project in recent_projects:
        
        total_issue_stmt = select(
            func.sum(Issue.story_point).label("total_points"),
            func.sum(
                case(
                    (Issue.status == IssueStatus.COMPLETED,Issue.story_point),
                    else_ =0
                )
            ).label('completed_points')
        ).where(
            Issue.sprint_id.in_(
                select(Sprint.id).where(Sprint.project_id ==project.id)
            ),
            Issue.status.notin_([IssueStatus.CANCELLED])
        )
        

        result = await session.execute(total_issue_stmt)
        row = result.first()

        total_points = row.total_points if row.total_points else 0
        completed_points = row.completed_points if row.completed_points else 0

        if total_points>0:
            percentage = int((completed_points/total_points)*100)
            if project.status != ProjectStatus.COMPLETED:
                percentage = min(percentage,99)
        else:
            percentage = 0

        

        # Task Count for display
        task_stmt = select(func.count(Issue.id)).where(
            Issue.sprint_id.in_(
                select(Sprint.id).where(Sprint.project_id == project.id)
            ),
            Issue.status.notin_([IssueStatus.CANCELLED])
        )
        task_result =await session.execute(task_stmt)
        total_task = task_result.scalar() or 0

        completed_task_stmt = select(func.count(Issue.id)).where(
            Issue.sprint_id.in_(
                select(Sprint.id).where(Sprint.project_id == project.id)
            ),
            Issue.status == IssueStatus.COMPLETED
        )
        completed_task_result =await session.execute(completed_task_stmt)
        completed_task = completed_task_result.scalar() or 0

        result_dict = {
            "project_name":project.name,
            "total_task":total_task,
            "task_completed":completed_task,
            "project_completion_percentage":percentage,   # Based on the story points

        }
        recent_projects_data.append(result_dict)

    return recent_projects_data

async def get_recent_issues_dashboard_data(user_id:int,session:AsyncSession,limit:int=5) -> List[Dict]:
    """
    Get recent issues for dashboard data
    Issues from projects where user is involved, ordered by updated_at
    """
    # Get project IDs where user is a member
    project_ids = select(ProjectMember.project_id).where(
        ProjectMember.user_id == user_id
    )
    
    # Get issues with joins to avoid lazy loading
    recent_issues_stmt = select(Issue).join(
        Sprint, Issue.sprint_id == Sprint.id
    ).join(
        Project, Sprint.project_id == Project.id
    ).outerjoin(
        User, Issue.assigned_to == User.id
    ).where(
        Issue.sprint_id.in_(
            select(Sprint.id).where(
                Sprint.project_id.in_(project_ids)
            )
        ),
        or_(
            Issue.assigned_to == user_id,
            Issue.assigned_by == user_id
        )
    ).order_by(
        desc(Issue.updated_at)
    ).limit(limit).options(
        selectinload(Issue.sprint).selectinload(Sprint.project)
    )

    recent_issue_result = await session.execute(recent_issues_stmt)
    recent_issues = recent_issue_result.scalars().all()

    recent_issues_data = []

    for issue in recent_issues:
        # Calculate hours ago
        hours_ago = 0
        if issue.updated_at:
            hours_ago = int((datetime.now(timezone.utc) - issue.updated_at).total_seconds() / 3600)
        
        # Get project name (now eagerly loaded)
        project_name = "Unknown"
        if issue.sprint and issue.sprint.project:
            project_name = issue.sprint.project.name
        
        # Get assigned_to name
        assigned_to_name = "Unassigned"
        if issue.assignee:
            assigned_to_name = issue.assignee.name

        result_dict = {
            "task_id": issue.id,
            "task_name": issue.name,
            "project_name": project_name,
            "status": issue.status.value if hasattr(issue.status, 'value') else str(issue.status),
            "priority": "high",  # Add priority field to Issue model if needed
            "assigned_to": assigned_to_name,
            "hours_ago": hours_ago
        }
        recent_issues_data.append(result_dict)

    return recent_issues_data