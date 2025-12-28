from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.db.connection import get_db
from app.db.crud.user import get_user_by_id
from app.core.security import decode_token
from app.models.model import User
from app.common.errors import CredentialError,PermissionDeniedError
from app.core.enums import Role
from typing import List


security = HTTPBearer(auto_error=False)  # Set auto_error to False to handle missing credentials manually

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),  # Make credentials optional
    session: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from JWT token
    """
    if not credentials:
        raise CredentialError(message="Authentication required. Please provide a valid token.")
    
    token = credentials.credentials
    
    try:
        print("token is------",credentials)
        token = credentials.credentials
    
        # Decode token
        payload = decode_token(token)
        user_id = payload.get("user_id")
        
        if not user_id:
            raise CredentialError(message="Invalid token: user_id not found")
        
        # Get user from database
        user = await get_user_by_id(user_id=user_id, session=session)
        
        if not user:
            raise CredentialError(message="User not found")
        
        return user
    except CredentialError:
        # Re-raise CredentialError as-is (will return 401)
        raise
    except ValueError as e:
        raise CredentialError(message=f"Invalid token: {str(e)}")
    except Exception as e:
        raise CredentialError(message="Invalid authentication credentials")
# ----------------------------------------------------------------------------------------------
# ROLE CHECKER
# ----------------------------------------------------------------------------------------------
ROLE_RANK = {
    Role.ADMIN: 3,
    Role.MANAGER:2,
    Role.EMPLOYEE: 1,   
}

def allow_min_role(min_role: Role):
    """
    Allows users with this role OR HIGHER in hierarchy
    Example:
        Depends(allow_min_role(Role.MANAGER))
        -> allowed: MANAGER, ADMIN
        -> denied: USER
    """

    async def checker(current_user: User = Depends(get_current_user)):

        user_role_rank = ROLE_RANK.get(current_user.role, 0)
        min_role_rank = ROLE_RANK[min_role]

        if user_role_rank < min_role_rank:
            raise PermissionDeniedError(
                message="You are not authorized to access this resource"
            )

        return current_user

    return checker