from fastapi import APIRouter

api_router = APIRouter()

from app.api.v1.auth import auth_router

from app.api.v1.project import project_router
from app.api.v1.dashboard import dashboard_router
from app.api.v1.organization import organization_router
from app.api.v1.user_api import user_router
from app.api.v1.issue import issue_router
from app.api.v1.sprint import sprint_router
api_router.include_router(auth_router,prefix='/auth',tags=['Authentication'])
api_router.include_router(dashboard_router,prefix='/dashboard',tags=['Dashboard'])
api_router.include_router(project_router,prefix='/project',tags=['Project'])
api_router.include_router(organization_router,prefix='/organization',tags=['Organization'])
api_router.include_router(user_router,prefix='/user',tags=['User'])
api_router.include_router(issue_router,prefix='/issue',tags=['Issue'])
api_router.include_router(sprint_router,prefix='/sprint',tags=['Sprint'])
