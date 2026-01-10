from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict
from sqlalchemy import func, select, case, or_, desc, distinct
from datetime import datetime, timezone

from app.db.crud.project_crud import get_recent_projects
from app.models.model import Project, Issue, Sprint, ProjectMember, User
from app.core.enums import IssueStatus, ProjectStatus, SprintStatus, Priority




async def get_recent_projects_dashboard_data(user_id:int,session:AsyncSession,limit:int=5) -> List[Dict]:
    """
    Get recent projects dashboard data - Optimized to avoid N+1 queries
    """
    recent_projects = await get_recent_projects(user_id=user_id,session=session,limit=limit)
    
    if not recent_projects:
        return []

    project_ids = [project.id for project in recent_projects]
    
    # Single optimized query to get all project stats at once
    # Use LEFT JOIN to handle projects with no issues
    project_stats_stmt = select(
        Project.id.label("project_id"),
        Project.name.label("project_name"),
        Project.status.label("project_status"),
        func.coalesce(func.sum(
            case(
                (Issue.status != IssueStatus.CANCELLED, Issue.story_point),
                else_=0
            )
        ), 0).label("total_points"),
        func.coalesce(func.sum(
            case(
                ((Issue.status == IssueStatus.COMPLETED) & (Issue.status != IssueStatus.CANCELLED), Issue.story_point),
                else_=0
            )
        ), 0).label("completed_points"),
        func.coalesce(func.count(
            case(
                (Issue.status != IssueStatus.CANCELLED, Issue.id),
                else_=None
            )
        ), 0).label("total_task"),
        func.coalesce(func.count(
            case(
                (Issue.status == IssueStatus.COMPLETED, Issue.id),
                else_=None
            )
        ), 0).label("task_completed")
    ).select_from(
        Project
    ).outerjoin(
        Sprint, Sprint.project_id == Project.id
    ).outerjoin(
        Issue, or_(
            Issue.sprint_id == Sprint.id,
            Issue.project_id == Project.id
        )
    ).where(
        Project.id.in_(project_ids)
    ).group_by(
        Project.id, Project.name, Project.status
    )
    
    result = await session.execute(project_stats_stmt)
    stats_rows = result.all()
    
    # Create a map for quick lookup
    stats_map = {row.project_id: row for row in stats_rows}
    
    # Build response maintaining original order
    recent_projects_data = []
    for project in recent_projects:
        stats = stats_map.get(project.id)
        
        if stats:
            total_points = float(stats.total_points) if stats.total_points else 0
            completed_points = float(stats.completed_points) if stats.completed_points else 0
            total_task = int(stats.total_task) if stats.total_task else 0
            task_completed = int(stats.task_completed) if stats.task_completed else 0
            
            if total_points > 0:
                percentage = int((completed_points / total_points) * 100)
                if stats.project_status != ProjectStatus.COMPLETED:
                    percentage = min(percentage, 99)
            else:
                percentage = 0
        else:
            total_task = 0
            task_completed = 0
            percentage = 0
        
        result_dict = {
            "project_id": project.id,
            "project_name": project.name,
            "total_task": total_task,
            "task_completed": task_completed,
            "project_completion_percentage": percentage,
        }
        recent_projects_data.append(result_dict)

    return recent_projects_data

async def get_recent_issues_dashboard_data(user_id:int,session:AsyncSession,limit:int=5) -> List[Dict]:
    """
    Get recent issues for dashboard data - Optimized with single query
    Issues from projects where user is involved, ordered by updated_at
    """
    # Get project IDs where user is a member
    project_ids_subquery = select(ProjectMember.project_id).where(
        ProjectMember.user_id == user_id
    ).subquery()
    
    # Optimized single query with all joins - no lazy loading needed
    recent_issues_stmt = select(
        Issue.id.label("task_id"),
        Issue.name.label("task_name"),
        Issue.status,
        Issue.updated_at,
        Issue.priority,
        Project.name.label("project_name"),
        User.name.label("assigned_to_name")
    ).select_from(
        Issue
    ).join(
        Sprint, Issue.sprint_id == Sprint.id
    ).join(
        Project, Sprint.project_id == Project.id
    ).outerjoin(
        User, Issue.assigned_to == User.id
    ).where(
        Sprint.project_id.in_(select(project_ids_subquery.c.project_id)),
        or_(
            Issue.assigned_to == user_id,
            Issue.assigned_by == user_id
        )
    ).order_by(
        desc(Issue.updated_at)
    ).limit(limit)

    recent_issue_result = await session.execute(recent_issues_stmt)
    recent_issues = recent_issue_result.all()

    recent_issues_data = []
    current_time = datetime.now(timezone.utc)

    for row in recent_issues:
        # Calculate hours ago
        hours_ago = 0
        if row.updated_at:
            hours_ago = int((current_time - row.updated_at).total_seconds() / 3600)
        
        # Get status value
        status_value = row.status.value if hasattr(row.status, 'value') else str(row.status)
        
        # Get priority value
        priority_value = row.priority.value if hasattr(row.priority, 'value') else str(row.priority) if row.priority else "medium"

        result_dict = {
            "task_id": row.task_id,
            "task_name": row.task_name,
            "project_name": row.project_name or "Unknown",
            "status": status_value,
            "priority": priority_value,
            "assigned_to": row.assigned_to_name or "Unassigned",
            "hours_ago": hours_ago
        }
        recent_issues_data.append(result_dict)

    return recent_issues_data


