from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from apps.backend.app.core.config import get_settings
from apps.backend.app.core.security import get_password_hash
from database.schema.base import Base
from database.schema.models import AIAdvice, AdviceType, Goal, GoalStatus, Transaction, User


def seed() -> None:
    settings = get_settings()
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == "demo@aura.ai"))
        if not user:
            user = User(
                full_name="Aura Demo User",
                email="demo@aura.ai",
                hashed_password=get_password_hash("DemoPass123"),
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        existing_transactions = db.scalar(select(Transaction).where(Transaction.user_id == user.id).limit(1))
        if not existing_transactions:
            now = datetime.utcnow()
            transactions = [
                Transaction(
                    user_id=user.id,
                    title="Morning coffee and croissant",
                    category="food",
                    amount=Decimal("28000.00"),
                    transaction_date=now - timedelta(days=6),
                    notes="Coffee near office",
                ),
                Transaction(
                    user_id=user.id,
                    title="Yandex taxi to meeting",
                    category="transport",
                    amount=Decimal("35000.00"),
                    transaction_date=now - timedelta(days=5),
                    notes="Rush hour ride",
                ),
                Transaction(
                    user_id=user.id,
                    title="Supermarket groceries",
                    category="shopping",
                    amount=Decimal("245000.00"),
                    transaction_date=now - timedelta(days=4),
                    notes="Weekly groceries",
                ),
                Transaction(
                    user_id=user.id,
                    title="Lunch with client",
                    category="food",
                    amount=Decimal("87000.00"),
                    transaction_date=now - timedelta(days=3),
                    notes="Business lunch",
                ),
                Transaction(
                    user_id=user.id,
                    title="Mobile internet package",
                    category="bills",
                    amount=Decimal("69000.00"),
                    transaction_date=now - timedelta(days=2),
                    notes="Monthly subscription",
                ),
                Transaction(
                    user_id=user.id,
                    title="Coffee beans and dessert",
                    category="food",
                    amount=Decimal("56000.00"),
                    transaction_date=now - timedelta(days=1),
                    notes="Weekend treat",
                ),
            ]
            db.add_all(transactions)

        existing_goal = db.scalar(select(Goal).where(Goal.user_id == user.id).limit(1))
        if not existing_goal:
            db.add_all(
                [
                    Goal(
                        user_id=user.id,
                        title="Mashina uchun 100 mln",
                        description="Yil oxirigacha avtomobil uchun jamg'arma",
                        target_amount=Decimal("100000000.00"),
                        current_amount=Decimal("23500000.00"),
                        deadline=datetime.utcnow() + timedelta(days=240),
                        status=GoalStatus.ACTIVE,
                    ),
                    Goal(
                        user_id=user.id,
                        title="Favqulodda fond",
                        description="6 oylik ehtiyot mablag'i",
                        target_amount=Decimal("25000000.00"),
                        current_amount=Decimal("9000000.00"),
                        deadline=datetime.utcnow() + timedelta(days=180),
                        status=GoalStatus.ACTIVE,
                    ),
                ]
            )

        existing_advice = db.scalar(select(AIAdvice).where(AIAdvice.user_id == user.id).limit(1))
        if not existing_advice:
            db.add(
                AIAdvice(
                    user_id=user.id,
                    advice_type=AdviceType.ALERT,
                    title="Coffee spending is trending up",
                    content="Bu hafta ichimlik va mayda ovqat xarajatlari oshgan. Shu temp pasaysa mashina maqsadingiz tezroq yopiladi.",
                    confidence_score=Decimal("0.82"),
                )
            )

        db.commit()
        print("Seed completed.")
        print("Demo login: demo@aura.ai")
        print("Demo password: DemoPass123")


if __name__ == "__main__":
    seed()
