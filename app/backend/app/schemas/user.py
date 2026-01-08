from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserRegisterRequest(BaseModel):
    """Esquema para registro de usuario."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLoginRequest(BaseModel):
    """Esquema para login de usuario."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Esquema de respuesta con datos del usuario."""
    id: int
    username: str
    email: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Esquema de respuesta de autenticación."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
