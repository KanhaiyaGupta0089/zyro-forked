from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.connection import get_db
from app.core.dependencies import get_current_user
from app.models.model import User
from app.db.crud.project_crud import (
    get_all_projects,
    get_project_by_id,
    create_project,
    update_project,
    delete_project
)
from app.common.errors import NotFoundError, DatabaseErrors
from app.schemas.project import ProjectRequest, ProjectUpdateRequest, GitHubRepoLinkRequest



project_router = APIRouter()

@project_router.get("/")
async def get_all_projects_api(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Get all projects for the current user

    """

    projects = await get_all_projects(
        user_id = current_user.id,
        session = session
    )

    return {
        "success": True,
        "message":"Projects fetched successfully",
        "data": projects
    }

@project_router.get("/{project_id}")
async def get_project_by_id_api(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Get a project by id
    """
    project = await get_project_by_id(
        project_id = project_id,
        user_id = current_user.id,
        session = session,
    
    )
    if not project:
        raise NotFoundError(message="Project not found")

    return {
        "success": True,
        "message":"Project fetched successfully",
        "data": project
    }

@project_router.post("/")
async def create_new_project(
    request:ProjectRequest,
    session:AsyncSession = Depends(get_db),
    current_user:User = Depends(get_current_user),
):
    """
     API to create a new project
    """

    project_data = request.model_dump()
    project = await create_project(
        session = session,
        user_id = current_user.id,
        project_data = project_data
    )
    if not project:
        raise DatabaseErrors(message="Failed to create project")

   
    return {
        "success": True,
        "message":"Project created successfully",
        "data": project
    }

@project_router.put("/{project_id}")
async def update_project_api(
    request: ProjectUpdateRequest,
    project_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a project by ID.
    
    """
    try:
        payload = request.model_dump(exclude_unset=True, exclude_none=True)
        
        if not payload:
            return {
                "success": False,
                "message": "No fields provided for update",
                "data": None
            }
        
        project = await update_project(
            session=session,
            project_id=project_id,
            payload=payload,
            user_id=current_user.id
        )
        
        if not project:
            raise DatabaseErrors(message="Failed to update project")
        
        return {
            "success": True,
            "message": "Project updated successfully",
            "data": project
        }
        
    except NotFoundError as e:
        raise e
    except Exception as e:
        raise DatabaseErrors(message=f"Failed to update project: {str(e)}")

@project_router.delete("/{project_id}")
async def delete_project_api(
    project_id:int,
    session:AsyncSession = Depends(get_db),
    current_user:User = Depends(get_current_user),
):
    """
    Delete a project by ID
    """

    success = await delete_project(
        session=session,
        project_id=project_id,
        user_id=current_user.id
    )
    if not success:
        raise DatabaseErrors(message="Failed to delete project")

    return {
        "success": True,
        "message":"Project deleted successfully",
        "data": None
    }

@project_router.post("/{project_id}/link-github")
async def link_github_repo(
    request: GitHubRepoLinkRequest,
    project_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Link a GitHub repository to a project
    This allows the project to receive GitHub webhook events
    
    Example: {"github_repo": "username/repository"}
    """
    try:
        # Get project
        project = await get_project_by_id(
            project_id=project_id,
            user_id=current_user.id,
            session=session
        )
        
        if not project:
            raise NotFoundError(message="Project not found")
        
        # Update project data with GitHub repo info
        # Create a new dict to ensure SQLAlchemy detects the change
        current_data = dict(project.data) if project.data else {}
        current_data['github_repo'] = request.github_repo
        
        # Update project
        updated_project = await update_project(
            session=session,
            project_id=project_id,
            payload={'data': current_data},
            user_id=current_user.id
        )
        
        return {
            "success": True,
            "message": f"GitHub repository '{request.github_repo}' linked successfully",
            "data": {
                "project_id": updated_project.id,
                "github_repo": request.github_repo
            }
        }
        
    except NotFoundError as e:
        raise e
    except Exception as e:
        raise DatabaseErrors(message=f"Failed to link GitHub repository: {str(e)}")


@project_router.get("/{project_id}/team")
async def get_all_team_members_api(
    project_id:int,
    session:AsyncSession = Depends(get_db),
    current_user:User = Depends(get_current_user),
):
    """
    Get all team members of a project
    """
    project = await get_project_by_id(project_id=project_id,user_id=current_user.id,session=session)