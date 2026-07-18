from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskStatus, TaskPriority, TaskType
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatusUpdate
from app.core.exceptions import NotFoundException as NotFoundError, ValidationException as ValidationError


class TaskService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.task_repo = TaskRepository(session)

    async def create_task(self, data: TaskCreate, user_id: UUID) -> Task:
        task = Task(**data.model_dump(), created_by=user_id)
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def get_task(self, task_id: UUID) -> Task:
        task = await self.task_repo.get(task_id)
        if not task:
            raise NotFoundError("Task not found")
        return task

    async def get_tasks(
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
        return await self.task_repo.get_paginated(
            page=page,
            page_size=page_size,
            search=search,
            status=status,
            priority=priority,
            assigned_to=assigned_to,
            related_type=related_type,
            related_id=related_id,
            due_date_from=due_date_from,
            due_date_to=due_date_to,
        )

    async def update_task(self, task_id: UUID, data: TaskUpdate, user_id: UUID) -> Task:
        task = await self.task_repo.get(task_id)
        if not task:
            raise NotFoundError("Task not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        task.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def update_task_status(self, task_id: UUID, data: TaskStatusUpdate, user_id: UUID) -> Task:
        task = await self.task_repo.get(task_id)
        if not task:
            raise NotFoundError("Task not found")

        if data.status not in [s.value for s in TaskStatus]:
            raise ValidationError(f"Invalid status: {data.status}")

        task.status = data.status
        task.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def delete_task(self, task_id: UUID) -> None:
        task = await self.task_repo.get(task_id)
        if not task:
            raise NotFoundError("Task not found")
        await self.task_repo.delete(task_id)
        await self.session.commit()

    async def get_calendar_events(
        self,
        start_date: datetime,
        end_date: datetime,
        assigned_to: Optional[UUID] = None,
    ) -> List[Task]:
        return await self.task_repo.get_calendar_events(start_date, end_date, assigned_to)

    async def get_by_related(self, related_type: str, related_id: UUID) -> List[Task]:
        return await self.task_repo.get_by_related(related_type, related_id)

    async def get_status_counts(self, assigned_to: Optional[UUID] = None) -> dict:
        return await self.task_repo.get_status_counts(assigned_to)

    async def get_overdue_tasks(self, assigned_to: Optional[UUID] = None) -> List[Task]:
        return await self.task_repo.get_overdue_tasks(assigned_to)