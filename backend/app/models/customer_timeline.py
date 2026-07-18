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
    from app.models.customer import Customer


class TimelineActivityType(str, enum.Enum):
    NOTE_ADDED = "note_added"
    CONTACT_ADDED = "contact_added"
    CONTACT_UPDATED = "contact_updated"
    STATUS_CHANGED = "status_changed"
    ASSIGNED = "assigned"
    EMAIL_SENT = "email_sent"
    EMAIL_RECEIVED = "email_received"
    TASK_CREATED = "task_created"
    TASK_COMPLETED = "task_completed"
    OPPORTUNITY_CREATED = "opportunity_created"
    OPPORTUNITY_UPDATED = "opportunity_updated"
    CUSTOM = "custom"


class CustomerTimeline(BaseModel):
    __tablename__ = "customer_timeline"

    customer_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    activity_type: Mapped[TimelineActivityType] = mapped_column(
        Enum(TimelineActivityType),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    activity_metadata: Mapped[dict] = mapped_column(
        JSON,
        nullable=True,
    )

    # Relationships
    customer: Mapped["Customer"] = relationship(
        "Customer",
        back_populates="timeline",
    )
    user: Mapped["User"] = relationship(
        "User",
        back_populates="customer_timeline",
        foreign_keys=[user_id],
    )