from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

from apps.backend.app.api.v1.router import api_router
from apps.backend.app.core.config import get_settings
from apps.backend.app.core.exceptions import (
    database_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from apps.backend.app.db.session import engine
from database.schema.base import Base

settings = get_settings()


def sync_transaction_schema() -> None:
    inspector = inspect(engine)
    if "transactions" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("transactions")}
    if "transaction_type" in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE transactions ADD COLUMN transaction_type VARCHAR(20)"))
        connection.execute(
            text("UPDATE transactions SET transaction_type = 'EXPENSE' WHERE transaction_type IS NULL")
        )
        connection.execute(
            text("ALTER TABLE transactions ALTER COLUMN transaction_type SET DEFAULT 'EXPENSE'")
        )
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_transactions_transaction_type ON transactions (transaction_type)"))


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    sync_transaction_schema()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.api_v1_prefix)
