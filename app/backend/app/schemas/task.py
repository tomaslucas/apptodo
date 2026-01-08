from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional
from enum import Enum


class PriorityEnum(str, Enum):
    """Enumeración de prioridades."""
    baja = "baja"
    media = "media"
    alta = "alta"


class StatusEnum(str, Enum):
    """Enumeración de estados de tarea."""
    pendiente = "pendiente"
    en_progreso = "en_progreso"
    completada = "completada"


class TaskCreateRequest(BaseModel):
    """Esquema para crear nueva tarea."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    priority: Optional[PriorityEnum] = PriorityEnum.media
    deadline: Optional[date] = None
    status: Optional[StatusEnum] = StatusEnum.pendiente
    recurrence_rule: Optional[str] = None


class TaskUpdateRequest(BaseModel):
    """Esquema para actualizar tarea."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    priority: Optional[PriorityEnum] = None
    deadline: Optional[date] = None
    status: Optional[StatusEnum] = None
    recurrence_rule: Optional[str] = None
    version: int  # Para optimistic locking


class TaskResponse(BaseModel):
    """Esquema de respuesta de tarea."""
    id: int
    user_id: int
    title: str
    description: Optional[str]
    priority: str
    deadline: Optional[date]
    status: str
    recurrence_rule: Optional[str]
    completed_at: Optional[datetime]
    deleted_at: Optional[datetime]
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Esquema de respuesta de lista de tareas."""
    tasks: list[TaskResponse]
    pagination: Optional[dict] = None


class TaskDetailResponse(BaseModel):
    """Esquema de respuesta detallada de tarea."""
    task: TaskResponse
    events: Optional[list] = None


class TaskCategoryRequest(BaseModel):
    """Esquema para agregar/remover categoría a/de tarea."""
    category_id: int = Field(..., gt=0, description="ID de la categoría")
