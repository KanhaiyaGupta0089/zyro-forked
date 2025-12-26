from fastapi import APIRouter

api_router = APIRouter()

# Import and include your route modules here
# Example:
# from app.api.v1 import users, projects
# api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(projects.router, prefix="/projects", tags=["projects"])

from app.api.v1.auth import auth_router
# from app.api.v1.organization import organization_router
from app.api.v1.dashboard import dashboard_router
api_router.include_router(auth_router,prefix='/auth',tags=['Authentication'])
api_router.include_router(dashboard_router,prefix='/dashboard',tags=['Dashboard'])


