from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import all models to register them with SQLAlchemy
from app.models import (
    user,
    user_session,
    lead,
    customer,
    customer_note,
    customer_timeline,
    opportunity,
    task,
    email_activity,
    company_settings,
)

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.database import close_db, init_db
from app.core.exceptions import register_exception_handlers

app_settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title=app_settings.PROJECT_NAME,
    description="CRM System API",
    version="1.0.0",
    openapi_url=f"{app_settings.API_V1_STR}/openapi.json",
    docs_url=f"{app_settings.API_V1_STR}/docs",
    redoc_url=f"{app_settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin).rstrip("/") for origin in app_settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
register_exception_handlers(app)

# API Routes
app.include_router(api_router, prefix=app_settings.API_V1_STR)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy", "service": app_settings.PROJECT_NAME}


@app.get("/", tags=["root"])
async def root():
    return {
        "message": f"Welcome to {app_settings.PROJECT_NAME}",
        "version": "1.0.0",
        "docs": f"{app_settings.API_V1_STR}/docs",
    }
