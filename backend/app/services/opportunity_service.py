from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.opportunity import Opportunity, OpportunityStage
from app.repositories.opportunity_repository import OpportunityRepository
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate, OpportunityStageUpdate
from app.core.exceptions import NotFoundException as NotFoundError, ValidationException as ValidationError


class OpportunityService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.opportunity_repo = OpportunityRepository(session)

    async def create_opportunity(self, data: OpportunityCreate, user_id: UUID) -> Opportunity:
        opportunity = Opportunity(**data.model_dump(), assigned_to=user_id)
        self.session.add(opportunity)
        await self.session.commit()
        await self.session.refresh(opportunity)
        return opportunity

    async def get_opportunity(self, opportunity_id: UUID) -> Opportunity:
        opportunity = await self.opportunity_repo.get_with_relations(opportunity_id)
        if not opportunity:
            raise NotFoundError("Opportunity not found")
        return opportunity

    async def get_opportunities(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        stage: Optional[str] = None,
        assigned_to: Optional[UUID] = None,
        customer_id: Optional[UUID] = None,
    ) -> tuple[List[Opportunity], int]:
        return await self.opportunity_repo.get_paginated(
            page=page,
            page_size=page_size,
            search=search,
            stage=stage,
            assigned_to=assigned_to,
            customer_id=customer_id,
        )

    async def update_opportunity(self, opportunity_id: UUID, data: OpportunityUpdate, user_id: UUID) -> Opportunity:
        opportunity = await self.opportunity_repo.get(opportunity_id)
        if not opportunity:
            raise NotFoundError("Opportunity not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(opportunity, field, value)

        opportunity.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(opportunity)
        return opportunity

    async def update_opportunity_stage(self, opportunity_id: UUID, data: OpportunityStageUpdate, user_id: UUID) -> Opportunity:
        opportunity = await self.opportunity_repo.get(opportunity_id)
        if not opportunity:
            raise NotFoundError("Opportunity not found")

        if data.stage not in [s.value for s in OpportunityStage]:
            raise ValidationError(f"Invalid stage: {data.stage}")

        opportunity.stage = data.stage
        opportunity.updated_at = datetime.utcnow()
        
        # Auto-set probability based on stage
        stage_probabilities = {
            OpportunityStage.PROSPECTING: 10,
            OpportunityStage.QUALIFICATION: 25,
            OpportunityStage.PROPOSAL: 50,
            OpportunityStage.NEGOTIATION: 75,
            OpportunityStage.CLOSED_WON: 100,
            OpportunityStage.CLOSED_LOST: 0,
        }
        if data.stage in stage_probabilities:
            opportunity.probability = stage_probabilities[data.stage]
        
        if data.stage == OpportunityStage.CLOSED_WON:
            opportunity.actual_close_date = datetime.utcnow().date()
        elif data.stage == OpportunityStage.CLOSED_LOST:
            opportunity.actual_close_date = datetime.utcnow().date()

        await self.session.commit()
        await self.session.refresh(opportunity)
        return opportunity

    async def delete_opportunity(self, opportunity_id: UUID) -> None:
        opportunity = await self.opportunity_repo.get(opportunity_id)
        if not opportunity:
            raise NotFoundError("Opportunity not found")
        await self.opportunity_repo.delete(opportunity_id)
        await self.session.commit()

    async def get_pipeline(self) -> dict:
        return await self.opportunity_repo.get_pipeline()

    async def get_forecast(self) -> dict:
        return await self.opportunity_repo.get_forecast()

    async def get_stage_counts(self) -> dict:
        return await self.opportunity_repo.get_stage_counts()

    async def get_by_customer(self, customer_id: UUID) -> List[Opportunity]:
        return await self.opportunity_repo.get_by_customer(customer_id)