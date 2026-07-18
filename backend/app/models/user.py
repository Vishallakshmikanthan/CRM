from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID as PyUUID

from sqlalchemy import String, Enum, ForeignKey, Text, DateTime, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.lead import Lead
    from app.models.customer import Customer
    from app.models.opportunity import Opportunity
    from app.models.task import Task
    from app.models.email_activity import EmailActivity
    from app.models.customer_note import CustomerNote
    from app.models.customer_timeline import CustomerTimeline


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    SALES_REP = "sales_rep"


class User(BaseModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        default=UserRole.SALES_REP,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )
    is_superuser: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )
    avatar_url: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
    )
    phone: Mapped[str] = mapped_column(
        String(50),
        nullable=True,
    )
    timezone: Mapped[str] = mapped_column(
        String(50),
        default="UTC",
        nullable=False,
    )
    language: Mapped[str] = mapped_column(
        String(10),
        default="en",
        nullable=False,
    )
    last_login_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    sessions: Mapped[list["UserSession"]] = relationship(
        "UserSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    assigned_leads: Mapped[list["Lead"]] = relationship(
        "Lead",
        back_populates="assigned_to_user",
        foreign_keys="Lead.assigned_to",
    )
    assigned_customers: Mapped[list["Customer"]] = relationship(
        "Customer",
        back_populates="assigned_to_user",
        foreign_keys="Customer.assigned_to",
    )
    assigned_opportunities: Mapped[list["Opportunity"]] = relationship(
        "Opportunity",
        back_populates="assigned_to_user",
        foreign_keys="Opportunity.assigned_to",
    )
    assigned_tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="assigned_to_user",
        foreign_keys="Task.assigned_to",
    )
    created_tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="created_by_user",
        foreign_keys="Task.created_by",
    )
    email_activities: Mapped[list["EmailActivity"]] = relationship(
        "EmailActivity",
        back_populates="user",
        foreign_keys="EmailActivity.user_id",
    )
    customer_notes: Mapped[list["CustomerNote"]] = relationship(
        "CustomerNote",
        back_populates="user",
        foreign_keys="CustomerNote.user_id",
    )
    customer_timeline: Mapped[list["CustomerTimeline"]] = relationship(
        "CustomerTimeline",
        back_populates="user",
        foreign_keys="CustomerTimeline.user_id",
    )
