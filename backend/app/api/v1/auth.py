from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Form, Header, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.deps import get_current_user, get_user_repo, get_session_repo
from app.core.exceptions import UnauthorizedException
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.user_session_repository import UserSessionRepository
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter()
security = HTTPBearer(auto_error=False)


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repo),
    session_repo: UserSessionRepository = Depends(get_session_repo),
) -> AuthService:
    return AuthService(user_repo, session_repo)


async def get_token_from_header(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
) -> str:
    if credentials:
        return credentials.credentials
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    raise UnauthorizedException("Missing authentication token")


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(
    request: Request,
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    return await auth_service.login(login_data, user_agent, ip_address)


@router.post("/login/form", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login_form(
    request: Request,
    username: str = Form(..., description="User email"),
    password: str = Form(..., description="Password"),
    remember_me: bool = Form(default=False, description="Extend token expiry"),
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """OAuth2 compatible form login endpoint."""
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    login_data = LoginRequest(email=username, password=password, remember_me=remember_me)
    return await auth_service.login(login_data, user_agent, ip_address)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    register_data: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    return await auth_service.register(register_data, user_agent, ip_address)


@router.post("/refresh", response_model=RefreshTokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> RefreshTokenResponse:
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    return await auth_service.refresh_token(refresh_data, user_agent, ip_address)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    logout_data: LogoutRequest,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> None:
    await auth_service.logout(refresh_token=logout_data.refresh_token, user_id=current_user.id)


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)