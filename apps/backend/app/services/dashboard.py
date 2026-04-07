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
from database.schema.models import AIAdvice, AdviceType, Goal, Transaction, User


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

    total_spent = sum((_decimal(item.amount) for item in transactions), Decimal("0.00"))
    current_month = datetime.utcnow().month
    current_year = datetime.utcnow().year
    monthly_spent = sum(
        (
            _decimal(item.amount)
            for item in transactions
            if item.transaction_date.month == current_month and item.transaction_date.year == current_year
        ),
        Decimal("0.00"),
    )

    recent_transactions = [TransactionRead.model_validate(item) for item in transactions[:6]]

    trend_source = [item for item in transactions if item.transaction_date >= datetime.utcnow() - timedelta(days=6)]
    daily_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for item in trend_source:
        key = item.transaction_date.strftime("%Y-%m-%d")
        daily_totals[key] += _decimal(item.amount)

    trend = []
    for offset in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=offset)
        key = day.strftime("%Y-%m-%d")
        trend.append(TrendPoint(date=day.strftime("%b %d"), total=daily_totals[key]))

    category_map: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for item in transactions:
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
        f"User {user.full_name}. Total spent {total_spent}. Monthly spent {monthly_spent}. "
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
        total_spent=total_spent,
        monthly_spent=monthly_spent,
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
