from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskStatus, TaskPriority, TaskType
from app.repositories.base_repository import BaseRepository


class TaskRepository(BaseRepository[Task]):
    def __init__(self, session: AsyncSession):
        super().__init__(Task, session)

    async def get_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_to: Optional[UUID] = None,
        related_type: Optional[str] = None,
        related_id: Optional[UUID] = None,
        due_date_from: Optional[datetime] = None,
        due_date_to: Optional[datetime] = None,
    ) -> tuple[List[Task], int]:
        stmt = select(Task)
        count_stmt = select(func.count(Task.id))

        conditions = []
        if search:
            conditions.append(
                or_(
                    Task.title.ilike(f"%{search}%"),
                    Task.description.ilike(f"%{search}%"),
                )
            )
        if status:
            conditions.append(Task.status == status)
        if priority:
            conditions.append(Task.priority == priority)
        if assigned_to:
            conditions.append(Task.assigned_to == assigned_to)
        if related_type:
            conditions.append(Task.related_type == related_type)
        if related_id:
            conditions.append(Task.related_id == related_id)
        if due_date_from:
            conditions.append(Task.due_date >= due_date_from)
        if due_date_to:
            conditions.append(Task.due_date <= due_date_to)

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        total = await self.session.scalar(count_stmt)
        stmt = stmt.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(stmt)
        items = result.scalars().all()
        return list(items), total

    async def get_calendar_events(
        self,
        start_date: datetime,
        end_date: datetime,
        assigned_to: Optional[UUID] = None,
    ) -> List[Task]:
        stmt = select(Task).where(
            and_(
                Task.due_date >= start_date,
                Task.due_date <= end_date,
                Task.status != TaskStatus.COMPLETED,
            )
        )
        if assigned_to:
            stmt = stmt.where(Task.assigned_to == assigned_to)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_related(self, related_type: str, related_id: UUID) -> List[Task]:
        stmt = select(Task).where(
            and_(Task.related_type == related_type, Task.related_id == related_id)
        ).order_by(Task.due_date.asc().nullslast())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_status_counts(self, assigned_to: Optional[UUID] = None) -> dict:
        stmt = select(Task.status, func.count(Task.id)).group_by(Task.status)
        if assigned_to:
            stmt = stmt.where(Task.assigned_to == assigned_to)
        result = await self.session.execute(stmt)
        return {row[0]: row[1] for row in result.all()}

    async def get_overdue_tasks(self, assigned_to: Optional[UUID] = None) -> List[Task]:
        now = datetime.utcnow()
        stmt = select(Task).where(
            and_(
                Task.due_date < now,
                Task.status != TaskStatus.COMPLETED,
                Task.status != TaskStatus.CANCELLED,
            )
        )
        if assigned_to:
            stmt = stmt.where(Task.assigned_to == assigned_to)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())