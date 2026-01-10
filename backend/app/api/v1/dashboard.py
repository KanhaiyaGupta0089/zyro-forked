import asyncio

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.connection import get_db
from app.core.dependencies import get_current_user, allow_min_role
from app.models.model import User
from app.core.enums import Role
from app.db.crud.dashboard_crud import (
    get_recent_projects_dashboard_data,
    get_recent_issues_dashboard_data,
    get_manager_dashboard_cards_data,
    get_employee_dashboard_data
)

dashboard_router = APIRouter()

@dashboard_router.get("/manager")
async def get_manager_dashboard(
    current_user: User = Depends(allow_min_role(Role.MANAGER)),
    session: AsyncSession = Depends(get_db)
):
    """
    Get manager dashboard data - Optimized version
    """
    # Fetch all dashboard data in parallel
    cards_data, recent_projects, recent_issues = await asyncio.gather(
        get_manager_dashboard_cards_data(user_id=current_user.id, session=session),
        get_recent_projects_dashboard_data(user_id=current_user.id, session=session),
        get_recent_issues_dashboard_data(user_id=current_user.id, session=session),
        return_exceptions=True
    )
    
    # Handle exceptions
    if isinstance(cards_data, Exception):
        cards_data = {
            "my_projects": 0,
            "active_issues": 0,
            "team_members": 0,
            "active_sprints": 0
        }
    if isinstance(recent_projects, Exception):
        recent_projects = []
    if isinstance(recent_issues, Exception):
        recent_issues = []

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
async def get_employee_dashboard(
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get employee dashboard data
    """
    data = await get_employee_dashboard_data(user_id=user.id, session=session)

    return {
        "success": True,
        "message": "Employee Dashboard data fetched successfully",
        "data": data
    }

    
    

    
    