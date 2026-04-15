from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from apps.backend.app.schemas.dashboard import (
    CategorySpend,
    DashboardSummary,
    GoalProgress,
    InsightRead,
    TrendPoint,
)
from apps.backend.app.schemas.transaction import TransactionRead
from apps.backend.app.services.ai import generate_insight_with_ai
from database.schema.models import AIAdvice, AdviceType, Goal, Transaction, TransactionType, User


def _decimal(value: Decimal | int | float | None) -> Decimal:
    if isinstance(value, Decimal):
        return value
    if value is None:
        return Decimal("0.00")
    return Decimal(str(value)).quantize(Decimal("0.01"))


def build_dashboard_summary(db: Session, user: User) -> DashboardSummary:
    transactions = list(
        db.scalars(
            select(Transaction)
            .where(Transaction.user_id == user.id)
            .order_by(desc(Transaction.transaction_date), desc(Transaction.id))
        )
    )
    goals = list(db.scalars(select(Goal).where(Goal.user_id == user.id).order_by(desc(Goal.created_at))))

    expense_transactions = [
        item for item in transactions if item.transaction_type == TransactionType.EXPENSE
    ]
    income_transactions = [
        item for item in transactions if item.transaction_type == TransactionType.INCOME
    ]

    total_income = sum((_decimal(item.amount) for item in income_transactions), Decimal("0.00"))
    total_expense = sum((_decimal(item.amount) for item in expense_transactions), Decimal("0.00"))
    net_balance = total_income - total_expense
    current_month = datetime.utcnow().month
    current_year = datetime.utcnow().year
    monthly_income = sum(
        (
            _decimal(item.amount)
            for item in income_transactions
            if item.transaction_date.month == current_month and item.transaction_date.year == current_year
        ),
        Decimal("0.00"),
    )
    monthly_expense = sum(
        (
            _decimal(item.amount)
            for item in expense_transactions
            if item.transaction_date.month == current_month and item.transaction_date.year == current_year
        ),
        Decimal("0.00"),
    )

    recent_transactions = [TransactionRead.model_validate(item) for item in transactions[:6]]

    trend_source = [item for item in transactions if item.transaction_date >= datetime.utcnow() - timedelta(days=6)]
    daily_income: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    daily_expense: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for item in trend_source:
        key = item.transaction_date.strftime("%Y-%m-%d")
        if item.transaction_type == TransactionType.INCOME:
            daily_income[key] += _decimal(item.amount)
        else:
            daily_expense[key] += _decimal(item.amount)

    trend = []
    for offset in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=offset)
        key = day.strftime("%Y-%m-%d")
        income_total = daily_income[key]
        expense_total = daily_expense[key]
        trend.append(
            TrendPoint(
                date=day.strftime("%b %d"),
                income=income_total,
                expense=expense_total,
                balance=income_total - expense_total,
            )
        )

    category_map: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for item in expense_transactions:
        category_map[item.category] += _decimal(item.amount)
    category_breakdown = [
        CategorySpend(category=category, total=total)
        for category, total in sorted(category_map.items(), key=lambda pair: pair[1], reverse=True)[:6]
    ]

    goal_progress = []
    for goal in goals:
        target = _decimal(goal.target_amount)
        current = _decimal(goal.current_amount)
        remaining = max(target - current, Decimal("0.00"))
        percentage = float((current / target) * 100) if target > 0 else 0.0
        goal_progress.append(
            GoalProgress(
                id=goal.id,
                title=goal.title,
                target_amount=target,
                current_amount=current,
                remaining_amount=remaining,
                progress_percentage=min(percentage, 100.0),
            )
        )

    summary_text = (
        f"User {user.full_name}. Total income {total_income}. Total spent {total_expense}. "
        f"Net balance {net_balance}. Monthly income {monthly_income}. Monthly spent {monthly_expense}. "
        f"Top categories: {', '.join(item.category for item in category_breakdown) or 'none'}. "
        f"Goals: {', '.join(goal.title for goal in goals) or 'none'}."
    )
    title, content, advice_type = generate_insight_with_ai(summary_text)
    advice = AIAdvice(
        user_id=user.id,
        title=title,
        content=content,
        advice_type=AdviceType(advice_type) if advice_type in AdviceType._value2member_map_ else AdviceType.PLANNING,
    )
    db.add(advice)
    db.commit()
    db.refresh(advice)

    return DashboardSummary(
        total_income=total_income,
        total_expense=total_expense,
        net_balance=net_balance,
        monthly_income=monthly_income,
        monthly_expense=monthly_expense,
        recent_transactions=recent_transactions,
        spending_trend=trend,
        category_breakdown=category_breakdown,
        goals=goal_progress,
        latest_insight=InsightRead(
            id=advice.id,
            title=advice.title,
            content=advice.content,
            advice_type=advice.advice_type.value,
            created_at=advice.created_at,
        ),
    )
