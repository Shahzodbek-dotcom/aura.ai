from datetime import datetime

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from fastapi import HTTPException, status

from apps.backend.app.schemas.transaction import TransactionCreate, TransactionUpdate
from database.schema.models import Transaction, User


def create_transaction(db: Session, user: User, payload: TransactionCreate) -> Transaction:
    transaction = Transaction(
        user_id=user.id,
        title=payload.title,
        category=payload.category,
        transaction_type=payload.transaction_type,
        amount=payload.amount,
        transaction_date=payload.transaction_date or datetime.utcnow(),
        notes=payload.notes,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def create_transactions(db: Session, user: User, payloads: list[TransactionCreate]) -> list[Transaction]:
    transactions = [
        Transaction(
            user_id=user.id,
            title=payload.title,
            category=payload.category,
            transaction_type=payload.transaction_type,
            amount=payload.amount,
            transaction_date=payload.transaction_date or datetime.utcnow(),
            notes=payload.notes,
        )
        for payload in payloads
    ]
    db.add_all(transactions)
    db.commit()
    for transaction in transactions:
        db.refresh(transaction)
    return transactions


def list_recent_transactions(db: Session, user_id: int, limit: int = 8) -> list[Transaction]:
    stmt = (
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(desc(Transaction.transaction_date), desc(Transaction.id))
        .limit(limit)
    )
    return list(db.scalars(stmt))


def get_transaction_for_user(db: Session, user_id: int, transaction_id: int) -> Transaction:
    transaction = db.scalar(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user_id)
    )
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction topilmadi")
    return transaction


def update_transaction(
    db: Session, user: User, transaction_id: int, payload: TransactionUpdate
) -> Transaction:
    transaction = get_transaction_for_user(db, user.id, transaction_id)
    transaction.title = payload.title
    transaction.category = payload.category
    transaction.transaction_type = payload.transaction_type
    transaction.amount = payload.amount
    transaction.transaction_date = payload.transaction_date or transaction.transaction_date
    transaction.notes = payload.notes
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, user: User, transaction_id: int) -> None:
    transaction = get_transaction_for_user(db, user.id, transaction_id)
    db.delete(transaction)
    db.commit()
