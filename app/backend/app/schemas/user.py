from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime


class UserRegisterRequest(BaseModel):
    """Esquema para registro de usuario."""

    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        """Validar que username solo contiene caracteres alfanuméricos, guiones y guiones bajos."""
        if not all(c.isalnum() or c in "-_" for c in v):
            raise ValueError(
                "Username solo puede contener letras, números, guiones y guiones bajos"
            )
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        """Validar contraseña: mínimo 8 caracteres, al menos 1 número y 1 mayúscula."""
        if len(v) < 8:
            raise ValueError("Contraseña debe tener al menos 8 caracteres")
        if not any(c.isupper() for c in v):
            raise ValueError("Contraseña debe contener al menos 1 mayúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("Contraseña debe contener al menos 1 número")
        return v


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


class RegistrationResponse(BaseModel):
    """Esquema de respuesta de registro."""

    user: UserResponse
    message: str = "Usuario registrado exitosamente"
