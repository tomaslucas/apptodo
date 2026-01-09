from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime


class APIResponse(BaseModel):
    """Esquema estándar de respuesta de la API."""

    status: str  # "success" | "error"
    data: Optional[Any] = None
    error: Optional[str] = None
    timestamp: datetime = datetime.utcnow()

    class Config:
        from_attributes = True
