from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.connection import get_db
from app.db.crud.organization_crud import get_all_organizations_by_user
from app.core.dependencies import get_current_user
from app.models.model import User
from app.db.crud.user import get_user_by_id
from app.core.enums import Role
from app.common.errors import NotFoundError, PermissionDeniedError
from app.schemas.dashboard import APIResponse
from app.db.crud.project_crud import (
    get_all_projects,
    get_team_members_count
)
from app.db.crud.issue_crud import (
    get_all_active_issues
)
from app.db.crud.sprint import get_all_active_sprints
from app.db.crud.dashboard_crud import get_recent_projects_dashboard_data,get_recent_issues_dashboard_data
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
    cards_data ={
        "my_projects": 0,
        "active_issues": 0,
        "team_members": 0,
        "active_sprints": 0
    }
    # get all projects of manager
    my_projects = await get_all_projects(user_id=current_user.id, session=session)
    cards_data["my_projects"] = len(my_projects) if my_projects else 0

    # get all active issues of all projects aggregated
    active_issues = await get_all_active_issues(user_id=current_user.id, session=session)

    cards_data["active_issues"] = len(active_issues) if active_issues else 0

    # count all team members in manager team
    team_members_count = await get_team_members_count(user_id=current_user.id, session=session)
    cards_data["team_members"] = team_members_count

    # get all active sprints of all projects under manager
    active_sprints = await get_all_active_sprints(user_id = current_user.id,session=session)
    cards_data["active_sprints"] = len(active_sprints) if active_sprints else 0

    recent_projects = await get_recent_projects_dashboard_data(user_id=current_user.id,session=session)

    recent_issues = await get_recent_issues_dashboard_data(user_id=current_user.id,session=session)

    data_json = {
    "cards": cards_data,
    "recent_projects": recent_projects,
    "recent_issues": recent_issues,
    }

    
    return APIResponse(
        success=True,
        message="Manager Dashboard data fetched successfully",
        data=data_json
        )


    # active_issues = 
    # dashboard_data = {
    #     "status": "success",
    #     "message": "Dashboard data fetched successfully",
    #     "data": {
    #         "cards": {
    #             "my_projects": len(my_projects) if my_projects else 0,
    #             "active_issues": 20,  # TODO: Calculate from database
    #             "team_members": 50,  # TODO: Calculate from database
    #             "active_sprints": 10  # TODO: Calculate from database
    #         },
    #         "recent_projects": [
    #             {
    #                 "project_name": "website redesigning",
    #                 "total_task": 10,
    #                 "task_completed": 7,
    #                 "project_completion_percentage": 75
    #             },
    #             {
    #                 "project_name": "website redesigning 2",
    #                 "total_task": 10,
    #                 "task_completed": 7,
    #                 "project_completion_percentage": 75
    #             }
    #         ],
    #         "recent_issues": [
    #             {
    #                 "task_id": 1,
    #                 "task_name": "Design new home layout",
    #                 "project_name": "Website Redesign",
    #                 "status": "in progress",
    #                 "priority": "high",
    #                 "assigned_to": "keshav",
    #                 "hours_ago": 12
    #             },
    #             {
    #                 "task_id": 2,
    #                 "task_name": "Design new home layout 2",
    #                 "project_name": "Website Redesign 2",
    #                 "status": "in progress",
    #                 "priority": "low",
    #                 "assigned_to": "keshav",
    #                 "hours_ago": 12
    #             }
    #         ]
    #     }
    # }
    
    
   
    # Organization Name
    # # my projects
    # active issues
    #  team members
    #  active sprints
    #  recent projects
    # recent issues



    
    

    
    