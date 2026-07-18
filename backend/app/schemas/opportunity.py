from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class OpportunityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    customer_id: UUID
    lead_id: Optional[UUID] = None
    stage: str = Field(default="prospecting", max_length=50)
    value: float = Field(default=0, ge=0)
    probability: int = Field(default=10, ge=0, le=100)
    expected_close_date: Optional[datetime] = None
    actual_close_date: Optional[datetime] = None
    assigned_to: Optional[UUID] = None
    notes: Optional[str] = None


class OpportunityCreate(OpportunityBase):
    pass


class OpportunityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    customer_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    stage: Optional[str] = Field(None, max_length=50)
    value: Optional[float] = Field(None, ge=0)
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[datetime] = None
    actual_close_date: Optional[datetime] = None
    assigned_to: Optional[UUID] = None
    notes: Optional[str] = None


class OpportunityResponse(OpportunityBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class OpportunityListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    customer_id: UUID
    lead_id: Optional[UUID]
    stage: str
    value: float
    probability: int
    expected_close_date: Optional[datetime]
    actual_close_date: Optional[datetime]
    assigned_to: Optional[UUID]
    created_at: datetime
    updated_at: datetime


class OpportunityPaginatedResponse(BaseModel):
    items: List[OpportunityListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class OpportunityStageUpdate(BaseModel):
    stage: str = Field(..., max_length=50)


class OpportunityPipelineResponse(BaseModel):
    stage: str
    opportunities: List[OpportunityListResponse]
    total_value: float
    count: int


class OpportunityForecastResponse(BaseModel):
    total_pipeline_value: float
    weighted_pipeline_value: float
    by_stage: List[OpportunityPipelineResponse]