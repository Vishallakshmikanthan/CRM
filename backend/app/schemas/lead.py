from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class LeadBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    company: Optional[str] = Field(None, max_length=255)
    source: str = Field(default="other", max_length=50)
    status: str = Field(default="new", max_length=50)
    estimated_value: Optional[float] = None
    notes: Optional[str] = None
    assigned_to: Optional[UUID] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    company: Optional[str] = Field(None, max_length=255)
    source: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    estimated_value: Optional[float] = None
    notes: Optional[str] = None
    assigned_to: Optional[UUID] = None


class LeadResponse(LeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class LeadListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    company: Optional[str]
    source: str
    status: str
    estimated_value: Optional[float]
    assigned_to: Optional[UUID]
    created_at: datetime
    updated_at: datetime


class LeadPaginatedResponse(BaseModel):
    items: List[LeadListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class LeadStatusUpdate(BaseModel):
    status: str = Field(..., max_length=50)


class LeadAssignUpdate(BaseModel):
    assigned_to: Optional[UUID] = None


class LeadPipelineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    count: int
    leads: List[LeadListResponse]
