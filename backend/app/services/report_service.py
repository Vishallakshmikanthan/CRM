from __future__ import annotations

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.opportunity import Opportunity, OpportunityStage
from app.models.lead import Lead, LeadStatus
from app.models.customer import Customer
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.report import (
    RevenueReportResponse,
    SalesReportResponse,
    LeadReportResponse,
    ReportFilters,
    ExportFormat,
)
from app.core.exceptions import ValidationError


class ReportService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_revenue_report(self, filters: ReportFilters) -> RevenueReport:
        # Build base query for won opportunities
        query = select(
            func.count(Opportunity.id).label("total_deals"),
            func.sum(Opportunity.value).label("total_revenue"),
            func.avg(Opportunity.value).label("avg_deal_size"),
        ).where(Opportunity.stage == OpportunityStage.CLOSED_WON)

        if filters.date_from:
            query = query.where(Opportunity.actual_close_date >= filters.date_from)
        if filters.date_to:
            query = query.where(Opportunity.actual_close_date <= filters.date_to)
        if filters.assigned_to:
            query = query.where(Opportunity.assigned_to == filters.assigned_to)

        result = await self.session.execute(query)
        row = result.first()

        # Get monthly breakdown
        monthly_query = select(
            func.date_trunc('month', Opportunity.actual_close_date).label("month"),
            func.count(Opportunity.id).label("deals"),
            func.sum(Opportunity.value).label("revenue"),
        ).where(Opportunity.stage == OpportunityStage.CLOSED_WON)

        if filters.date_from:
            monthly_query = monthly_query.where(Opportunity.actual_close_date >= filters.date_from)
        if filters.date_to:
            monthly_query = monthly_query.where(Opportunity.actual_close_date <= filters.date_to)
        if filters.assigned_to:
            monthly_query = monthly_query.where(Opportunity.assigned_to == filters.assigned_to)

        monthly_query = monthly_query.group_by(func.date_trunc('month', Opportunity.actual_close_date))
        monthly_query = monthly_query.order_by(func.date_trunc('month', Opportunity.actual_close_date))

        monthly_result = await self.session.execute(monthly_query)
        monthly_data = [
            {"month": r.month.strftime("%Y-%m"), "deals": r.deals, "revenue": float(r.revenue or 0)}
            for r in monthly_result
        ]

        return RevenueReport(
            total_deals=row.total_deals or 0,
            total_revenue=float(row.total_revenue or 0),
            avg_deal_size=float(row.avg_deal_size or 0),
            monthly_breakdown=monthly_data,
        )

    async def get_sales_report(self, filters: ReportFilters) -> SalesReport:
        # Pipeline value by stage
        pipeline_query = select(
            Opportunity.stage,
            func.count(Opportunity.id).label("count"),
            func.sum(Opportunity.value).label("value"),
            func.sum(Opportunity.value * Opportunity.probability / 100).label("weighted_value"),
        ).where(Opportunity.stage.not_in([OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST]))

        if filters.assigned_to:
            pipeline_query = pipeline_query.where(Opportunity.assigned_to == filters.assigned_to)

        pipeline_query = pipeline_query.group_by(Opportunity.stage)
        pipeline_result = await self.session.execute(pipeline_query)

        pipeline_by_stage = [
            {
                "stage": r.stage.value,
                "count": r.count,
                "value": float(r.value or 0),
                "weighted_value": float(r.weighted_value or 0),
            }
            for r in pipeline_result
        ]

        # Conversion rates
        total_leads_query = select(func.count(Lead.id))
        if filters.date_from:
            total_leads_query = total_leads_query.where(Lead.created_at >= filters.date_from)
        if filters.date_to:
            total_leads_query = total_leads_query.where(Lead.created_at <= filters.date_to)
        if filters.assigned_to:
            total_leads_query = total_leads_query.where(Lead.assigned_to == filters.assigned_to)

        total_leads_result = await self.session.execute(total_leads_query)
        total_leads = total_leads_result.scalar() or 0

        converted_leads_query = select(func.count(Lead.id)).where(Lead.status == LeadStatus.CONVERTED)
        if filters.date_from:
            converted_leads_query = converted_leads_query.where(Lead.created_at >= filters.date_from)
        if filters.date_to:
            converted_leads_query = converted_leads_query.where(Lead.created_at <= filters.date_to)
        if filters.assigned_to:
            converted_leads_query = converted_leads_query.where(Lead.assigned_to == filters.assigned_to)

        converted_leads_result = await self.session.execute(converted_leads_query)
        converted_leads = converted_leads_result.scalar() or 0

        conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0

        # Average sales cycle
        cycle_query = select(
            func.avg(func.extract('epoch', Opportunity.actual_close_date - Opportunity.created_at) / 86400)
        ).where(Opportunity.stage == OpportunityStage.CLOSED_WON)

        if filters.date_from:
            cycle_query = cycle_query.where(Opportunity.actual_close_date >= filters.date_from)
        if filters.date_to:
            cycle_query = cycle_query.where(Opportunity.actual_close_date <= filters.date_to)
        if filters.assigned_to:
            cycle_query = cycle_query.where(Opportunity.assigned_to == filters.assigned_to)

        cycle_result = await self.session.execute(cycle_query)
        avg_sales_cycle = cycle_result.scalar() or 0

        # Top performers
        top_performers_query = select(
            User.id,
            User.full_name,
            func.count(Opportunity.id).label("deals_closed"),
            func.sum(Opportunity.value).label("revenue"),
        ).join(Opportunity, User.id == Opportunity.assigned_to).where(
            Opportunity.stage == OpportunityStage.CLOSED_WON
        )

        if filters.date_from:
            top_performers_query = top_performers_query.where(Opportunity.actual_close_date >= filters.date_from)
        if filters.date_to:
            top_performers_query = top_performers_query.where(Opportunity.actual_close_date <= filters.date_to)

        top_performers_query = top_performers_query.group_by(User.id, User.full_name)
        top_performers_query = top_performers_query.order_by(func.sum(Opportunity.value).desc())
        top_performers_query = top_performers_query.limit(10)

        top_performers_result = await self.session.execute(top_performers_query)
        top_performers = [
            {
                "user_id": str(r.id),
                "name": r.full_name,
                "deals_closed": r.deals_closed,
                "revenue": float(r.revenue or 0),
            }
            for r in top_performers_result
        ]

        return SalesReport(
            pipeline_by_stage=pipeline_by_stage,
            total_pipeline_value=sum(p["value"] for p in pipeline_by_stage),
            weighted_pipeline_value=sum(p["weighted_value"] for p in pipeline_by_stage),
            conversion_rate=round(conversion_rate, 2),
            avg_sales_cycle_days=round(avg_sales_cycle, 1),
            top_performers=top_performers,
        )

    async def get_lead_report(self, filters: ReportFilters) -> LeadReport:
        # Leads by source
        source_query = select(
            Lead.source,
            func.count(Lead.id).label("count"),
        ).group_by(Lead.source)

        if filters.date_from:
            source_query = source_query.where(Lead.created_at >= filters.date_from)
        if filters.date_to:
            source_query = source_query.where(Lead.created_at <= filters.date_to)
        if filters.assigned_to:
            source_query = source_query.where(Lead.assigned_to == filters.assigned_to)

        source_result = await self.session.execute(source_query)
        leads_by_source = [
            {"source": r.source or "Unknown", "count": r.count}
            for r in source_result
        ]

        # Leads by status
        status_query = select(
            Lead.status,
            func.count(Lead.id).label("count"),
        ).group_by(Lead.status)

        if filters.date_from:
            status_query = status_query.where(Lead.created_at >= filters.date_from)
        if filters.date_to:
            status_query = status_query.where(Lead.created_at <= filters.date_to)
        if filters.assigned_to:
            status_query = status_query.where(Lead.assigned_to == filters.assigned_to)

        status_result = await self.session.execute(status_query)
        leads_by_status = [
            {"status": r.status.value, "count": r.count}
            for r in status_result
        ]

        # Conversion funnel
        funnel_stages = [
            ("new", LeadStatus.NEW),
            ("contacted", LeadStatus.CONTACTED),
            ("qualified", LeadStatus.QUALIFIED),
            ("proposal", LeadStatus.PROPOSAL),
            ("converted", LeadStatus.CONVERTED),
            ("lost", LeadStatus.LOST),
        ]

        funnel = []
        for label, status in funnel_stages:
            count_query = select(func.count(Lead.id)).where(Lead.status == status)
            if filters.date_from:
                count_query = count_query.where(Lead.created_at >= filters.date_from)
            if filters.date_to:
                count_query = count_query.where(Lead.created_at <= filters.date_to)
            if filters.assigned_to:
                count_query = count_query.where(Lead.assigned_to == filters.assigned_to)
            count_result = await self.session.execute(count_query)
            funnel.append({"stage": label, "count": count_result.scalar() or 0})

        # Total leads
        total_query = select(func.count(Lead.id))
        if filters.date_from:
            total_query = total_query.where(Lead.created_at >= filters.date_from)
        if filters.date_to:
            total_query = total_query.where(Lead.created_at <= filters.date_to)
        if filters.assigned_to:
            total_query = total_query.where(Lead.assigned_to == filters.assigned_to)

        total_result = await self.session.execute(total_query)
        total_leads = total_result.scalar() or 0

        converted_query = select(func.count(Lead.id)).where(Lead.status == LeadStatus.CONVERTED)
        if filters.date_from:
            converted_query = converted_query.where(Lead.created_at >= filters.date_from)
        if filters.date_to:
            converted_query = converted_query.where(Lead.created_at <= filters.date_to)
        if filters.assigned_to:
            converted_query = converted_query.where(Lead.assigned_to == filters.assigned_to)

        converted_result = await self.session.execute(converted_query)
        converted_leads = converted_result.scalar() or 0

        conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0

        return LeadReport(
            total_leads=total_leads,
            converted_leads=converted_leads,
            conversion_rate=round(conversion_rate, 2),
            leads_by_source=leads_by_source,
            leads_by_status=leads_by_status,
            funnel=funnel,
        )

    async def export_report(
        self,
        report_type: str,
        filters: ReportFilters,
        format: ExportFormat,
    ) -> bytes:
        if report_type == "revenue":
            report = await self.get_revenue_report(filters)
        elif report_type == "sales":
            report = await self.get_sales_report(filters)
        elif report_type == "leads":
            report = await self.get_lead_report(filters)
        else:
            raise ValidationError(f"Unknown report type: {report_type}")

        if format == ExportFormat.CSV:
            return self._export_csv(report, report_type)
        elif format == ExportFormat.PDF:
            return self._export_pdf(report, report_type)
        else:
            raise ValidationError(f"Unsupported format: {format}")

    def _export_csv(self, report, report_type: str) -> bytes:
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)

        if report_type == "revenue":
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Total Deals", report.total_deals])
            writer.writerow(["Total Revenue", report.total_revenue])
            writer.writerow(["Average Deal Size", report.avg_deal_size])
            writer.writerow([])
            writer.writerow(["Month", "Deals", "Revenue"])
            for m in report.monthly_breakdown:
                writer.writerow([m["month"], m["deals"], m["revenue"]])

        elif report_type == "sales":
            writer.writerow(["Stage", "Count", "Value", "Weighted Value"])
            for p in report.pipeline_by_stage:
                writer.writerow([p["stage"], p["count"], p["value"], p["weighted_value"]])
            writer.writerow([])
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Total Pipeline Value", report.total_pipeline_value])
            writer.writerow(["Weighted Pipeline Value", report.weighted_pipeline_value])
            writer.writerow(["Conversion Rate", f"{report.conversion_rate}%"])
            writer.writerow(["Avg Sales Cycle (days)", report.avg_sales_cycle_days])
            writer.writerow([])
            writer.writerow(["User", "Deals Closed", "Revenue"])
            for tp in report.top_performers:
                writer.writerow([tp["name"], tp["deals_closed"], tp["revenue"]])

        elif report_type == "leads":
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Total Leads", report.total_leads])
            writer.writerow(["Converted Leads", report.converted_leads])
            writer.writerow(["Conversion Rate", f"{report.conversion_rate}%"])
            writer.writerow([])
            writer.writerow(["Source", "Count"])
            for s in report.leads_by_source:
                writer.writerow([s["source"], s["count"]])
            writer.writerow([])
            writer.writerow(["Status", "Count"])
            for s in report.leads_by_status:
                writer.writerow([s["status"], s["count"]])
            writer.writerow([])
            writer.writerow(["Funnel Stage", "Count"])
            for f in report.funnel:
                writer.writerow([f["stage"], f["count"]])

        return output.getvalue().encode("utf-8")

    def _export_pdf(self, report, report_type: str) -> bytes:
        # Simple PDF generation using reportlab
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        import io

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        title = f"{report_type.capitalize()} Report"
        elements.append(Paragraph(title, styles['Title']))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))

        if report_type == "revenue":
            data = [
                ["Metric", "Value"],
                ["Total Deals", str(report.total_deals)],
                ["Total Revenue", f"${report.total_revenue:,.2f}"],
                ["Average Deal Size", f"${report.avg_deal_size:,.2f}"],
            ]
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 12))

            if report.monthly_breakdown:
                elements.append(Paragraph("Monthly Breakdown", styles['Heading2']))
                monthly_data = [["Month", "Deals", "Revenue"]]
                for m in report.monthly_breakdown:
                    monthly_data.append([m["month"], str(m["deals"]), f"${m['revenue']:,.2f}"])
                monthly_table = Table(monthly_data)
                monthly_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                elements.append(monthly_table)

        elif report_type == "sales":
            data = [["Stage", "Count", "Value", "Weighted Value"]]
            for p in report.pipeline_by_stage:
                data.append([p["stage"], str(p["count"]), f"${p['value']:,.2f}", f"${p['weighted_value']:,.2f}"])
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 12))

            summary_data = [
                ["Metric", "Value"],
                ["Total Pipeline Value", f"${report.total_pipeline_value:,.2f}"],
                ["Weighted Pipeline Value", f"${report.weighted_pipeline_value:,.2f}"],
                ["Conversion Rate", f"{report.conversion_rate}%"],
                ["Avg Sales Cycle (days)", str(report.avg_sales_cycle_days)],
            ]
            summary_table = Table(summary_data)
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(summary_table)

        elif report_type == "leads":
            data = [
                ["Metric", "Value"],
                ["Total Leads", str(report.total_leads)],
                ["Converted Leads", str(report.converted_leads)],
                ["Conversion Rate", f"{report.conversion_rate}%"],
            ]
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 12))

            if report.leads_by_source:
                elements.append(Paragraph("Leads by Source", styles['Heading2']))
                source_data = [["Source", "Count"]]
                for s in report.leads_by_source:
                    source_data.append([s["source"], str(s["count"])])
                source_table = Table(source_data)
                source_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                elements.append(source_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer.read()