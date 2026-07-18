from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    type: str = Field(default="task", max_length=50)
    priority: str = Field(default="medium", max_length=20)
    status: str = Field(default="pending", max_length=20)
    due_date: Optional[datetime] = None
    assigned_to: Optional[UUID] = None
    related_type: Optional[str] = Field(None, max_length=50)
    related_id: Optional[UUID] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    type: Optional[str] = Field(None, max_length=50)
    priority: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None, max_length=20)
    due_date: Optional[datetime] = None
    assigned_to: Optional[UUID] = None
    related_type: Optional[str] = Field(None, max_length=50)
    related_id: Optional[UUID] = None


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class TaskListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: Optional[str]
    type: str
    priority: str
    status: str
    due_date: Optional[datetime]
    assigned_to: Optional[UUID]
    related_type: Optional[str]
    related_id: Optional[UUID]
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class TaskPaginatedResponse(BaseModel):
    items: List[TaskListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class TaskCompleteUpdate(BaseModel):
    status: str = Field(default="completed", max_length=20)


class TaskStatusUpdate(BaseModel):
    status: str = Field(..., max_length=20)


class TaskCalendarEvent(BaseModel):
    id: UUID
    title: str
    start: datetime
    end: Optional[datetime] = None
    all_day: bool = False
    color: Optional[str] = None
    extended_props: dict = {}


class TaskCalendarResponse(BaseModel):
    events: List[TaskCalendarEvent]
