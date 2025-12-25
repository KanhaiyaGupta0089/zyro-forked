from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.connection import get_db
from app.db.crud.organization_crud import get_all_organizations_by_user
from app.core.dependencies import get_current_user
from app.models.model import User
from app.db.crud.user import get_user_by_id
from app.core.enums import Role
from app.common.errors import NotFoundError, PermissionDeniedError
from app.db.crud.project_crud import get_all_projects_by_user

dashboard_router = APIRouter()

@dashboard_router.get("/manager")
async def get_manager_dashboard(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Get manager dashboard data
    """

    user = await get_user_by_id(user_id=current_user.id, session=session)
    if not user:
        raise NotFoundError(message="User not found")

    if user.role != Role.MANAGER:
        raise PermissionDeniedError(message="User role is not manager. Only managers can access this dashboard.")
    
    my_projects = await get_all_projects_by_user(user_id=current_user.id, session=session)

    dashboard_data = {
        "status": "success",
        "message": "Dashboard data fetched successfully",
        "data": {
            "cards": {
                "my_projects": len(my_projects) if my_projects else 0,
                "active_issues": 20,  # TODO: Calculate from database
                "team_members": 50,  # TODO: Calculate from database
                "active_sprints": 10  # TODO: Calculate from database
            },
            "recent_projects": [
                {
                    "project_name": "website redesigning",
                    "total_task": 10,
                    "task_completed": 7,
                    "project_completion_percentage": 75
                },
                {
                    "project_name": "website redesigning 2",
                    "total_task": 10,
                    "task_completed": 7,
                    "project_completion_percentage": 75
                }
            ],
            "recent_issues": [
                {
                    "task_id": 1,
                    "task_name": "Design new home layout",
                    "project_name": "Website Redesign",
                    "status": "in progress",
                    "priority": "high",
                    "assigned_to": "keshav",
                    "hours_ago": 12
                },
                {
                    "task_id": 2,
                    "task_name": "Design new home layout 2",
                    "project_name": "Website Redesign 2",
                    "status": "in progress",
                    "priority": "low",
                    "assigned_to": "keshav",
                    "hours_ago": 12
                }
            ]
        }
    }
    
    return dashboard_data
   
    # Organization Name
    # # my projects
    # active issues
    #  team members
    #  active sprints
    #  recent projects
    # recent issues



    
    

    
    