async def get_manager_dashboard_cards_data(user_id: int, session: AsyncSession) -> Dict:
    """
    Get manager dashboard cards data (counts for projects, issues, team members, sprints)
    """
    # Get project IDs once - reused across queries
    project_ids_subquery = select(ProjectMember.project_id).where(
        ProjectMember.user_id == user_id
    ).subquery()
    
    # 1. Count projects
    projects_count_stmt = select(func.count(ProjectMember.project_id)).where(
        ProjectMember.user_id == user_id
    )
    
    # 2. Count active issues (optimized - use joins instead of nested subqueries)
    active_issues_stmt = select(func.count(Issue.id)).join(
        Sprint, Issue.sprint_id == Sprint.id
    ).where(
        Sprint.project_id.in_(select(project_ids_subquery.c.project_id)),
        Issue.status.in_([
            IssueStatus.TODO,
            IssueStatus.IN_PROGRESS,
            IssueStatus.HOLD
        ])
    )
    
    # 3. Count team members (optimized - exclude manager)
    team_members_stmt = select(func.count(distinct(ProjectMember.user_id))).where(
        ProjectMember.project_id.in_(select(project_ids_subquery.c.project_id)),
        ProjectMember.user_id != user_id
    )
    
    # 4. Count active sprints (optimized - just count)
    active_sprints_stmt = select(func.count(Sprint.id)).where(
        Sprint.project_id.in_(select(project_ids_subquery.c.project_id)),
        Sprint.status.in_([
            SprintStatus.IN_PROGRESS,
            SprintStatus.TODO
        ])
    )
    
    # Execute all queries
    projects_result = await session.execute(projects_count_stmt)
    active_issues_result = await session.execute(active_issues_stmt)
    team_members_result = await session.execute(team_members_stmt)
    active_sprints_result = await session.execute(active_sprints_stmt)
    
    return {
        "my_projects": projects_result.scalar() or 0,
        "active_issues": active_issues_result.scalar() or 0,
        "team_members": team_members_result.scalar() or 0,
        "active_sprints": active_sprints_result.scalar() or 0
    }


async def get_employee_dashboard_data(user_id: int, session: AsyncSession) -> Dict:
    """
    Get employee dashboard data
    """
    # Get urgent issues assigned to user
    urgent_issues_stmt = select(Issue).join(
        Sprint, Issue.sprint_id == Sprint.id
    ).where(
        Issue.assigned_to == user_id,
        Issue.status != IssueStatus.COMPLETED,
        Sprint.end_date >= func.current_date()
    ).order_by(
        Sprint.end_date.asc()
    ).limit(4)
    
    urgent_issues_result = await session.execute(urgent_issues_stmt)
    urgent_issues = urgent_issues_result.scalars().all()
    
    # Get projects for user
    project_query = select(Project.name).join(
        ProjectMember, Project.id == ProjectMember.project_id
    ).where(
        ProjectMember.user_id == user_id
    )
    
    project_result = await session.execute(project_query)
    project_names = project_result.scalars().all()
    
    # Get task statistics
    task_stats_stmt = select(
        func.count().filter(Issue.priority == Priority.CRITICAL).label("critical"),
        func.count().filter(Issue.status == IssueStatus.IN_PROGRESS).label("active"),
        func.count().filter(Issue.status == IssueStatus.TODO).label("pending"),
    ).where(
        Issue.assigned_to == user_id
    )
    
    stats_result = await session.execute(task_stats_stmt)
    stats = stats_result.one()
    
    return {
        "critical_issue": stats.critical or 0,
        "active_issue": stats.active or 0,
        "pending_issue": stats.pending or 0,
        "total_project": len(project_names) if project_names else 0,
        "urgent_issue": len(urgent_issues) if urgent_issues else 0,
    }