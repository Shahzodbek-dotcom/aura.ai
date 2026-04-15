from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from database.schema.models import TransactionType


class ExpenseParseRequest(BaseModel):
    message: str = Field(min_length=3, max_length=1000)


class TransactionCreate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    category: str = Field(min_length=2, max_length=80)
    transaction_type: TransactionType = TransactionType.EXPENSE
    amount: Decimal = Field(gt=0)
    transaction_date: datetime | None = None
    notes: str | None = None


class TransactionUpdate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    category: str = Field(min_length=2, max_length=80)
    transaction_type: TransactionType
    amount: Decimal = Field(gt=0)
    transaction_date: datetime | None = None
    notes: str | None = None


class TransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: str
    transaction_type: TransactionType
    amount: Decimal
    transaction_date: datetime
    notes: str | None
    created_at: datetime


class ExpenseParseResponse(BaseModel):
    transactions: list[TransactionRead]
    parser: str
