from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.company_settings import CompanySettings, Team, TeamMember
from app.repositories.user_repository import UserRepository
from app.schemas.settings import (
    CompanySettingsUpdate,
    TeamCreate,
    TeamUpdate,
    TeamMemberAdd,
    UserCreate,
    UserUpdate,
    UserRoleUpdate,
)
from app.core.exceptions import NotFoundError, ValidationError
from app.core.security import get_password_hash


class SettingsService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    # Company Settings
    async def get_company_settings(self) -> CompanySettings:
        result = await self.session.execute(select(CompanySettings).limit(1))
        settings = result.scalar_one_or_none()
        if not settings:
            settings = CompanySettings()
            self.session.add(settings)
            await self.session.commit()
            await self.session.refresh(settings)
        return settings

    async def update_company_settings(self, data: CompanySettingsUpdate) -> CompanySettings:
        settings = await self.get_company_settings()
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        settings.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(settings)
        return settings

    # User Management
    async def create_user(self, data: UserCreate, current_user_id: UUID) -> User:
        # Check if email exists
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise ValidationError("Email already registered")

        user = User(
            email=data.email,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            role=data.role,
            is_active=True,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_users(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[User], int]:
        return await self.user_repo.get_paginated(
            page=page,
            page_size=page_size,
            search=search,
            role=role,
            is_active=is_active,
        )

    async def get_user(self, user_id: UUID) -> User:
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    async def update_user(self, user_id: UUID, data: UserUpdate) -> User:
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError("User not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        user.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update_user_role(self, user_id: UUID, data: UserRoleUpdate) -> User:
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError("User not found")

        if data.role not in [r.value for r in UserRole]:
            raise ValidationError(f"Invalid role: {data.role}")

        user.role = data.role
        user.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def deactivate_user(self, user_id: UUID) -> User:
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError("User not found")

        user.is_active = False
        user.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def activate_user(self, user_id: UUID) -> User:
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError("User not found")

        user.is_active = True
        user.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def delete_user(self, user_id: UUID) -> None:
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        await self.user_repo.delete(user_id)
        await self.session.commit()

    # Team Management
    async def create_team(self, data: TeamCreate, current_user_id: UUID) -> Team:
        team = Team(name=data.name, description=data.description)
        self.session.add(team)
        await self.session.flush()

        # Add creator as team lead
        member = TeamMember(team_id=team.id, user_id=current_user_id, role="lead")
        self.session.add(member)

        await self.session.commit()
        await self.session.refresh(team)
        return team

    async def get_teams(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> tuple[List[Team], int]:
        from app.repositories.base_repository import BaseRepository
        team_repo = BaseRepository(Team, self.session)
        return await team_repo.get_paginated(page=page, page_size=page_size, search=search)

    async def get_team(self, team_id: UUID) -> Team:
        from app.repositories.base_repository import BaseRepository
        team_repo = BaseRepository(Team, self.session)
        team = await team_repo.get(team_id)
        if not team:
            raise NotFoundError("Team not found")
        return team

    async def update_team(self, team_id: UUID, data: TeamUpdate) -> Team:
        team = await self.get_team(team_id)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(team, field, value)
        team.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(team)
        return team

    async def delete_team(self, team_id: UUID) -> None:
        team = await self.get_team(team_id)
        await self.session.delete(team)
        await self.session.commit()

    async def add_team_member(self, team_id: UUID, data: TeamMemberAdd) -> TeamMember:
        team = await self.get_team(team_id)
        user = await self.user_repo.get(data.user_id)
        if not user:
            raise NotFoundError("User not found")

        # Check if already a member
        existing = await self.session.execute(
            select(TeamMember).where(
                and_(TeamMember.team_id == team_id, TeamMember.user_id == data.user_id)
            )
        )
        if existing.scalar_one_or_none():
            raise ValidationError("User is already a member of this team")

        member = TeamMember(team_id=team_id, user_id=data.user_id, role=data.role)
        self.session.add(member)
        await self.session.commit()
        await self.session.refresh(member)
        return member

    async def remove_team_member(self, team_id: UUID, user_id: UUID) -> None:
        result = await self.session.execute(
            select(TeamMember).where(
                and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            raise NotFoundError("Team member not found")
        await self.session.delete(member)
        await self.session.commit()

    async def get_team_members(self, team_id: UUID) -> List[TeamMember]:
        result = await self.session.execute(
            select(TeamMember).where(TeamMember.team_id == team_id)
        )
        return result.scalars().all()

    async def update_team_member_role(self, team_id: UUID, user_id: UUID, role: str) -> TeamMember:
        result = await self.session.execute(
            select(TeamMember).where(
                and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            raise NotFoundError("Team member not found")
        member.role = role
        await self.session.commit()
        await self.session.refresh(member)
        return member