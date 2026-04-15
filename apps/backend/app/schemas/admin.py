from datetime import datetime

from pydantic import BaseModel


class AdminUserRow(BaseModel):
    id: int
    full_name: str
    email: str
    is_active: bool
    created_at: datetime
    transaction_count: int
    total_spent: float
    total_income: float
    goal_count: int
    total_goal_target: float


class AdminOverview(BaseModel):
    total_users: int
    total_transactions: int
    total_goals: int
    total_spent: float
    total_income: float
    users: list[AdminUserRow]
