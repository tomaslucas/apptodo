from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.task import Task, TaskEvent
from datetime import datetime
from typing import Optional, List


class TaskRepository:
    """Repositorio para operaciones de tareas."""

    @staticmethod
    def create_task(
        db: Session,
        user_id: int,
        title: str,
        description: Optional[str] = None,
        priority: str = "media",
        deadline: Optional[str] = None,
        status: str = "pendiente",
        recurrence_rule: Optional[str] = None
    ) -> Task:
        """Crear nueva tarea."""
        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            priority=priority,
            deadline=deadline,
            status=status,
            recurrence_rule=recurrence_rule
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get_task_by_id(db: Session, task_id: int, user_id: int) -> Optional[Task]:
        """Obtener tarea por ID (solo si pertenece al usuario)."""
        return db.query(Task).filter(
            and_(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.is_(None))
        ).first()

    @staticmethod
    def get_tasks_by_user(
        db: Session,
        user_id: int,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        include_deleted: bool = False
    ) -> List[Task]:
        """Obtener todas las tareas del usuario."""
        query = db.query(Task).filter(Task.user_id == user_id)
        
        if not include_deleted:
            query = query.filter(Task.deleted_at.is_(None))
        
        if status:
            query = query.filter(Task.status == status)
        
        if priority:
            query = query.filter(Task.priority == priority)
        
        return query.all()

    @staticmethod
    def update_task(
        db: Session,
        task_id: int,
        user_id: int,
        **kwargs
    ) -> Optional[Task]:
        """Actualizar tarea (optimistic locking)."""
        task = db.query(Task).filter(
            and_(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.is_(None))
        ).first()
        
        if not task:
            return None
        
        # Verificar versión si se proporciona (optimistic locking)
        if "version" in kwargs:
            expected_version = kwargs.pop("version")
            if task.version != expected_version:
                raise ValueError("Version mismatch: task has been modified")
        
        # Actualizar campos
        for key, value in kwargs.items():
            if value is not None and hasattr(task, key):
                setattr(task, key, value)
        
        # Incrementar versión
        task.version += 1
        task.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def soft_delete_task(db: Session, task_id: int, user_id: int) -> Optional[Task]:
        """Soft delete de tarea."""
        task = db.query(Task).filter(
            and_(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.is_(None))
        ).first()
        
        if not task:
            return None
        
        task.deleted_at = datetime.utcnow()
        task.version += 1
        task.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def restore_task(db: Session, task_id: int, user_id: int) -> Optional[Task]:
        """Restaurar tarea eliminada."""
        task = db.query(Task).filter(
            and_(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.isnot(None))
        ).first()
        
        if not task:
            return None
        
        task.deleted_at = None
        task.version += 1
        task.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def complete_task(db: Session, task_id: int, user_id: int) -> Optional[Task]:
        """Marcar tarea como completada."""
        task = db.query(Task).filter(
            and_(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.is_(None))
        ).first()
        
        if not task:
            return None
        
        task.status = "completada"
        task.completed_at = datetime.utcnow()
        task.version += 1
        task.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(task)
        return task


class TaskEventRepository:
    """Repositorio para eventos de auditoría de tareas."""

    @staticmethod
    def create_event(
        db: Session,
        task_id: int,
        user_id: int,
        event_type: str,
        old_state: Optional[dict] = None,
        new_state: Optional[dict] = None,
        payload: Optional[dict] = None
    ) -> TaskEvent:
        """Crear evento de auditoría."""
        event = TaskEvent(
            task_id=task_id,
            user_id=user_id,
            event_type=event_type,
            old_state=old_state,
            new_state=new_state,
            payload=payload
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def get_task_events(db: Session, task_id: int) -> List[TaskEvent]:
        """Obtener todos los eventos de una tarea."""
        return db.query(TaskEvent).filter(TaskEvent.task_id == task_id).all()
