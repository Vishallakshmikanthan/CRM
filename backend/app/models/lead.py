from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID as PyUUID

from sqlalchemy import String, Enum, ForeignKey, Text, DateTime, UUID, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    CONVERTED = "converted"


class LeadSource(str, enum.Enum):
    WEBSITE = "website"
    REFERRAL = "referral"
    COLD_CALL = "cold_call"
    EMAIL = "email"
    SOCIAL_MEDIA = "social_media"
    EVENT = "event"
    OTHER = "other"


class Lead(BaseModel):
    __tablename__ = "leads"

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    phone: Mapped[str] = mapped_column(
        String(50),
        nullable=True,
    )
    company: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
    )
    source: Mapped[LeadSource] = mapped_column(
        Enum(LeadSource),
        default=LeadSource.OTHER,
        nullable=False,
    )
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus),
        default=LeadStatus.NEW,
        nullable=False,
        index=True,
    )
    estimated_value: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    notes: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    assigned_to: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    # Relationships
    assigned_to_user: Mapped["User"] = relationship(
        "User",
        back_populates="assigned_leads",
        foreign_keys=[assigned_to],
    )