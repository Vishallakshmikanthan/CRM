from __future__ import annotations

from typing import Optional
from uuid import UUID
from datetime import date
from io import BytesIO

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.report import (
    RevenueReportResponse,
    SalesReportResponse,
    LeadReportResponse,
    ReportExportRequest,
)
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/revenue", response_model=RevenueReportResponse)
async def get_revenue_report(
    date_from: date = Query(...),
    date_to: date = Query(...),
    group_by: str = Query("month", pattern="^(day|week|month|quarter|year)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportService(db)
    return await service.get_revenue_report(date_from, date_to, group_by)


@router.get("/sales", response_model=SalesReportResponse)
async def get_sales_report(
    date_from: date = Query(...),
    date_to: date = Query(...),
    group_by: str = Query("month", pattern="^(day|week|month|quarter|year)$"),
    assigned_to: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportService(db)
    return await service.get_sales_report(date_from, date_to, group_by, assigned_to)


@router.get("/leads", response_model=LeadReportResponse)
async def get_lead_report(
    date_from: date = Query(...),
    date_to: date = Query(...),
    group_by: str = Query("month", pattern="^(day|week|month|quarter|year)$"),
    source: Optional[str] = Query(None),
    assigned_to: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportService(db)
    return await service.get_lead_report(date_from, date_to, group_by, source, assigned_to)


@router.post("/export/csv")
async def export_csv(
    request: ReportExportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportService(db)
    csv_data = await service.export_csv(request)
    
    return StreamingResponse(
        BytesIO(csv_data.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={request.report_type}_report.csv"},
    )


@router.post("/export/pdf")
async def export_pdf(
    request: ReportExportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportService(db)
    pdf_data = await service.export_pdf(request)
    
    return StreamingResponse(
        BytesIO(pdf_data),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={request.report_type}_report.pdf"},
    )


@router.get("/summary")
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportService(db)
    return await service.get_summary()