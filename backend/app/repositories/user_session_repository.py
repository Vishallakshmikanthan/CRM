from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_session import UserSession
from app.repositories.base_repository import BaseRepository


class UserSessionRepository(BaseRepository[UserSession]):
    def __init__(self, session: AsyncSession):
        super().__init__(UserSession, session)

    async def get_by_refresh_token(self, refresh_token: str) -> Optional[UserSession]:
        result = await self.session.execute(
            select(UserSession).where(
                and_(
                    UserSession.refresh_token == refresh_token,
                    UserSession.revoked_at.is_(None),
                    UserSession.expires_at > datetime.now(timezone.utc),
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_active_sessions_by_user(self, user_id: UUID) -> List[UserSession]:
        result = await self.session.execute(
            select(UserSession).where(
                and_(
                    UserSession.user_id == user_id,
                    UserSession.revoked_at.is_(None),
                    UserSession.expires_at > datetime.now(timezone.utc),
                )
            )
        )
        return list(result.scalars().all())

    async def revoke_session(self, session_id: UUID) -> bool:
        session = await self.get_by_id(session_id)
        if session:
            session.revoked_at = datetime.now(timezone.utc)
            await self.session.flush()
            return True
        return False

    async def revoke_all_user_sessions(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(UserSession).where(
                and_(
                    UserSession.user_id == user_id,
                    UserSession.revoked_at.is_(None),
                )
            )
        )
        sessions = result.scalars().all()
        count = 0
        for session in sessions:
            session.revoked_at = datetime.now(timezone.utc)
            count += 1
        await self.session.flush()
        return count

    async def cleanup_expired_sessions(self) -> int:
        result = await self.session.execute(
            select(UserSession).where(
                and_(
                    UserSession.expires_at <= datetime.now(timezone.utc),
                    UserSession.revoked_at.is_(None),
                )
            )
        )
        sessions = result.scalars().all()
        count = 0
        for session in sessions:
            session.revoked_at = datetime.now(timezone.utc)
            count += 1
        await self.session.flush()
        return count