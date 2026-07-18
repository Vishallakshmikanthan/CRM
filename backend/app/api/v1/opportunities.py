from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.opportunity import (
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityResponse,
    OpportunityListResponse,
    OpportunityStageUpdate,
    OpportunityPipelineResponse,
)
from app.services.opportunity_service import OpportunityService

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.post("", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    data: OpportunityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OpportunityService(db)
    opportunity = await service.create_opportunity(data, current_user.id)
    return opportunity


@router.get("", response_model=OpportunityListResponse)
async def list_opportunities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    assigned_to: Optional[UUID] = Query(None),
    customer_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OpportunityService(db)
    opportunities, total = await service.get_opportunities(
        page=page,
        page_size=page_size,
        search=search,
        stage=stage,
        assigned_to=assigned_to,
        customer_id=customer_id,
    )
    return OpportunityListResponse(
        items=opportunities,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/pipeline", response_model=OpportunityPipelineResponse)
async def get_pipeline(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OpportunityService(db)
    pipeline = await service.get_pipeline()
    return pipeline


@router.get("/forecast")
async def get_forecast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OpportunityService(db)
    return await service.get_forecast()


@router.get("/stage-counts")
async def get_stage_counts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OpportunityService(db)
    return await service.get_stage_counts()


@router.get("/{opportunity_id}", response_model=OpportunityResponse)
async def get_opportunity(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OpportunityService(db)
    opportunity = await service.get_opportunity(opportunity_id)
    return opportunity


@router.patch("/{opportunity_id}", response_model=OpportunityResponse)
async def update_opportunity(
    opportunity_id: UUID,
    data: OpportunityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OpportunityService(db)
    opportunity = await service.update_opportunity(opportunity_id, data, current_user.id)
    return opportunity


@router.patch("/{opportunity_id}/stage", response_model=OpportunityResponse)
async def update_opportunity_stage(
    opportunity_id: UUID,
    data: OpportunityStageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OpportunityService(db)
    opportunity = await service.update_opportunity_stage(opportunity_id, data, current_user.id)
    return opportunity


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OpportunityService(db)
    await service.delete_opportunity(opportunity_id)


@router.get("/customer/{customer_id}", response_model=list[OpportunityResponse])
async def get_opportunities_by_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = OpportunityService(db)
    opportunities = await service.get_by_customer(customer_id)
    return opportunities