"""add transaction type

Revision ID: 20260408_000002
Revises: 20260407_000001
Create Date: 2026-04-08 10:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260408_000002"
down_revision = "20260407_000001"
branch_labels = None
depends_on = None


transaction_type = sa.Enum("EXPENSE", "INCOME", name="transactiontype")


def upgrade() -> None:
    transaction_type.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "transactions",
        sa.Column("transaction_type", transaction_type, nullable=False, server_default="EXPENSE"),
    )
    op.create_index(
        op.f("ix_transactions_transaction_type"), "transactions", ["transaction_type"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_transactions_transaction_type"), table_name="transactions")
    op.drop_column("transactions", "transaction_type")
    transaction_type.drop(op.get_bind(), checkfirst=True)
