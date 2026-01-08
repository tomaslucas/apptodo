from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class CategoryCreateRequest(BaseModel):
    """Esquema para crear nueva categoría."""
    name: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = Field(None, max_length=20)


class CategoryUpdateRequest(BaseModel):
    """Esquema para actualizar categoría."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, max_length=20)


class CategoryResponse(BaseModel):
    """Esquema de respuesta de categoría."""
    id: int
    user_id: int
    name: str
    color: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategoryListResponse(BaseModel):
    """Esquema de respuesta de lista de categorías."""
    categories: list[CategoryResponse]
