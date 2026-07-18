from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.opportunity import Opportunity, OpportunityStage
from app.repositories.base_repository import BaseRepository


class OpportunityRepository(BaseRepository[Opportunity]):
    def __init__(self, session: AsyncSession):
        super().__init__(Opportunity, session)

    async def get_with_relations(self, opportunity_id: UUID) -> Optional[Opportunity]:
        stmt = (
            select(Opportunity)
            .options(
                selectinload(Opportunity.customer),
                selectinload(Opportunity.lead),
                selectinload(Opportunity.assigned_to_user),
            )
            .where(Opportunity.id == opportunity_id)
        )
        result = await self.session.execute(stmt)
        return result.unique().scalar_one_or_none()

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        stage: Optional[str] = None,
        assigned_to: Optional[UUID] = None,
        customer_id: Optional[UUID] = None,
    ) -> tuple[List[Opportunity], int]:
        stmt = select(Opportunity)
        count_stmt = select(func.count(Opportunity.id))

        conditions = []
        if search:
            conditions.append(
                or_(
                    Opportunity.name.ilike(f"%{search}%"),
                )
            )
        if stage:
            conditions.append(Opportunity.stage == stage)
        if assigned_to:
            conditions.append(Opportunity.assigned_to == assigned_to)
        if customer_id:
            conditions.append(Opportunity.customer_id == customer_id)

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        total = await self.session.scalar(count_stmt)
        stmt = stmt.order_by(Opportunity.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(stmt)
        items = result.scalars().all()
        return list(items), total

    async def get_pipeline(self) -> dict:
        """Get opportunities grouped by stage for pipeline view"""
        stmt = select(Opportunity).order_by(Opportunity.created_at.desc())
        result = await self.session.execute(stmt)
        opportunities = result.scalars().all()

        pipeline = {}
        for stage in OpportunityStage:
            pipeline[stage.value] = [opp for opp in opportunities if opp.stage == stage]
        return pipeline

    async def get_forecast(self) -> dict:
        """Get forecast data with weighted pipeline"""
        stmt = select(Opportunity).where(
            Opportunity.stage.not_in([OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST])
        )
        result = await self.session.execute(stmt)
        opportunities = result.scalars().all()

        total_pipeline = sum(opp.value for opp in opportunities)
        weighted_pipeline = sum(opp.value * (opp.probability / 100) for opp in opportunities)

        by_stage = {}
        for stage in OpportunityStage:
            if stage in [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST]:
                continue
            stage_opps = [opp for opp in opportunities if opp.stage == stage]
            by_stage[stage.value] = {
                "opportunities": stage_opps,
                "total_value": sum(opp.value for opp in stage_opps),
                "weighted_value": sum(opp.value * (opp.probability / 100) for opp in stage_opps),
                "count": len(stage_opps),
            }

        return {
            "total_pipeline_value": total_pipeline,
            "weighted_pipeline_value": weighted_pipeline,
            "by_stage": by_stage,
        }

    async def get_stage_counts(self) -> dict:
        """Get count of opportunities by stage"""
        stmt = select(Opportunity.stage, func.count(Opportunity.id)).group_by(Opportunity.stage)
        result = await self.session.execute(stmt)
        return {row[0]: row[1] for row in result.all()}

    async def get_by_customer(self, customer_id: UUID) -> List[Opportunity]:
        stmt = select(Opportunity).where(Opportunity.customer_id == customer_id).order_by(Opportunity.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())