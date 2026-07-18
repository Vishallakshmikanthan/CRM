from pydantic import BaseModel, EmailStr, HttpUrl, Field
from typing import Optional
from datetime import datetime
import uuid


class CompanySettingsBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    website: Optional[HttpUrl] = None
    timezone: str = Field(default="UTC", max_length=50)
    currency: str = Field(default="USD", max_length=3)
    date_format: str = Field(default="MM/DD/YYYY", max_length=20)
    fiscal_year_start: int = Field(default=1, ge=1, le=12)


class CompanySettingsCreate(CompanySettingsBase):
    pass


class CompanySettingsUpdate(CompanySettingsBase):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    timezone: Optional[str] = Field(None, max_length=50)
    currency: Optional[str] = Field(None, max_length=3)
    date_format: Optional[str] = Field(None, max_length=20)
    fiscal_year_start: Optional[int] = Field(None, ge=1, le=12)


class CompanySettingsResponse(CompanySettingsBase):
    id: uuid.UUID
    logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True