from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.db.connection import get_db
from app.db.crud.user import get_user_by_id
from app.core.security import decode_token
from app.models.model import User
from app.common.errors import CredentialError

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

