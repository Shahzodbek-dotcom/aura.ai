from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from apps.backend.app.schemas.goal import GoalRead
from apps.backend.app.schemas.transaction import TransactionRead


class DashboardMetric(BaseModel):
    label: str
    value: Decimal


class CategorySpend(BaseModel):
    category: str
    total: Decimal


class TrendPoint(BaseModel):
    date: str
    income: Decimal
    expense: Decimal
    balance: Decimal


class InsightRead(BaseModel):
    id: int | None = None
    title: str
    content: str
    advice_type: str
    created_at: datetime | None = None


class GoalProgress(BaseModel):
    id: int
    title: str
    target_amount: Decimal
    current_amount: Decimal
    remaining_amount: Decimal
    progress_percentage: float


class DashboardSummary(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    net_balance: Decimal
    monthly_income: Decimal
    monthly_expense: Decimal
    recent_transactions: list[TransactionRead]
    spending_trend: list[TrendPoint]
    category_breakdown: list[CategorySpend]
    goals: list[GoalProgress]
    latest_insight: InsightRead
