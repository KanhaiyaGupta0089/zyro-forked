from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.connection import get_db
from app.db.crud.user import get_user_by_id
from app.core.security import decode_token
from app.models.model import User
from app.common.errors import CredentialError

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from JWT token
    """
    token = credentials.credentials
    
    try:
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
    except ValueError as e:
        raise CredentialError(message=str(e))
    except Exception as e:
        raise CredentialError(message="Invalid authentication credentials")

