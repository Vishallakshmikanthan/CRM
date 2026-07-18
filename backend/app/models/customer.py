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
    from app.models.customer_note import CustomerNote
    from app.models.customer_timeline import CustomerTimeline


class CustomerStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PROSPECT = "prospect"
    CHURNED = "churned"


class Customer(BaseModel):
    __tablename__ = "customers"

    company_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    contact_person: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
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
    address: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    city: Mapped[str] = mapped_column(
        String(100),
        nullable=True,
    )
    country: Mapped[str] = mapped_column(
        String(100),
        nullable=True,
    )
    industry: Mapped[str] = mapped_column(
        String(100),
        nullable=True,
    )
    annual_revenue: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    employee_count: Mapped[int] = mapped_column(
        nullable=True,
    )
    status: Mapped[CustomerStatus] = mapped_column(
        Enum(CustomerStatus),
        default=CustomerStatus.PROSPECT,
        nullable=False,
        index=True,
    )
    source: Mapped[str] = mapped_column(
        String(100),
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
        back_populates="assigned_customers",
        foreign_keys=[assigned_to],
    )
    contacts: Mapped[list["CustomerContact"]] = relationship(
        "CustomerContact",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    notes: Mapped[list["CustomerNote"]] = relationship(
        "CustomerNote",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    timeline: Mapped[list["CustomerTimeline"]] = relationship(
        "CustomerTimeline",
        back_populates="customer",
        cascade="all, delete-orphan",
    )


class CustomerContact(BaseModel):
    __tablename__ = "customer_contacts"

    customer_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
    )
    phone: Mapped[str] = mapped_column(
        String(50),
        nullable=True,
    )
    role: Mapped[str] = mapped_column(
        String(100),
        nullable=True,
    )
    is_primary: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    # Relationships
    customer: Mapped["Customer"] = relationship(
        "Customer",
        back_populates="contacts",
    )