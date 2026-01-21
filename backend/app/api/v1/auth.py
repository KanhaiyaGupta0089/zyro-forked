import bcrypt
from fastapi import APIRouter, Depends
from app.db.connection import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.auth import SignUpRequest,LoginRequest,GoogleSignInRequest
from app.db.crud.user import (
    get_user_by_email,
    create_user_password,
    get_user_by_id,
    get_user_by_google_user_id,
    create_user_google
)
from app.common.errors import CredentialError,InvalidDataError,ClientErrors

from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    decode_token,
    verify_google_token
)
auth_router = APIRouter()

@auth_router.post("/signup")
async def signup(
    request: SignUpRequest,
    session: AsyncSession = Depends(get_db)
):
    """
    SignUp a user with email,password and name
    """

    existing_user = await get_user_by_email(email=request.email, session=session)
    
    
    if existing_user:
        raise InvalidDataError(message="User already exists")
    
    # create user with email and password
    user = await create_user_password(
        name=request.name,
        email=request.email,
        password=request.password,
        session=session
    )

    # generate jwt token
    payload = {
        "user_id":user.id,
        "email":user.email,
        "role":user.role.value,
        "type_of_signup":user.type_of_signup.value
    }
    access_token = await create_access_token(payload)
    refresh_token = await create_refresh_token(payload)

    user_data = {
        "id":user.id,
        "name":user.name,
        "email":user.email,
        "role":user.role.value
    }

    return {
        "status":"success",
        "message":"Signup successfully",
        "data":{
            "access_token":access_token,
            "refresh_token":refresh_token,
            "user_data":user_data
        }
        
    }

@auth_router.post("/login")
async def login(
    request:LoginRequest,
    session:AsyncSession = Depends(get_db)
):
    """
    User login endpoint with email and password
    """

    email = request.email
    password = request.password

    # Get user by email 
    user = await get_user_by_email(email=email,session=session)
    if not user:
        raise CredentialError(message="Invalid email or password")

    # verify password
    if not await verify_password(password=password, hashed_password=user.password):
        raise CredentialError(message="Invalid email or password")

    payload = {
        "user_id": user.id,
        "email": user.email,
        "role":user.role.value,
        "type_of_signup":user.type_of_signup.value
    }

    access_token = await create_access_token(payload)
    refresh_token = await create_refresh_token(payload)

    user_data = {
        "id":user.id,
        "name":user.name,
        "email":user.email,
        "role":user.role.value,
        "type_of_signup":user.type_of_signup.value
    }

    return {
        "status":"success",
        "message":"Login successfully",
        "data":{
            "access_token":access_token,
            "refresh_token":refresh_token,
            "user_data":user_data
        }
    }

@auth_router.post("/refresh")
async def refresh_token(
    request:dict,
    session:AsyncSession = Depends(get_db)
):
    """
    Refresh token endpoint with refresh token
    """
    refresh_token = request.get("refresh_token")
    if not refresh_token:
        raise InvalidDataError(message="Refresh token is required")
    
    payload = decode_token(refresh_token)
    user_id = payload.get("user_id")
    user = await get_user_by_id(user_id=user_id,session=session)
    if not user:
        raise CredentialError(message="User not found")
    
    new_payload = {
        "user_id":user.id,
        "email":user.email,
        "role":user.role.value,
        "type_of_signup":user.type_of_signup.value
    }

    new_access_token = await create_access_token(new_payload)
    new_refresh_token = await create_refresh_token(new_payload)

    user_data = {
        "id":user.id,
        "name":user.name,
        "email":user.email,
        "role":user.role.value,
        "type_of_signup":user.type_of_signup.value
    }

    return {
        "status":"success",
        "message":"Token refreshed successfully",
        "data":{
            "access_token":new_access_token,
            "refresh_token":new_refresh_token,
            "user_data":user_data
        }
    }
    
@auth_router.post("/google-signin")
async def sign_in_with_google(
    request:GoogleSignInRequest,
    session:AsyncSession = Depends(get_db)
):
    """
    Google signin endpoint with google access token
    """
    
    id_token = request.id_token
    if not id_token:
        raise InvalidDataError(message="ID token is required")
    
    id_info = await verify_google_token(id_token)
    
    google_user_id = id_info.get("sub")
    name = id_info.get("name")
    email = id_info.get("email")
    
    if not google_user_id or not email:
        raise CredentialError(message="Invalid google token")
    
    user = await get_user_by_google_user_id(google_user_id=google_user_id,session=session)
    
    if not user:
        existing_email_user = await get_user_by_email(email=email,session=session)
        
        if existing_email_user:
            raise ClientErrors(message="User already exists with this email")
        else:
            user =  await create_user_google(
                google_user_id=google_user_id,
                name=name,
                email=email,
                session=session
            )
    
    # If user exists, just log them in (no need to raise error)
    
    
    payload = {
        "user_id":user.id,
        "email":user.email,
        "role":user.role.value,
        "type_of_signup":user.type_of_signup.value
    }
    
    access_token = await create_access_token(payload)
    refresh_token = await create_refresh_token(payload)
    
    user_data = {
        "id":user.id,
        "name":user.name,
        "email":user.email,
        "role":user.role.value,
        "type_of_signup":user.type_of_signup.value
    }
    
    return {
        "status":"success",
        "message":"Google signin successfully",
        "data":{
            "access_token":access_token,
            "refresh_token":refresh_token,
            "user_data":user_data
        }
    }
    

    


