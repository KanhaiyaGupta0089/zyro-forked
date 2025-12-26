from app.models.model import Sprint
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.enums import SprintStatus
from app.models.model import ProjectMember

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
 
    