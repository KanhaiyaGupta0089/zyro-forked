from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.connection import get_db
from app.db.crud.organization_crud import get_all_organizations_by_user
from app.core.dependencies import get_current_user
from app.models.model import User

organization_router = APIRouter()

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
            "status": org.status.value if org.status else "inactive",
            "data": org.data,
            "created_at": org.created_at.isoformat() if org.created_at else None,
            "updated_at": org.updated_at.isoformat() if org.updated_at else None,
        }
        orgs_data.append(org_dict)
    
    return {
        "status": "success",
        "message": "Organizations fetched successfully",
        "data": orgs_data
    }