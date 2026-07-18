from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.email_activity import (
    EmailActivityCreate,
    EmailActivityResponse,
    EmailActivityListResponse,
    EmailThreadResponse,
)
from app.services.email_service import EmailActivityService

router = APIRouter(prefix="/emails", tags=["emails"])


@router.post("", response_model=EmailActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_email(
    data: EmailActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = EmailActivityService(db)
    email = await service.create_email(data, current_user.id)
    return email


@router.get("", response_model=EmailActivityListResponse)
async def list_emails(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    direction: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    related_type: Optional[str] = Query(None),
    related_id: Optional[UUID] = Query(None),
    user_id: Optional[UUID] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = EmailActivityService(db)
    emails, total = await service.get_emails(
        page=page,
        page_size=page_size,
        search=search,
        direction=direction,
        status=status,
        related_type=related_type,
        related_id=related_id,
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
    )
    return EmailActivityListResponse(
        items=emails,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/recent", response_model=list[EmailActivityResponse])
async def get_recent_emails(
    limit: int = Query(10, ge=1, le=50),
    user_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = EmailActivityService(db)
    emails = await service.get_recent(limit, user_id)
    return emails


@router.get("/thread/{related_type}/{related_id}", response_model=list[EmailThreadResponse])
async def get_email_thread(
    related_type: str,
    related_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = EmailActivityService(db)
    emails = await service.get_thread(related_type, related_id)
    return emails


@router.get("/related/{related_type}/{related_id}", response_model=list[EmailActivityResponse])
async def get_emails_by_related(
    related_type: str,
    related_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = EmailActivityService(db)
    emails = await service.get_by_related(related_type, related_id)
    return emails


@router.get("/{email_id}", response_model=EmailActivityResponse)
async def get_email(
    email_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = EmailActivityService(db)
    email = await service.get_email(email_id)
    return email