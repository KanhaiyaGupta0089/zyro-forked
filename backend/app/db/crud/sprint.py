from app.models.model import Sprint
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select,func
from sqlalchemy.orm import selectinload
from typing import List,Dict
from app.core.enums import SprintStatus
from app.models.model import ProjectMember
from app.common.errors import NotFoundError

async def get_all_active_sprints(user_id:int,session:AsyncSession) -> List[Sprint]:
    """
    Get all active sprints of user
    """

    project_ids = select(ProjectMember.project_id).where(
        ProjectMember.user_id == user_id
    )
    
    # Get active sprints for those projects
    stmt = select(Sprint).where(
        Sprint.project_id.in_(project_ids),
        Sprint.status == SprintStatus.IN_PROGRESS
    )
    
    result = await session.execute(stmt)
    return list(result.scalars().all())
 
async def get_all_sprints(user_id:int,session:AsyncSession) -> List[Sprint]:
    """
    Get all sprints from the db for the current user
    """
    project_ids = select(ProjectMember.project_id).where(
        ProjectMember.user_id == user_id
    )
    
    # Get all sprints for those projects with relationships loaded
    stmt = select(Sprint).where(
        Sprint.project_id.in_(project_ids)
    ).options(
        selectinload(Sprint.project),
        selectinload(Sprint.issues)
    )
    
    result = await session.execute(stmt)
    sprints = result.scalars().all()
    return list(sprints)

async def get_sprint_by_id(sprint_id:int,session:AsyncSession) -> Sprint:
    """
    Get a sprint by id
    """
    stmt = select(Sprint).where(Sprint.id == sprint_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def create_sprint(session:AsyncSession,payload:dict) -> Sprint:
    """
    Create a new sprint
    """
    sprint_id = f"SPRINT-{select(func.max(Sprint.id)) + 1}"
    sprint = Sprint(**payload,sprint_id=sprint_id)
    session.add(sprint)
    await session.commit()
    await session.refresh(sprint)   
    return sprint

async def update_sprint(session:AsyncSession,sprint_id:int,payload:dict) -> Sprint:
    """
    Update a sprint
    """
    sprint = await get_sprint_by_id(sprint_id,session)
    if not sprint:
        raise NotFoundError(message="Sprint not found")
    for key,value in payload.items():
        setattr(sprint,key,value)
    await session.commit()
    await session.refresh(sprint)
    return sprint


async def delete_sprint(session:AsyncSession,sprint_id:int) -> bool:
    """
    Delete a sprint
    """
    sprint = await get_sprint_by_id(sprint_id,session)
    if not sprint:
        raise NotFoundError(message="Sprint not found")
    await session.delete(sprint)
    await session.commit()
    return True

async def get_sprint_dashboard(user_id:int,session:AsyncSession) -> Dict:
    """
    Get the sprint dashboard for the current user
    """
    # TODO = "todo"
    # IN_PROGRESS = "in_progress"
    # COMPLETED = "completed"
    # CANCELLED = "cancelled"
    # TRANSFERRED = "transferred"

    dashboard = {
        "total_sprints":0,
        "in_progress_sprints":0,
        "completed_sprints":0,
        "cancelled_sprints":0,
        "transferred_sprints":0,
    }

    total_sprints = await get_all_sprints(user_id=user_id,session=session)
    dashboard["total_sprints"] = len(total_sprints)
    for sprint in total_sprints:
        if sprint.status == SprintStatus.IN_PROGRESS:
            dashboard["in_progress_sprints"] += 1
        elif sprint.status == SprintStatus.COMPLETED:
            dashboard["completed_sprints"] += 1
        elif sprint.status == SprintStatus.CANCELLED:
            dashboard["cancelled_sprints"] += 1
        elif sprint.status == SprintStatus.TRANSFERRED:
            dashboard["transferred_sprints"] += 1
    return dashboard


 