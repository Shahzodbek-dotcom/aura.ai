from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class GoalCreate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    target_amount: Decimal = Field(gt=0)
    current_amount: Decimal = Field(default=0, ge=0)
    deadline: datetime | None = None


class GoalContribution(BaseModel):
    amount: Decimal = Field(gt=0)


class GoalUpdate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    target_amount: Decimal = Field(gt=0)
    current_amount: Decimal = Field(ge=0)
    deadline: datetime | None = None


class GoalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    target_amount: Decimal
    current_amount: Decimal
    deadline: datetime | None
    status: str
    created_at: datetime
