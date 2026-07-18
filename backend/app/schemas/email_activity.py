from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict, EmailStr


class EmailActivityBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=500)
    body: str = Field(..., min_length=1)
    direction: str = Field(..., max_length=20)
    status: str = Field(default="draft", max_length=20)
    sent_at: Optional[datetime] = None
    from_email: EmailStr
    to_emails: List[EmailStr] = Field(..., min_length=1)
    cc_emails: Optional[List[EmailStr]] = None
    bcc_emails: Optional[List[EmailStr]] = None
    related_type: Optional[str] = Field(None, max_length=50)
    related_id: Optional[UUID] = None
    email_metadata: Optional[dict] = None


class EmailActivityCreate(EmailActivityBase):
    pass


class EmailActivityUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=1, max_length=500)
    body: Optional[str] = None
    direction: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None, max_length=20)
    sent_at: Optional[datetime] = None
    from_email: Optional[EmailStr] = None
    to_emails: Optional[List[EmailStr]] = None
    cc_emails: Optional[List[EmailStr]] = None
    bcc_emails: Optional[List[EmailStr]] = None
    related_type: Optional[str] = Field(None, max_length=50)
    related_id: Optional[UUID] = None
    email_metadata: Optional[dict] = None


class EmailActivityResponse(EmailActivityBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class EmailActivityListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subject: str
    direction: str
    status: str
    sent_at: Optional[datetime]
    from_email: str
    to_emails: List[str]
    related_type: Optional[str]
    related_id: Optional[UUID]
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class EmailActivityPaginatedResponse(BaseModel):
    items: List[EmailActivityListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EmailThreadResponse(BaseModel):
    related_type: str
    related_id: UUID
    emails: List[EmailActivityListResponse]
    total_count: int