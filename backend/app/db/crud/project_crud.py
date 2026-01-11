from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, union, distinct
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.attributes import flag_modified

from app.models.model import Project, ProjectMember, User
from app.common.errors import NotFoundError



async def get_all_projects(user_id:int,session:AsyncSession) -> List[Project]:
    """
    Get all projects of user
    """

    stmt = select(ProjectMember).filter(
        ProjectMember.user_id == user_id
    ).options(
        joinedload(ProjectMember.project)
    )

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

async def get_project_by_id(project_id:int,user_id:int,session:AsyncSession) -> Project:
    """
    Get a project by id
    """
    project_ids = select(ProjectMember.project_id).where(
        ProjectMember.user_id == user_id
    )

    stmt = select(Project).where(
        Project.id.in_(project_ids),
        Project.id == project_id
    )

    result = await session.execute(stmt)
    project = result.scalar_one_or_none()
    return project

async def create_project(session:AsyncSession,user_id:int,project_data:dict) -> Project:
    """
    Create a new project
    """

    if not user_id:
        raise ValueError("User ID is required")
    
    
    project = Project(**project_data,created_by = user_id)
   
    session.add(project)
    await session.flush()

    project_member = ProjectMember(
        project_id = project.id,
        user_id = user_id,
        organization_id = project_data['organization_id']
    )

    session.add(project_member)
    await session.commit()
    await session.refresh(project)
    await session.refresh(project_member)
    return project

async def update_project(
    session: AsyncSession,
    project_id: int,
    payload:dict,
    user_id: int
) -> Project:
    
    """
    Update a project by ID.
    
    """
    
    project = await get_project_by_id(project_id, user_id, session)
    if not project:
        raise NotFoundError(message="Project not found or you don't have access to it")
    
    
    excluded_fields = {'id', 'created_by', 'created_at', 'updated_at'}
    
    
    updated_fields = []
    for key, value in payload.items():
        if value is not None and key not in excluded_fields:
            if hasattr(project, key):
                setattr(project, key, value)
                # For JSONB fields, we need to flag them as modified
                if key == 'data' and isinstance(value, dict):
                    flag_modified(project, 'data')
                updated_fields.append(key)
    
    if not updated_fields:
        return project
    
    # Commit changes
    await session.commit()
    await session.refresh(project)
    
    return project

async def delete_project(session:AsyncSession,project_id:int,user_id:int)->bool:
    """
    Delete a project by ID.
    """

    project = await get_project_by_id(project_id,user_id,session)

    if not project:
        raise NotFoundError(message="Project not found or you don't have access to it")

    await session.delete(project)
    await session.commit()
    return True

