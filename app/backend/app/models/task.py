from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Text,
    ForeignKey,
    Index,
    JSON,
)
from datetime import datetime
from app.models.user import Base


class Task(Base):
    """Modelo de Tarea."""

    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String(255), nullable=False)
    description = Column(Text)
    priority = Column(String(20), default="media", nullable=False)  # baja, media, alta
    deadline = Column(Date)
    status = Column(
        String(20), default="pendiente", nullable=False
    )  # pendiente, en_progreso, completada
    recurrence_rule = Column(String(255))
    completed_at = Column(DateTime)
    deleted_at = Column(DateTime)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Índices
    __table_args__ = (
        Index("idx_tasks_user_id", "user_id"),
        Index("idx_tasks_status", "status"),
        Index("idx_tasks_priority", "priority"),
        Index("idx_tasks_deadline", "deadline"),
        Index("idx_tasks_deleted_at", "deleted_at"),
        Index("idx_tasks_user_status", "user_id", "status"),
        Index("idx_tasks_user_deadline", "user_id", "deadline"),
    )

    def __repr__(self):
        return f"<Task {self.id}: {self.title}>"


class Category(Base):
    """Modelo de Categoría."""

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(100), nullable=False)
    color = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Índices
    __table_args__ = (Index("idx_categories_user_id", "user_id"),)

    def __repr__(self):
        return f"<Category {self.name}>"


class TaskCategory(Base):
    """Modelo de relación Task-Category (M2M)."""

    __tablename__ = "task_categories"

    task_id = Column(
        Integer,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )

    def __repr__(self):
        return f"<TaskCategory task_id={self.task_id}, category_id={self.category_id}>"


class RefreshToken(Base):
    """Modelo de Refresh Token."""

    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Índices
    __table_args__ = (
        Index("idx_refresh_tokens_user_id", "user_id"),
        Index("idx_refresh_tokens_expires_at", "expires_at"),
    )

    def __repr__(self):
        return f"<RefreshToken user_id={self.user_id}>"


class TaskEvent(Base):
    """Modelo de Evento de Tarea (Auditoría)."""

    __tablename__ = "task_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    event_type = Column(String(50), nullable=False)
    old_state = Column(JSON)
    new_state = Column(JSON)
    payload = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Índices
    __table_args__ = (
        Index("idx_task_events_task_id", "task_id"),
        Index("idx_task_events_user_id", "user_id"),
        Index("idx_task_events_event_type", "event_type"),
        Index("idx_task_events_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<TaskEvent {self.event_type}>"


class IdempotencyKey(Base):
    """Modelo de Clave de Idempotencia."""

    __tablename__ = "idempotency_keys"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    idempotency_key = Column(String(255), unique=True, nullable=False)
    request_hash = Column(String(255))
    response_data = Column(JSON)
    status_code = Column(Integer)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Índices
    __table_args__ = (
        Index("idx_idempotency_keys_user_id", "user_id"),
        Index("idx_idempotency_keys_expires_at", "expires_at"),
    )

    def __repr__(self):
        return f"<IdempotencyKey {self.idempotency_key}>"
