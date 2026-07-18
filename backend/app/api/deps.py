from typing import AsyncGenerator, Optional
from uuid import UUID

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.user_session_repository import UserSessionRepository
from app.services.auth_service import AuthService

security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_user_repo(session: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(session)


def get_session_repo(session: AsyncSession = Depends(get_db)) -> UserSessionRepository:
    return UserSessionRepository(session)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    user_repo: UserRepository = Depends(get_user_repo),
) -> User:
    token = None
    if credentials:
        token = credentials.credentials
    elif authorization and authorization.startswith("Bearer "):
        token = authorization[7:]

    if not token:
        raise UnauthorizedException("Missing authentication token")

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise UnauthorizedException("Invalid token type")

        user_id = UUID(payload.get("sub"))
        user = await user_repo.get(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or deactivated")

        return user
    except ValueError as e:
        raise UnauthorizedException(str(e))


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise UnauthorizedException("Inactive user")
    return current_user


def require_roles(*allowed_roles: str):
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role.value not in allowed_roles and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker


require_admin = require_roles("admin")
require_manager = require_roles("admin", "manager")
require_sales = require_roles("admin", "manager", "sales_rep")


class PaginationParams:
    def __init__(
        self,
        page: int = 1,
        size: int = 20,
    ):
        self.page = max(1, page)
        self.size = min(max(1, size), 100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size

    @property
    def limit(self) -> int:
        return self.size


def get_pagination_params(
    page: int = 1,
    size: int = 20,
) -> PaginationParams:
    return PaginationParams(page=page, size=size)