from __future__ import annotations

from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead, LeadStatus, LeadSource
from app.repositories.base_repository import BaseRepository


class LeadRepository(BaseRepository[Lead]):
    def __init__(self, session: AsyncSession):
        super().__init__(Lead, session)

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        assigned_to: Optional[UUID] = None,
    ) -> tuple[List[Lead], int]:
        stmt = select(Lead)
        count_stmt = select(func.count(Lead.id))

        conditions = []
        if search:
            conditions.append(
                or_(
                    Lead.first_name.ilike(f"%{search}%"),
                    Lead.last_name.ilike(f"%{search}%"),
                    Lead.email.ilike(f"%{search}%"),
                    Lead.company.ilike(f"%{search}%"),
                )
            )
        if status:
            conditions.append(Lead.status == status)
        if source:
            conditions.append(Lead.source == source)
        if assigned_to:
            conditions.append(Lead.assigned_to == assigned_to)

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        total = await self.session.scalar(count_stmt)
        stmt = stmt.order_by(Lead.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(stmt)
        items = result.scalars().all()
        return list(items), total

    async def get_by_email(self, email: str) -> Optional[Lead]:
        stmt = select(Lead).where(Lead.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_pipeline(self) -> dict:
        """Get leads grouped by status for pipeline view"""
        stmt = select(Lead).order_by(Lead.created_at.desc())
        result = await self.session.execute(stmt)
        leads = result.scalars().all()

        pipeline = {}
        for status in LeadStatus:
            pipeline[status.value] = [lead for lead in leads if lead.status == status]
        return pipeline

    async def get_status_counts(self) -> dict:
        """Get count of leads by status"""
        stmt = select(Lead.status, func.count(Lead.id)).group_by(Lead.status)
        result = await self.session.execute(stmt)
        return {row[0]: row[1] for row in result.all()}

    async def get_source_counts(self) -> dict:
        """Get count of leads by source"""
        stmt = select(Lead.source, func.count(Lead.id)).group_by(Lead.source)
        result = await self.session.execute(stmt)
        return {row[0]: row[1] for row in result.all()}