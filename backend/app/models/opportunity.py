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
    from app.models.customer import Customer
    from app.models.lead import Lead


class OpportunityStage(str, enum.Enum):
    PROSPECTING = "prospecting"
    QUALIFICATION = "qualification"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class Opportunity(BaseModel):
    __tablename__ = "opportunities"

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id"),
        nullable=False,
        index=True,
    )
    lead_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leads.id"),
        nullable=True,
        index=True,
    )
    stage: Mapped[OpportunityStage] = mapped_column(
        Enum(OpportunityStage),
        default=OpportunityStage.PROSPECTING,
        nullable=False,
        index=True,
    )
    value: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )
    probability: Mapped[int] = mapped_column(
        nullable=False,
        default=10,
    )
    expected_close_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    actual_close_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    assigned_to: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    notes: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationships
    customer: Mapped["Customer"] = relationship(
        "Customer",
        backref="opportunities",
    )
    lead: Mapped["Lead"] = relationship(
        "Lead",
        backref="opportunities",
    )
    assigned_to_user: Mapped["User"] = relationship(
        "User",
        back_populates="assigned_opportunities",
        foreign_keys=[assigned_to],
    )