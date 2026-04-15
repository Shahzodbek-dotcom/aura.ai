from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    is_admin: bool = False
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class ApiError(BaseModel):
    detail: str
