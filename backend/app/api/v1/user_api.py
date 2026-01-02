from psutil import users
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.model import User,Invite_Tokens
from fastapi import Request,Depends,APIRouter
from app.core.enums import Role, UserStatus
from app.core.dependencies import allow_min_role
import secrets
import hashlib
from app.tasks.email_task import send_email_task
from datetime import datetime,timedelta
from sqlalchemy import select,func
from app.common.email_template import invite_email
from app.core.security import hash_password
from app.db.connection import get_db



user_router = APIRouter()
from pydantic import BaseModel, EmailStr

class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    role: Role

class UpdatePasswordRequest(BaseModel):
    raw_token: str
    new_password: str
 
class verifyTokenResponse(BaseModel):
   raw_token: str   


@user_router.post("/verify-token",response_model=None)
async def verify_token(request:verifyTokenResponse,session:AsyncSession=Depends(get_db)):
    token_hash = hashlib.sha256(request.raw_token.encode()).hexdigest()
    query = select(Invite_Tokens).where(Invite_Tokens.token_hash ==token_hash)
    result = await session.execute(query)
    invite_token = result.scalar_one_or_none()
    if not invite_token or invite_token.expires_at < datetime.now():
        return {
            
            "error": "Invalid or expired token"
        }
    return {
        "message": "Token is valid",
        "user_id": invite_token.user_id
    }
    
    
@user_router.post("/create",response_model=None)
async def create_user(request:CreateUserRequest, session:AsyncSession=Depends(get_db),current_user:User = Depends(allow_min_role(Role.ADMIN))) -> dict:
    
    user  =select(User).where(func.lower(User.email) == request.email.lower())
    result = await session.execute(user)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        new_user = existing_user
        if existing_user.status != UserStatus.INVITED:
         return {
            "message": f"User with email {request.email} already exists."
        }
    else:     
        new_user = User(
            name=request.name,
            email=request.email,
            password = None,
            status = UserStatus.INVITED,
            role = request.role
             )
        session.add(new_user)
        await session.flush() 
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    
    invite_token = Invite_Tokens(
        user_id=new_user.id,
        token_hash=token_hash,
        expires_at=datetime.now() + timedelta(days=7)    
    )
    session.add(invite_token)
    await session.commit()
    await session.refresh(new_user)
   
    print("Sending email to:", new_user.email)
    invite_email_body = invite_email(raw_token, new_user.name,new_user.email)
    if not invite_email_body:
        return {
            "status": "error",
            "error": "Failed to send invite email"
        }

    return {
        "message": f"User {new_user.email} invited successfully", 
        "user_id": new_user.id,
        "invite_token": raw_token #remove this in production
    }

@user_router.post("/update-password",response_model=None)    
async def update_password(
    request: UpdatePasswordRequest,
     session:AsyncSession=Depends(get_db)
):
    token_hash = hashlib.sha256(request.raw_token.encode()).hexdigest()

    stmt = select(Invite_Tokens).where(
        Invite_Tokens.token_hash == token_hash
    )
    result = await session.execute(stmt)
    invite_token = result.scalar_one_or_none()
    if not invite_token or invite_token.expires_at < datetime.now():
        raise ValueError("Invalid or expired token")

   
    stmt = select(User).where(User.id == invite_token.user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        return {
            "error": "User not found"
        }
    password = request.new_password
    if not password or len(password.strip()) < 8:
        return {
            "error": "Password must be provided and at least 8 characters long"
        }
    new_password = password.strip()
    
    hashed_password = await hash_password(new_password)
    user.password = hashed_password
    user.status = UserStatus.ACTIVE

    await session.delete(invite_token)
    await session.commit()
    await session.refresh(user)

    return {
        "message": "Password updated successfully",
        "user_id": user.id
    }

@user_router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_min_role(Role.ADMIN)),
):
    stmt = select(User).where(User.id == user_id)
    invite_tokens = select(Invite_Tokens).where(Invite_Tokens.user_id == user_id)
    all_tokens = await session.execute(invite_tokens)
    tokens = all_tokens.scalars().all()
    if tokens:
        for token in tokens:
            await session.delete(token)
            await session.commit()
        
    result = await session.execute(stmt)
    user = result.scalars().one_or_none()

    if not user:
        return{
            "error": "User not found"
        }

    await session.delete(user)
    await session.commit()

    return {
        "message": f"User {user.email} deleted successfully."
    }


@user_router.get("/")
async def get_all_user(session: AsyncSession=Depends(get_db)):
    stmt = select(User)
    result = await session.execute(stmt)
    users = result.scalars().all()
    users_safe = [user.to_dict() for user in users]
    return {
        "message": "Users retrieved successfully",
        "users": users_safe
    }

@user_router.get("/{user_id}")
async def get_user_by_id(user_id: int, session: AsyncSession=Depends(get_db)):
    getquery = select(User).where(User.id == user_id)
    result = await session.execute(getquery)
    user1 = result.scalar_one_or_none()
    user1 = user1.to_dict()
    return {
        "message": "User retrieved successfully",
        "user": user1
    }    
    
