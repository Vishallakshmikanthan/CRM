from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from app.core.config import get_settings
from app.core.exceptions import (
    ConflictException,
    UnauthorizedException,
    ValidationException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User, UserRole
from app.models.user_session import UserSession
from app.repositories.user_repository import UserRepository
from app.repositories.user_session_repository import UserSessionRepository
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserResponse,
)

settings = get_settings()


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        session_repo: UserSessionRepository,
    ):
        self.user_repo = user_repo
        self.session_repo = session_repo

    async def login(
        self,
        login_data: LoginRequest,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> TokenResponse:
        user = await self.user_repo.get_by_email_case_insensitive(login_data.email)
        if not user:
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        if not verify_password(login_data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")

        return await self._create_token_response(user, login_data.remember_me, user_agent, ip_address)

    async def register(
        self,
        register_data: RegisterRequest,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> TokenResponse:
        existing_user = await self.user_repo.get_by_email_case_insensitive(register_data.email)
        if existing_user:
            raise ConflictException("Email already registered")

        hashed_password = get_password_hash(register_data.password)

        user = await self.user_repo.create(
            email=register_data.email,
            hashed_password=hashed_password,
            full_name=register_data.full_name,
            role=UserRole.SALES_REP,
            phone=register_data.phone,
        )

        return await self._create_token_response(user, False, user_agent, ip_address)

    async def refresh_token(
        self,
        refresh_data: RefreshTokenRequest,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> RefreshTokenResponse:
        session = await self.session_repo.get_by_refresh_token(refresh_data.refresh_token)
        if not session:
            raise UnauthorizedException("Invalid or expired refresh token")

        user = await self.user_repo.get_by_id(session.user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or deactivated")

        # Revoke old refresh token
        session.revoked_at = datetime.now(timezone.utc)

        # Create new tokens
        access_token = create_access_token(subject=str(user.id), extra_claims={"role": user.role.value})
        new_refresh_token = create_refresh_token(subject=str(user.id))

        # Create new session
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.session_repo.create(
            user_id=user.id,
            refresh_token=new_refresh_token,
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expires_at,
        )

        return RefreshTokenResponse(
            access_token=access_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def logout(self, refresh_token: Optional[str] = None, user_id: Optional[UUID] = None) -> None:
        if refresh_token:
            session = await self.session_repo.get_by_refresh_token(refresh_token)
            if session:
                await self.session_repo.revoke_session(session.id)
        elif user_id:
            await self.session_repo.revoke_all_user_sessions(user_id)

    async def change_password(
        self,
        user_id: UUID,
        current_password: str,
        new_password: str,
    ) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValidationException("User not found")

        if not verify_password(current_password, user.hashed_password):
            raise UnauthorizedException("Current password is incorrect")

        user.hashed_password = get_password_hash(new_password)
        await self.user_repo.session.flush()

        # Revoke all sessions to force re-login
        await self.session_repo.revoke_all_user_sessions(user_id)

    async def get_current_user(self, token: str) -> User:
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                raise UnauthorizedException("Invalid token type")

            user_id = UUID(payload.get("sub"))
            user = await self.user_repo.get_by_id(user_id)
            if not user or not user.is_active:
                raise UnauthorizedException("User not found or deactivated")

            return user
        except ValueError as e:
            raise UnauthorizedException(str(e))

    async def _create_token_response(
        self,
        user: User,
        remember_me: bool,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> TokenResponse:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        if remember_me:
            access_token_expires = timedelta(hours=24)

        access_token = create_access_token(
            subject=str(user.id),
            expires_delta=access_token_expires,
            extra_claims={"role": user.role.value, "is_superuser": user.is_superuser},
        )

        refresh_token = create_refresh_token(subject=str(user.id))

        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.session_repo.create(
            user_id=user.id,
            refresh_token=refresh_token,
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expires_at,
        )

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        await self.user_repo.session.flush()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=int(access_token_expires.total_seconds()),
            user=UserResponse.model_validate(user),
        )