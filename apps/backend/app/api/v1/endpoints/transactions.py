from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from apps.backend.app.api.deps import get_current_user
from apps.backend.app.db.session import get_db
from apps.backend.app.schemas.transaction import (
    ExpenseParseRequest,
    ExpenseParseResponse,
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
)
from apps.backend.app.services.ai import parse_expense_with_ai
from apps.backend.app.services.transactions import (
    create_transaction,
    create_transactions,
    delete_transaction,
    update_transaction,
)
from database.schema.models import User

router = APIRouter()


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction_endpoint(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    transaction = create_transaction(db, current_user, payload)
    return TransactionRead.model_validate(transaction)


@router.post("/parse-expense", response_model=ExpenseParseResponse, status_code=status.HTTP_201_CREATED)
def parse_expense(
    payload: ExpenseParseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseParseResponse:
    parsed_items = parse_expense_with_ai(payload.message)
    transaction_payloads = [TransactionCreate.model_validate(item) for item in parsed_items]
    transactions = create_transactions(db, current_user, transaction_payloads)
    parser_name = parsed_items[0].get("parser", "heuristic") if parsed_items else "heuristic"
    return ExpenseParseResponse(transactions=transactions, parser=parser_name)


@router.put("/{transaction_id}", response_model=TransactionRead)
def update_transaction_endpoint(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    transaction = update_transaction(db, current_user, transaction_id, payload)
    return TransactionRead.model_validate(transaction)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction_endpoint(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    delete_transaction(db, current_user, transaction_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
