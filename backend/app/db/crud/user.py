from app.models.model import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import hash_password,verify_password
from app.core.enums import Role,UserStatus
from app.common.errors import NotFoundError
from typing import Optional


async def get_user_by_email(email:str,session:AsyncSession) -> Optional[User]:

    stmt = select(User).where(User.email == email)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def create_user_password(
    name:str,
    email:str,
    password:str,
    session:AsyncSession
)->User:

    """
    create a user with email and password
    """

    hashed_password = await hash_password(password)

    user = User(
        name = name.capitalize(),
        email = email,
        password = hashed_password,
        role = Role.ADMIN,
        status = UserStatus.ACTIVE
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

async def get_user_by_id(
    user_id:int,
    session:AsyncSession
) -> Optional[User]:
    """
    get user object by user id
    """
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def update_user_password(
    session:AsyncSession,
    user_id:int,
    new_password:str
) -> User:
    """
    update user password
    """
    
    user = await get_user_by_id(user_id=user_id, session=session)
    if not user:
        raise NotFoundError(message=f"User with id {user_id} not found")
    
    hashed_password = await hash_password(new_password)

    user.password = hashed_password

    await session.commit()
    await session.refresh(user)

    return user


    