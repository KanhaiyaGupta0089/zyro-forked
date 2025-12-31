from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.connection import get_db
from app.core.dependencies import get_current_user
from app.models.model import User
from app.db.crud.sprint import get_all_sprints
from app.core.dependencies import allow_min_role
from app.core.enums import Role
from app.schemas.sprint import CreateSprintRequest,UpdateSprintRequest
from app.common.errors import NotFoundError,DatabaseErrors
from app.db.crud.sprint import get_sprint_by_id,create_sprint,update_sprint,delete_sprint,get_sprint_dashboard
sprint_router = APIRouter()



@sprint_router.get("/")
async def get_all_sprints_api(
    current_user: User = Depends(allow_min_role(Role.EMPLOYEE)),
    session: AsyncSession = Depends(get_db),
):
    """
    Get all sprints for the current user
    """
    sprints = await get_all_sprints(
        user_id=current_user.id,
        session=session
    )

    return {
        "success": True,
        "message": "Sprints fetched successfully",
        "data":sprints

    }

@sprint_router.get("/sprint-dashboard")
async def get_sprint_dashboard_api(
    session:AsyncSession = Depends(get_db),
    current_user:User = Depends(allow_min_role(Role.MANAGER)),
):
    """
    Get the sprint dashboard for the current user
    """
    dashboard = await get_sprint_dashboard(user_id=current_user.id,session=session)
    return {
        "success": True,
        "message": "Sprint dashboard fetched successfully",
        "data": dashboard
    }

@sprint_router.get("/{sprint_id}")
async def get_sprint_by_id_api(
    sprint_id:int,
    session:AsyncSession = Depends(get_db),
):
    """
    Get a sprint by id
    """
    sprint = await get_sprint_by_id(sprint_id,session)
    if not sprint:
        raise NotFoundError(message="Sprint not found")
    return {
        "success": True,
        "message": "Sprint fetched successfully",
        "data": sprint
    }

@sprint_router.post("/")
async def create_sprint_api(
    request:CreateSprintRequest,
    session:AsyncSession = Depends(get_db),
    current_user:User = Depends(allow_min_role(Role.MANAGER)),
):
    """
    Create a new sprint
    """
    
    sprint = await create_sprint(session=session,payload=request.model_dump())
    if not sprint:
        raise DatabaseErrors(message="Failed to create sprint")

    return {
        "success": True,
        "message": "Sprint created successfully",
        "data": sprint
    }

@sprint_router.put("/{sprint_id}")
async def update_sprint_api(
    sprint_id:int,
    request:UpdateSprintRequest,
    session:AsyncSession = Depends(get_db),
    current_user:User = Depends(allow_min_role(Role.MANAGER)),
):
    """
    Update a sprint
    """
    payload = request.model_dump(exclude_unset=True, exclude_none=True)
    sprint = await update_sprint(session,sprint_id,payload)
    if not sprint:
        raise DatabaseErrors(message="Failed to update sprint")
    return {
        "success": True,
        "message": "Sprint updated successfully",
        "data": sprint
    }

@sprint_router.delete("/{sprint_id}")
async def delete_sprint_api(
    sprint_id:int,
    session:AsyncSession = Depends(get_db),
    current_user:User = Depends(allow_min_role(Role.MANAGER)),
):
    """
    Delete a sprint
    """
    success = await delete_sprint(session,sprint_id)
    if not success:
        raise DatabaseErrors(message="Failed to delete sprint")
    return {
        "success": success,
        "message": "Sprint deleted successfully",
        
    }