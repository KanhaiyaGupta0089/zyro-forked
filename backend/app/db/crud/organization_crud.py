from app.models.model import Organization, OrganizationMember
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

async def get_all_organizations_by_user(user_id: int, session: AsyncSession) -> List[Organization]:
    """
    Get all organizations for the current user (as owner or member)
    """
    # Get organizations where user is owner
    stmt_owner = select(Organization).where(Organization.owner_id == user_id)
    result_owner = await session.execute(stmt_owner)
    owner_orgs = list(result_owner.scalars().all())
    
    # Get organizations where user is a member
    stmt_member = select(Organization).join(
        OrganizationMember,
        Organization.id == OrganizationMember.organization_id
    ).where(OrganizationMember.user_id == user_id)
    result_member = await session.execute(stmt_member)
    member_orgs = list(result_member.scalars().all())

    
    
    # Combine and remove duplicates by converting to dict with id as key
    all_orgs_dict = {}
    for org in owner_orgs + member_orgs:
        all_orgs_dict[org.id] = org
    
    return list(all_orgs_dict.values())