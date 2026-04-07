from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from apps.backend.app.api.deps import get_current_user
from apps.backend.app.db.session import get_db
from apps.backend.app.schemas.dashboard import DashboardSummary
from apps.backend.app.services.dashboard import build_dashboard_summary
from database.schema.models import User

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    return build_dashboard_summary(db, current_user)
