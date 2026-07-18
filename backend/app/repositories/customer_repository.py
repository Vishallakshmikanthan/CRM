from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.customer import Customer, CustomerContact
from app.models.customer_note import CustomerNote
from app.models.customer_timeline import CustomerTimeline
from app.repositories.base_repository import BaseRepository


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, session: AsyncSession):
        super().__init__(Customer, session)

    async def get_with_relations(self, customer_id: UUID) -> Optional[Customer]:
        stmt = (
            select(Customer)
            .options(
                selectinload(Customer.contacts),
                selectinload(Customer.notes),
                selectinload(Customer.timeline),
            )
            .where(Customer.id == customer_id)
        )
        result = await self.session.execute(stmt)
        return result.unique().scalar_one_or_none()

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        assigned_to: Optional[UUID] = None,
    ) -> tuple[List[Customer], int]:
        stmt = select(Customer)
        count_stmt = select(func.count(Customer.id))

        conditions = []
        if search:
            conditions.append(
                or_(
                    Customer.company_name.ilike(f"%{search}%"),
                    Customer.contact_person.ilike(f"%{search}%"),
                    Customer.email.ilike(f"%{search}%"),
                )
            )
        if status:
            conditions.append(Customer.status == status)
        if assigned_to:
            conditions.append(Customer.assigned_to == assigned_to)

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        total = await self.session.scalar(count_stmt)
        stmt = stmt.order_by(Customer.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(stmt)
        items = result.scalars().all()
        return list(items), total

    async def get_by_email(self, email: str) -> Optional[Customer]:
        stmt = select(Customer).where(Customer.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class CustomerContactRepository(BaseRepository[CustomerContact]):
    def __init__(self, session: AsyncSession):
        super().__init__(CustomerContact, session)

    async def get_by_customer(self, customer_id: UUID) -> List[CustomerContact]:
        stmt = select(CustomerContact).where(CustomerContact.customer_id == customer_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_primary(self, customer_id: UUID) -> Optional[CustomerContact]:
        stmt = select(CustomerContact).where(
            and_(CustomerContact.customer_id == customer_id, CustomerContact.is_primary == True)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class CustomerNoteRepository(BaseRepository[CustomerNote]):
    def __init__(self, session: AsyncSession):
        super().__init__(CustomerNote, session)

    async def get_by_customer(self, customer_id: UUID) -> List[CustomerNote]:
        stmt = (
            select(CustomerNote)
            .where(CustomerNote.customer_id == customer_id)
            .order_by(CustomerNote.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())


class CustomerTimelineRepository(BaseRepository[CustomerTimeline]):
    def __init__(self, session: AsyncSession):
        super().__init__(CustomerTimeline, session)

    async def get_by_customer(self, customer_id: UUID, limit: int = 50) -> List[CustomerTimeline]:
        stmt = (
            select(CustomerTimeline)
            .where(CustomerTimeline.customer_id == customer_id)
            .order_by(CustomerTimeline.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())