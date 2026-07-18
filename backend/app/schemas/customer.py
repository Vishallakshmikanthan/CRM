from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class CustomerBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    annual_revenue: Optional[float] = None
    employee_count: Optional[int] = None
    status: str = Field(default="active", max_length=50)
    source: Optional[str] = Field(None, max_length=100)
    assigned_to: Optional[UUID] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    annual_revenue: Optional[float] = None
    employee_count: Optional[int] = None
    status: Optional[str] = Field(None, max_length=50)
    source: Optional[str] = Field(None, max_length=100)
    assigned_to: Optional[UUID] = None


class CustomerContactBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = Field(None, max_length=100)
    is_primary: bool = False


class CustomerContactCreate(CustomerContactBase):
    pass


class CustomerContactUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = Field(None, max_length=100)
    is_primary: Optional[bool] = None


class CustomerContactResponse(CustomerContactBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_id: UUID
    created_at: datetime
    updated_at: datetime


class CustomerNoteBase(BaseModel):
    content: str = Field(..., min_length=1)


class CustomerNoteCreate(CustomerNoteBase):
    pass


class CustomerNoteResponse(CustomerNoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class CustomerTimelineBase(BaseModel):
    activity_type: str = Field(..., max_length=50)
    description: str = Field(..., min_length=1)
    metadata: Optional[dict] = None


class CustomerTimelineCreate(CustomerTimelineBase):
    pass


class CustomerTimelineResponse(CustomerTimelineBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_id: UUID
    user_id: UUID
    created_at: datetime


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    contacts: List[CustomerContactResponse] = []
    notes: List[CustomerNoteResponse] = []
    timeline: List[CustomerTimelineResponse] = []


class CustomerListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_name: str
    contact_person: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    city: Optional[str]
    country: Optional[str]
    industry: Optional[str]
    status: str
    source: Optional[str]
    assigned_to: Optional[UUID]
    created_at: datetime
    updated_at: datetime


class CustomerPaginatedResponse(BaseModel):
    items: List[CustomerListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int