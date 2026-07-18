from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID as PyUUID

from sqlalchemy import String, Enum, ForeignKey, Text, DateTime, UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class EmailDirection(str, enum.Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class EmailStatus(str, enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    FAILED = "failed"
    DRAFT = "draft"


class EmailActivity(BaseModel):
    __tablename__ = "email_activities"

    subject: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    body: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    direction: Mapped[EmailDirection] = mapped_column(
        Enum(EmailDirection),
        nullable=False,
    )
    status: Mapped[EmailStatus] = mapped_column(
        Enum(EmailStatus),
        default=EmailStatus.DRAFT,
        nullable=False,
    )
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    from_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    to_emails: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )
    cc_emails: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=True,
    )
    bcc_emails: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=True,
    )
    related_type: Mapped[str] = mapped_column(
        String(50),
        nullable=True,
    )
    related_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    email_metadata: Mapped[dict] = mapped_column(
        JSON,
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="email_activities",
        foreign_keys=[user_id],
    )
