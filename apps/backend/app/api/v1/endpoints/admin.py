from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from apps.backend.app.api.deps import get_admin_user
from apps.backend.app.db.session import get_db
from apps.backend.app.schemas.admin import AdminOverview
from apps.backend.app.services.admin import build_admin_export_workbook, build_admin_overview
from database.schema.models import User

router = APIRouter()


@router.get("/overview", response_model=AdminOverview)
def get_admin_overview(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> AdminOverview:
    return build_admin_overview(db)


@router.get("/export.xlsx")
def export_admin_excel(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> StreamingResponse:
    workbook_bytes = build_admin_export_workbook(db)
    filename = f"aura-admin-export-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.xlsx"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(
        iter([workbook_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )
