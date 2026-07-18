from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, users, customers, leads, opportunities, tasks, emails, reports, settings

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["opportunities"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(emails.router, prefix="/emails", tags=["emails"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])