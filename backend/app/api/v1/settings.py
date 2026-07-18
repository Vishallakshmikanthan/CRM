from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.models.company_settings import CompanySettings
from app.schemas.settings import CompanySettingsResponse, CompanySettingsUpdate

router = APIRouter()


@router.get("/company", response_model=CompanySettingsResponse)
async def get_company_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get company settings"""
    result = await db.execute(select(CompanySettings).limit(1))
    settings = result.scalar_one_or_none()
    
    if not settings:
        # Create default settings if none exist
        settings = CompanySettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    
    return settings


@router.patch("/company", response_model=CompanySettingsResponse)
async def update_company_settings(
    settings_update: CompanySettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update company settings"""
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update company settings"
        )
    
    result = await db.execute(select(CompanySettings).limit(1))
    settings = result.scalar_one_or_none()
    
    if not settings:
        settings = CompanySettings()
        db.add(settings)
    
    # Update fields
    update_data = settings_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    await db.commit()
    await db.refresh(settings)
    
    return settings