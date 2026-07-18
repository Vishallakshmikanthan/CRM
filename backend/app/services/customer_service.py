from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer, CustomerContact
from app.models.customer_note import CustomerNote
from app.models.customer_timeline import CustomerTimeline
from app.models.user import User
from app.repositories.customer_repository import (
    CustomerRepository,
    CustomerContactRepository,
    CustomerNoteRepository,
    CustomerTimelineRepository,
)
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerContactCreate,
    CustomerNoteCreate,
)
from app.core.exceptions import NotFoundException as NotFoundError, ValidationException as ValidationError


class CustomerService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.customer_repo = CustomerRepository(session)
        self.contact_repo = CustomerContactRepository(session)
        self.note_repo = CustomerNoteRepository(session)
        self.timeline_repo = CustomerTimelineRepository(session)

    async def create_customer(self, data: CustomerCreate, user_id: UUID) -> Customer:
        customer = Customer(**data.model_dump(), assigned_to=user_id)
        self.session.add(customer)
        await self.session.flush()
        await self._add_timeline_entry(
            customer.id, user_id, "created", f"Customer created"
        )
        await self.session.commit()
        await self.session.refresh(customer)
        return customer

    async def get_customer(self, customer_id: UUID) -> Customer:
        customer = await self.customer_repo.get_with_relations(customer_id)
        if not customer:
            raise NotFoundError("Customer not found")
        return customer

    async def get_customers(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        assigned_to: Optional[UUID] = None,
    ) -> tuple[List[Customer], int]:
        return await self.customer_repo.get_paginated(
            page=page,
            page_size=page_size,
            search=search,
            status=status,
            assigned_to=assigned_to,
        )

    async def update_customer(self, customer_id: UUID, data: CustomerUpdate, user_id: UUID) -> Customer:
        customer = await self.customer_repo.get(customer_id)
        if not customer:
            raise NotFoundError("Customer not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(customer, field, value)

        customer.updated_at = datetime.utcnow()
        await self._add_timeline_entry(
            customer.id, user_id, "updated", f"Customer updated"
        )
        await self.session.commit()
        await self.session.refresh(customer)
        return customer

    async def delete_customer(self, customer_id: UUID) -> None:
        customer = await self.customer_repo.get(customer_id)
        if not customer:
            raise NotFoundError("Customer not found")
        await self.customer_repo.delete(customer_id)
        await self.session.commit()

    async def add_contact(self, customer_id: UUID, data: CustomerContactCreate) -> CustomerContact:
        customer = await self.customer_repo.get(customer_id)
        if not customer:
            raise NotFoundError("Customer not found")

        # If this is primary, unset other primary contacts
        if data.is_primary:
            await self._unset_primary_contacts(customer_id)

        contact = CustomerContact(**data.model_dump(), customer_id=customer_id)
        self.session.add(contact)
        await self.session.flush()
        await self._add_timeline_entry(
            customer_id, contact.id, "contact_added", f"Contact {contact.name} added"
        )
        await self.session.commit()
        await self.session.refresh(contact)
        return contact

    async def add_note(self, customer_id: UUID, data: CustomerNoteCreate, user_id: UUID) -> CustomerNote:
        customer = await self.customer_repo.get(customer_id)
        if not customer:
            raise NotFoundError("Customer not found")

        note = CustomerNote(**data.model_dump(), customer_id=customer_id, user_id=user_id)
        self.session.add(note)
        await self.session.flush()
        await self._add_timeline_entry(
            customer_id, user_id, "note_added", f"Note added: {data.content[:50]}..."
        )
        await self.session.commit()
        await self.session.refresh(note)
        return note

    async def get_notes(self, customer_id: UUID) -> List[CustomerNote]:
        return await self.note_repo.get_by_customer(customer_id)

    async def get_timeline(self, customer_id: UUID, limit: int = 50) -> List[CustomerTimeline]:
        return await self.timeline_repo.get_by_customer(customer_id, limit)

    async def _unset_primary_contacts(self, customer_id: UUID) -> None:
        stmt = select(CustomerContact).where(
            and_(CustomerContact.customer_id == customer_id, CustomerContact.is_primary == True)
        )
        result = await self.session.execute(stmt)
        contacts = result.scalars().all()
        for contact in contacts:
            contact.is_primary = False

    async def _add_timeline_entry(
        self,
        customer_id: UUID,
        user_id: UUID,
        activity_type: str,
        description: str,
        metadata: Optional[dict] = None,
    ) -> None:
        timeline = CustomerTimeline(
            customer_id=customer_id,
            user_id=user_id,
            activity_type=activity_type,
            description=description,
            metadata=metadata or {},
        )
        self.session.add(timeline)