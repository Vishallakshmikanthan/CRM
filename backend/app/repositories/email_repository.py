from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_activity import EmailActivity
from app.repositories.base_repository import BaseRepository


class EmailActivityRepository(BaseRepository[EmailActivity]):
    def __init__(self, session: AsyncSession):
        super().__init__(EmailActivity, session)

    async def get_paginated(
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
        stmt = select(EmailActivity)
        count_stmt = select(func.count(EmailActivity.id))

        conditions = []
        if search:
            conditions.append(
                or_(
                    EmailActivity.subject.ilike(f"%{search}%"),
                    EmailActivity.body.ilike(f"%{search}%"),
                )
            )
        if direction:
            conditions.append(EmailActivity.direction == direction)
        if status:
            conditions.append(EmailActivity.status == status)
        if related_type:
            conditions.append(EmailActivity.related_type == related_type)
        if related_id:
            conditions.append(EmailActivity.related_id == related_id)
        if user_id:
            conditions.append(EmailActivity.user_id == user_id)
        if date_from:
            conditions.append(EmailActivity.sent_at >= date_from)
        if date_to:
            conditions.append(EmailActivity.sent_at <= date_to)

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        total = await self.session.scalar(count_stmt)
        stmt = stmt.order_by(desc(EmailActivity.sent_at)).offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(stmt)
        items = result.scalars().all()
        return list(items), total

    async def get_thread(self, related_type: str, related_id: UUID) -> List[EmailActivity]:
        stmt = (
            select(EmailActivity)
            .where(
                and_(
                    EmailActivity.related_type == related_type,
                    EmailActivity.related_id == related_id,
                )
            )
            .order_by(EmailActivity.sent_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_related(self, related_type: str, related_id: UUID) -> List[EmailActivity]:
        stmt = (
            select(EmailActivity)
            .where(
                and_(
                    EmailActivity.related_type == related_type,
                    EmailActivity.related_id == related_id,
                )
            )
            .order_by(desc(EmailActivity.sent_at))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_recent(self, limit: int = 10, user_id: Optional[UUID] = None) -> List[EmailActivity]:
        stmt = select(EmailActivity).order_by(desc(EmailActivity.sent_at)).limit(limit)
        if user_id:
            stmt = stmt.where(EmailActivity.user_id == user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())