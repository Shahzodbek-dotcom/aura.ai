from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.schema.base import Base


class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"


class AdviceType(str, Enum):
    SAVING = "saving"
    BUDGETING = "budgeting"
    PLANNING = "planning"
    ALERT = "alert"


class TransactionType(str, Enum):
    EXPENSE = "expense"
    INCOME = "income"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    ai_advices: Mapped[list["AIAdvice"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    transaction_type: Mapped[TransactionType] = mapped_column(
        SqlEnum(TransactionType), default=TransactionType.EXPENSE, nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    transaction_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="transactions")


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    target_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    current_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    deadline: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[GoalStatus] = mapped_column(SqlEnum(GoalStatus), default=GoalStatus.ACTIVE, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="goals")


class AIAdvice(Base):
    __tablename__ = "ai_advices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    advice_type: Mapped[AdviceType] = mapped_column(SqlEnum(AdviceType), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(4, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="ai_advices")
