from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead, LeadStatus
from app.repositories.lead_repository import LeadRepository
from app.schemas.lead import LeadCreate, LeadUpdate, LeadStatusUpdate, LeadAssignUpdate
from app.core.exceptions import NotFoundException as NotFoundError, ValidationException as ValidationError


class LeadService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.lead_repo = LeadRepository(session)

    async def create_lead(self, data: LeadCreate, user_id: UUID) -> Lead:
        lead = Lead(**data.model_dump(), assigned_to=user_id)
        self.session.add(lead)
        await self.session.commit()
        await self.session.refresh(lead)
        return lead

    async def get_lead(self, lead_id: UUID) -> Lead:
        lead = await self.lead_repo.get(lead_id)
        if not lead:
            raise NotFoundError("Lead not found")
        return lead

    async def get_leads(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        assigned_to: Optional[UUID] = None,
    ) -> tuple[List[Lead], int]:
        return await self.lead_repo.get_paginated(
            page=page,
            page_size=page_size,
            search=search,
            status=status,
            source=source,
            assigned_to=assigned_to,
        )

    async def update_lead(self, lead_id: UUID, data: LeadUpdate, user_id: UUID) -> Lead:
        lead = await self.lead_repo.get(lead_id)
        if not lead:
            raise NotFoundError("Lead not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lead, field, value)

        lead.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(lead)
        return lead

    async def update_lead_status(self, lead_id: UUID, data: LeadStatusUpdate, user_id: UUID) -> Lead:
        lead = await self.lead_repo.get(lead_id)
        if not lead:
            raise NotFoundError("Lead not found")

        if data.status not in [s.value for s in LeadStatus]:
            raise ValidationError(f"Invalid status: {data.status}")

        lead.status = data.status
        lead.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(lead)
        return lead

    async def assign_lead(self, lead_id: UUID, data: LeadAssignUpdate, user_id: UUID) -> Lead:
        lead = await self.lead_repo.get(lead_id)
        if not lead:
            raise NotFoundError("Lead not found")

        lead.assigned_to = data.assigned_to
        lead.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(lead)
        return lead

    async def delete_lead(self, lead_id: UUID) -> None:
        lead = await self.lead_repo.get(lead_id)
        if not lead:
            raise NotFoundError("Lead not found")
        await self.lead_repo.delete(lead_id)
        await self.session.commit()

    async def get_pipeline(self) -> dict:
        return await self.lead_repo.get_pipeline()

    async def get_status_counts(self) -> dict:
        return await self.lead_repo.get_status_counts()

    async def get_source_counts(self) -> dict:
        return await self.lead_repo.get_source_counts()