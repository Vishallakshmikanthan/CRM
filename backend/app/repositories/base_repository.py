from typing import Any, Generic, List, Optional, Type, TypeVar
from uuid import UUID

from sqlalchemy import select, func, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get(self, id: UUID) -> Optional[ModelType]:
        result = await self.session.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_field(self, field: str, value: Any) -> Optional[ModelType]:
        result = await self.session.execute(
            select(self.model).where(getattr(self.model, field) == value)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        order_by: Optional[str] = None,
        order_desc: bool = False,
        **filters,
    ) -> List[ModelType]:
        query = select(self.model)

        for field, value in filters.items():
            if value is not None:
                query = query.where(getattr(self.model, field) == value)

        if order_by:
            order_column = getattr(self.model, order_by)
            if order_desc:
                query = query.order_by(order_column.desc())
            else:
                query = query.order_by(order_column.asc())

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count(self, **filters) -> int:
        query = select(func.count(self.model.id))

        for field, value in filters.items():
            if value is not None:
                query = query.where(getattr(self.model, field) == value)

        result = await self.session.execute(query)
        return result.scalar_one()

    async def create(self, **kwargs) -> ModelType:
        obj = self.model(**kwargs)
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def update(self, id: UUID, **kwargs) -> Optional[ModelType]:
        obj = await self.get(id)
        if not obj:
            return None

        for key, value in kwargs.items():
            if value is not None:
                setattr(obj, key, value)

        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def delete(self, id: UUID) -> bool:
        obj = await self.get(id)
        if not obj:
            return False

        await self.session.delete(obj)
        await self.session.flush()
        return True

    async def exists(self, id: UUID) -> bool:
        result = await self.session.execute(
            select(func.count(self.model.id)).where(self.model.id == id)
        )
        return result.scalar_one() > 0

    async def bulk_create(self, objects: List[dict]) -> List[ModelType]:
        objs = [self.model(**obj) for obj in objects]
        self.session.add_all(objs)
        await self.session.flush()
        for obj in objs:
            await self.session.refresh(obj)
        return objs

    async def bulk_update(self, updates: List[dict]) -> int:
        if not updates:
            return 0

        count = 0
        for update_data in updates:
            id = update_data.pop("id", None)
            if id:
                result = await self.update(id, **update_data)
                if result:
                    count += 1
        return count