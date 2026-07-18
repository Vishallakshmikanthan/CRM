from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_activity import EmailActivity
from app.repositories.email_repository import EmailActivityRepository
from app.schemas.email_activity import EmailActivityCreate
from app.core.exceptions import NotFoundException as NotFoundError


class EmailActivityService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.email_repo = EmailActivityRepository(session)

    async def create_email(self, data: EmailActivityCreate, user_id: UUID) -> EmailActivity:
        email = EmailActivity(**data.model_dump(), user_id=user_id)
        self.session.add(email)
        await self.session.commit()
        await self.session.refresh(email)
        return email

    async def get_email(self, email_id: UUID) -> EmailActivity:
        email = await self.email_repo.get(email_id)
        if not email:
            raise NotFoundError("Email activity not found")
        return email

    async def get_emails(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        direction: Optional[str] = None,
        status: Optional[str] = None,
        related_type: Optional[str] = None,
        related_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple[List[EmailActivity], int]:
        return await self.email_repo.get_paginated(
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

    async def get_thread(self, related_type: str, related_id: UUID) -> List[EmailActivity]:
        return await self.email_repo.get_thread(related_type, related_id)

    async def get_by_related(self, related_type: str, related_id: UUID) -> List[EmailActivity]:
        return await self.email_repo.get_by_related(related_type, related_id)

    async def get_recent(self, limit: int = 10, user_id: Optional[UUID] = None) -> List[EmailActivity]:
        return await self.email_repo.get_recent(limit, user_id)