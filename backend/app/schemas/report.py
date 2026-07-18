from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class ExportFormat(str, Enum):
    CSV = "csv"
    PDF = "pdf"


class RevenueReportItem(BaseModel):
    period: str
    revenue: float
    deals_won: int
    deals_lost: int


class RevenueReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_revenue: float
    total_deals_won: int
    total_deals_lost: int
    win_rate: float
    average_deal_size: float
    by_period: List[RevenueReportItem]


class SalesReportItem(BaseModel):
    user_id: UUID
    user_name: str
    deals_count: int
    total_value: float
    won_count: int
    lost_count: int
    win_rate: float


class SalesReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_deals: int
    total_value: float
    won_deals: int
    lost_deals: int
    win_rate: float
    by_salesperson: List[SalesReportItem]


class LeadReportItem(BaseModel):
    source: str
    count: int
    converted: int
    conversion_rate: float


class LeadReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_leads: int
    converted_leads: int
    conversion_rate: float
    by_source: List[LeadReportItem]
    by_status: List[dict]


class ActivityReportItem(BaseModel):
    user_id: UUID
    user_name: str
    calls: int
    emails: int
    meetings: int
    tasks_completed: int


class ActivityReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_activities: int
    by_user: List[ActivityReportItem]


class ReportFilters(BaseModel):
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    user_id: Optional[UUID] = None
    team_id: Optional[UUID] = None


class ExportRequest(BaseModel):
    report_type: str = Field(..., pattern="^(revenue|sales|leads|activity)$")
    format: str = Field(..., pattern="^(csv|pdf)$")
    filters: Optional[ReportFilters] = None


class ReportExportRequest(BaseModel):
    report_type: str = Field(..., pattern="^(revenue|sales|leads|activity)$")
    format: str = Field(..., pattern="^(csv|pdf)$")
    filters: Optional[ReportFilters] = None
