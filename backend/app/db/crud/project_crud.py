from app.models.model import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select,or_,func,union,distinct
from app.core.security import hash_password,verify_password
from app.models.model import Project,ProjectMember
from sqlalchemy.orm import joinedload
from typing import Optional,List
from app.models.model import Project



async def get_all_projects(user_id:int,session:AsyncSession) -> List[Project]:
    """
    Get all projects of user
    """

    stmt = select(ProjectMember).filter(
        ProjectMember.user_id == user_id
    ).options(joinedload(ProjectMember.project))

    result = await session.execute(stmt)
    project_members = result.scalars().all()
    projects = [project_member.project for project_member in project_members]

    return projects


async def get_team_members_count(user_id:int,session:AsyncSession) -> int:
    """
    Get count of unique team members working under a manager.
    Counts distinct members from all projects where manager is involved (as member or creator).
    Excludes the manager from the count.
    """
    # Get project IDs where manager is a member
    projects_member = select(ProjectMember.project_id).where(
        ProjectMember.user_id == user_id
    )
    
    # Get project IDs where manager is creator
    projects_created = select(Project.id).where(
        Project.created_by == user_id
    )
    
    # Combine both using union
   
    all_project_ids = union(projects_member, projects_created).subquery()
    
    # Count distinct members from those projects (excluding manager)
    stmt = select(func.count(distinct(ProjectMember.user_id))).where(
        ProjectMember.project_id.in_(select(all_project_ids.columns.project_id)),
        ProjectMember.user_id != user_id  # Exclude manager from count
    )
    
    result = await session.execute(stmt)
    team_members_count = result.scalar() or 0
    return team_members_count

async def get_recent_projects(user_id:int,session:AsyncSession,limit:int=5) -> List[Project]:
    """
    Get recent projects of user
    """

    project_ids = select(ProjectMember.project_id).where(
        ProjectMember.user_id == user_id
    )

    stmt = select(Project).where(
        Project.id.in_(project_ids)
    ).order_by(Project.updated_at.desc()).limit(limit)

    result = await session.execute(stmt)
    return list(result.scalars().all())