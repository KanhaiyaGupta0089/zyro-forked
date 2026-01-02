from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.connection import get_db
from app.core.dependencies import get_current_user
from app.models.model import User, Issue, Sprint, ProjectMember, Project
from app.db.crud.user import get_user_by_id
from app.core.enums import Role, IssueStatus, Priority, SprintStatus
from app.common.errors import NotFoundError, PermissionDeniedError
from app.db.crud.project_crud import get_all_projects
from app.db.crud.dashboard_crud import (
    get_recent_projects_dashboard_data,
    get_recent_issues_dashboard_data
)
from sqlalchemy import select, func, or_, distinct
from app.core.dependencies import allow_min_role

dashboard_router = APIRouter()

@dashboard_router.get("/manager")
async def get_manager_dashboard(
    current_user: User = Depends(allow_min_role(Role.MANAGER)),
    session: AsyncSession = Depends(get_db)
):
    """
    Get manager dashboard data
    """

    user = await get_user_by_id(user_id=current_user.id, session=session)
    if not user:
        raise NotFoundError(message="User not found")

    
    
    cards_data = {
        "my_projects": 0,
        "active_issues": 0,
        "team_members": 0,
        "active_sprints": 0
    }
    
    # get all projects of manager
    my_projects = await get_all_projects(user_id=current_user.id, session=session)
    cards_data["my_projects"] = len(my_projects) if my_projects else 0

    # get all active issues of all projects aggregated
    project_ids = select(ProjectMember.project_id).where(
        ProjectMember.user_id == current_user.id
    )
    
    active_issues_stmt = select(Issue).where(
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
    
    active_issues_result = await session.execute(active_issues_stmt)
    active_issues = active_issues_result.scalars().all()
    cards_data["active_issues"] = len(active_issues) if active_issues else 0

    # count all team members in manager team
    team_members_stmt = select(func.count(distinct(ProjectMember.user_id))).where(
        ProjectMember.project_id.in_(
            select(ProjectMember.project_id).where(
                ProjectMember.user_id == current_user.id
            )
        )
    )
    team_members_result = await session.execute(team_members_stmt)
    team_members_count = team_members_result.scalar() or 0
    cards_data["team_members"] = team_members_count

    # get all active sprints of all projects under manager
    active_sprints_stmt = select(Sprint).where(
        Sprint.project_id.in_(project_ids),
        Sprint.status.in_([
            SprintStatus.IN_PROGRESS,
            SprintStatus.TODO
        ])
    )
    active_sprints_result = await session.execute(active_sprints_stmt)
    active_sprints = active_sprints_result.scalars().all()
    cards_data["active_sprints"] = len(active_sprints) if active_sprints else 0

    recent_projects = await get_recent_projects_dashboard_data(user_id=current_user.id, session=session)
    recent_issues = await get_recent_issues_dashboard_data(user_id=current_user.id, session=session)

    data_json = {
        "cards": cards_data,
        "recent_projects": recent_projects,
        "recent_issues": recent_issues,
    }

    return {
        "success": True,
        "message": "Manager Dashboard data fetched successfully",
        "data": data_json
    }
@dashboard_router.get("/employee")
async def get_employee_dashboard(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Get employee dashboard data
    """
    user_id = user.id
    
    # Get urgent issues assigned to user
    stmt = (select(Issue).join(Sprint).where(
        Issue.assigned_to == user_id,
        Issue.status != IssueStatus.COMPLETED,
        Sprint.end_date >= func.current_date()
    )
    .order_by(Sprint.end_date.asc())
    .limit(4))

    result = await db.execute(stmt)
    urgent_issues = result.scalars().all()

    # Get projects for user
    project_query = (
        select(Project.name)  
        .join(ProjectMember, Project.id == ProjectMember.project_id) 
        .where(ProjectMember.user_id == user_id)  
    )

    project_result = await db.execute(project_query)
    project_names = project_result.scalars().all()
    
    # Get task statistics
    task_stats_stmt = select(
        func.count().filter(Issue.priority == Priority.CRITICAL).label("critical"),
        func.count().filter(Issue.status == IssueStatus.IN_PROGRESS).label("active"),
        func.count().filter(Issue.status == IssueStatus.TODO).label("pending"),
    ).where(Issue.assigned_to == user_id)

    stats_result = await db.execute(task_stats_stmt)
    stats = stats_result.one()

    return {
        "success": True,
        "message": "Employee Dashboard data fetched successfully",
        "data": {
            "critical_issue": stats.critical or 0,
            "active_issue": stats.active or 0,
            "pending_issue": stats.pending or 0,
            "total_project": len(project_names) if project_names else 0,
            "urgent_issue": len(urgent_issues) if urgent_issues else 0,
        }
    }

    
    

    
    