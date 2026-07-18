from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User email")
    full_name: str = Field(..., min_length=1, max_length=255, description="Full name")
    role: UserRole = Field(default=UserRole.SALES_REP, description="User role")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    timezone: str = Field(default="UTC", max_length=50, description="Timezone")
    language: str = Field(default="en", max_length=10, description="Language")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100, description="Password")


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    role: Optional[UserRole] = None
    phone: Optional[str] = Field(None, max_length=50)
    timezone: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=10)
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = Field(None, max_length=500)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_active: bool
    is_superuser: bool
    avatar_url: Optional[str]
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class UserListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    is_superuser: bool
    avatar_url: Optional[str]
    last_login_at: Optional[datetime]
    created_at: datetime


class UserWithRelations(UserResponse):
    assigned_leads_count: int = 0
    assigned_customers_count: int = 0
    assigned_opportunities_count: int = 0
    assigned_tasks_count: int = 0