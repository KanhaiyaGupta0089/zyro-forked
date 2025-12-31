from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.connection import get_db
from app.db.crud.organization_crud import get_all_organizations_by_user, create_organization
from app.core.dependencies import get_current_user
from app.models.model import User
from pydantic import BaseModel
from typing import Optional

organization_router = APIRouter()

class OrganizationRequest(BaseModel):
    name: str
    description: Optional[str] = None
    data: Optional[dict] = None

@organization_router.get("/")
async def get_all_organizations(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Get all organizations for the current authenticated user
    Returns organizations where user is owner or member
    User ID is extracted from JWT token for security
    """
    organizations = await get_all_organizations_by_user(
        user_id=current_user.id,
        session=session
    )
    
    # Convert to dict format for JSON response
    orgs_data = []
    for org in organizations:
        org_dict = {
            "id": org.id,
            "name": org.name,
            "description": org.description,
            "owner_id": org.owner_id,
            "status": org.status if org.status else "inactive",
            "data": org.data,
            "created_at": org.created_at.isoformat() if org.created_at else None,
            "updated_at": org.updated_at.isoformat() if org.updated_at else None,
        }
        orgs_data.append(org_dict)
    
    return {
        "success": True,
        "message": "Organizations fetched successfully",
        "data": orgs_data
    }

@organization_router.post("/")
async def create_organization_api(
    request: OrganizationRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Create a new organization
    The current user becomes the owner and a member
    """
    try:
        organization = await create_organization(
            session=session,
            user_id=current_user.id,
            name=request.name,
            description=request.description,
            data=request.data
        )
        
        # Format response
        org_dict = {
            "id": organization.id,
            "name": organization.name,
            "description": organization.description,
            "owner_id": organization.owner_id,
            "status": organization.status if organization.status else "inactive",
            "data": organization.data,
            "created_at": organization.created_at.isoformat() if organization.created_at else None,
            "updated_at": organization.updated_at.isoformat() if organization.updated_at else None,
        }
        
        return {
            "success": True,
            "message": "Organization created successfully",
            "data": org_dict
        }
    except ValueError as e:
        return {
            "success": False,
            "message": str(e),
            "data": None
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to create organization: {str(e)}",
            "data": None
        }