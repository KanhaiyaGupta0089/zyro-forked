from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.connection import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.model import User, Project, Issue, Sprint
from app.schemas.auth import User as UserSchema
from app.core.enums import IssueStatus, UserStatus

router = APIRouter()

# Schema for dashboard statistics
class DashboardStatsResponse:
    def __init__(self, total_projects: int, active_issues: int, completed_issues: int, team_members: int):
        self.total_projects = total_projects
        self.active_issues = active_issues
        self.completed_issues = completed_issues
        self.team_members = team_members

# Schema for recent projects
class RecentProjectResponse:
    def __init__(self, id: int, name: str, status: str, last_updated: str, team_members: int, progress: int):
        self.id = id
        self.name = name
        self.status = status
        self.last_updated = last_updated
        self.team_members = team_members
        self.progress = progress

# Schema for recent issues
class RecentIssueResponse:
    def __init__(self, id: int, title: str, priority: str, status: str, assignee: str, created: str, project: str):
        self.id = id
        self.title = title
        self.priority = priority
        self.status = status
        self.assignee = assignee
        self.created = created
        self.project = project

@router.get("/stats", response_model=dict)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard statistics including total projects, active issues, completed issues, and team members
    """
    try:
        # Total projects
        total_projects_result = await db.execute(select(func.count(Project.id)))
        total_projects = total_projects_result.scalar()
        
        # Active issues (in progress or to do)
        active_issues_result = await db.execute(select(func.count(Issue.id)).filter(
            Issue.status.in_([IssueStatus.IN_PROGRESS, IssueStatus.TODO])
        ))
        active_issues = active_issues_result.scalar()
        
        # Completed issues
        completed_issues_result = await db.execute(select(func.count(Issue.id)).filter(
            Issue.status == IssueStatus.COMPLETED
        ))
        completed_issues = completed_issues_result.scalar()
        
        # Team members (active users)
        team_members_result = await db.execute(select(func.count(User.id)).filter(
            User.status == UserStatus.ACTIVE
        ))
        team_members = team_members_result.scalar()
        
        return {
            "total_projects": total_projects,
            "active_issues": active_issues,
            "completed_issues": completed_issues,
            "team_members": team_members
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")


@router.get("/recent-projects", response_model=List[dict])
async def get_recent_projects(
    db: AsyncSession = Depends(get_db),
    limit: int = 4
):
    """
    Get recent projects, limited to the most recently updated
    """
    try:
        recent_projects_result = await db.execute(
            select(Project).order_by(
                Project.updated_at.desc()
            ).limit(limit)
        )
        recent_projects = recent_projects_result.scalars().all()
        
        result = []
        for project in recent_projects:
            # Calculate progress percentage based on related issues or other metrics
            # This is a simplified calculation - you might want to implement a more complex logic
            # Check if project has sprints and they're loaded
            if hasattr(project, 'sprints') and project.sprints:
                sprint_ids = [sprint.id for sprint in project.sprints]
                
                if sprint_ids:
                    # Count total issues in sprints of this project
                    total_issues_result = await db.execute(
                        select(func.count(Issue.id)).filter(
                            Issue.sprint_id.in_(sprint_ids)
                        )
                    )
                    total_issues = total_issues_result.scalar() or 0
                    
                    # Count completed issues in sprints of this project
                    completed_issues_result = await db.execute(
                        select(func.count(Issue.id)).filter(
                            Issue.sprint_id.in_(sprint_ids),
                            Issue.status == IssueStatus.COMPLETED
                        )
                    )
                    completed_issues = completed_issues_result.scalar() or 0
                else:
                    total_issues = 0
                    completed_issues = 0
            else:
                # Load sprints separately if not already loaded
                total_issues_result = await db.execute(
                    select(func.count(Issue.id)).filter(
                        Issue.sprint_id.in_(
                            select(Sprint.id).where(Sprint.project_id == project.id).scalar_subquery()
                        )
                    )
                )
                total_issues = total_issues_result.scalar() or 0
                
                completed_issues_result = await db.execute(
                    select(func.count(Issue.id)).filter(
                        Issue.sprint_id.in_(
                            select(Sprint.id).where(Sprint.project_id == project.id)
                        ),
                        Issue.status == IssueStatus.COMPLETED
                    )
                )
                completed_issues = completed_issues_result.scalar() or 0
            
            progress = int((completed_issues / total_issues * 100)) if total_issues > 0 else 0
            
            # Get team members count for this project
            project_members_result = await db.execute(
                select(func.count(ProjectMember.id)).filter(
                    ProjectMember.project_id == project.id
                )
            )
            team_members = project_members_result.scalar() or 0
            
            result.append({
                "id": project.id,
                "name": project.name,
                "status": project.status.value if hasattr(project.status, 'value') else project.status,
                "last_updated": project.updated_at.isoformat() if project.updated_at else project.created_at.isoformat(),
                "team_members": team_members,
                "progress": progress
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recent projects: {str(e)}")


@router.get("/recent-issues", response_model=List[dict])
async def get_recent_issues(
    db: AsyncSession = Depends(get_db),
    limit: int = 4
):
    """
    Get recent issues, limited to the most recently created
    """
    try:
        recent_issues_result = await db.execute(
            select(Issue).order_by(
                Issue.created_at.desc()
            ).limit(limit)
        )
        recent_issues = recent_issues_result.scalars().all()
        
        result = []
        for issue in recent_issues:
            # Get assignee name
            assignee_name = "Unassigned"
            if issue.assigned_to_user:
                assignee_name = issue.assigned_to_user.name
            
            # Get project name
            project_name = "No Project"
            if issue.sprint and issue.sprint.project:
                project_name = issue.sprint.project.name
            
            result.append({
                "id": issue.id,
                "title": issue.name,
                "priority": issue.type.value if hasattr(issue.type, 'value') else str(issue.type),
                "status": issue.status.value if hasattr(issue.status, 'value') else issue.status,
                "assignee": assignee_name,
                "created": issue.created_at.isoformat() if issue.created_at else None,
                "project": project_name
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recent issues: {str(e)}")


@router.get("/", response_model=dict)
async def get_dashboard_data(
    db: AsyncSession = Depends(get_db)
):
    """
    Get all dashboard data in one request
    """
    try:
        # Get dashboard stats
        stats = await get_dashboard_stats(db)
        
        # Get recent projects
        recent_projects = await get_recent_projects(db, limit=4)
        
        # Get recent issues
        recent_issues = await get_recent_issues(db, limit=4)
        
        return {
            "stats": stats,
            "recent_projects": recent_projects,
            "recent_issues": recent_issues
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")