from fastapi import APIRouter

from apps.backend.app.api.v1.endpoints.dashboard import router as dashboard_router
from apps.backend.app.api.v1.endpoints.goals import router as goals_router
from apps.backend.app.api.v1.endpoints.auth import router as auth_router
from apps.backend.app.api.v1.endpoints.transactions import router as transactions_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(transactions_router, prefix="/transactions", tags=["transactions"])
api_router.include_router(goals_router, prefix="/goals", tags=["goals"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
