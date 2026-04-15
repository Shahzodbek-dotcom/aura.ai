from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from apps.backend.app.core.config import get_settings
from apps.backend.app.core.security import create_access_token
from apps.backend.app.api.deps import get_current_user
from apps.backend.app.db.session import get_db
from apps.backend.app.schemas.auth import ApiError, LoginRequest, Token, UserCreate, UserRead
from apps.backend.app.services.auth import authenticate_user, create_user, get_user_by_email
from database.schema.models import User

router = APIRouter()
settings = get_settings()


def serialize_user(user: User) -> UserRead:
    return UserRead.model_validate(
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "is_active": user.is_active,
            "is_admin": user.email.lower() in settings.admin_emails,
            "created_at": user.created_at,
        }
    )


@router.post(
    "/signup",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ApiError}, 422: {"model": ApiError}},
)
def signup(payload: UserCreate, db: Session = Depends(get_db)) -> Token:
    existing_user = get_user_by_email(db, payload.email.lower())
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = create_user(db, payload)
    token = create_access_token(str(user.id))
    return Token(access_token=token, user=serialize_user(user))


@router.post(
    "/login",
    response_model=Token,
    responses={401: {"model": ApiError}, 422: {"model": ApiError}},
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(str(user.id))
    return Token(access_token=token, user=serialize_user(user))


@router.get("/me", response_model=UserRead, responses={401: {"model": ApiError}})
def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return serialize_user(current_user)
