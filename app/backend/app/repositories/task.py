from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.models.task import Task, TaskEvent, TaskCategory, Category
from datetime import datetime, date
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
        category_id: Optional[int] = None,
        category_ids: Optional[List[int]] = None,
        deadline_from: Optional[str] = None,
        deadline_to: Optional[str] = None,
        search: Optional[str] = None,
        completed: Optional[bool] = None,
        include_deleted: bool = False,
        limit: int = 1000,
        offset: int = 0
    ) -> List[Task]:
        """Obtener todas las tareas del usuario con filtros avanzados."""
        query = db.query(Task).filter(Task.user_id == user_id)
        
        if not include_deleted:
            query = query.filter(Task.deleted_at.is_(None))
        
        # Filtro por estatus
        if status:
            query = query.filter(Task.status == status)
        
        # Filtro por prioridad
        if priority:
            query = query.filter(Task.priority == priority)
        
        # Filtro por categoría (single)
        if category_id:
            query = query.join(TaskCategory).join(Category).filter(
                TaskCategory.category_id == category_id,
                Category.user_id == user_id
            )
        
        # Filtro por múltiples categorías (AND)
        if category_ids:
            for cat_id in category_ids:
                query = query.join(TaskCategory, TaskCategory.task_id == Task.id).filter(
                    TaskCategory.category_id == cat_id
                )
        
        # Filtro por rango de fecha de vencimiento
        if deadline_from:
            query = query.filter(Task.deadline >= deadline_from)
        
        if deadline_to:
            query = query.filter(Task.deadline <= deadline_to)
        
        # Búsqueda por texto (título o descripción)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Task.title.ilike(search_term),
                    Task.description.ilike(search_term)
                )
            )
        
        # Filtro por completado
        if completed is not None:
            if completed:
                query = query.filter(Task.status == "completada")
            else:
                query = query.filter(Task.status != "completada")
        
        # Aplicar límite y offset
        return query.limit(limit).offset(offset).all()

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


    @staticmethod
    def batch_complete_tasks(db: Session, task_ids: List[int], user_id: int) -> int:
        """Marcar múltiples tareas como completadas."""
        updated = db.query(Task).filter(
            and_(
                Task.id.in_(task_ids),
                Task.user_id == user_id,
                Task.deleted_at.is_(None)
            )
        ).update(
            {
                Task.status: "completada",
                Task.completed_at: datetime.utcnow(),
                Task.version: Task.version + 1,
                Task.updated_at: datetime.utcnow()
            },
            synchronize_session=False
        )
        db.commit()
        return updated

    @staticmethod
    def batch_delete_tasks(db: Session, task_ids: List[int], user_id: int) -> int:
        """Soft delete de múltiples tareas."""
        updated = db.query(Task).filter(
            and_(
                Task.id.in_(task_ids),
                Task.user_id == user_id,
                Task.deleted_at.is_(None)
            )
        ).update(
            {
                Task.deleted_at: datetime.utcnow(),
                Task.version: Task.version + 1,
                Task.updated_at: datetime.utcnow()
            },
            synchronize_session=False
        )
        db.commit()
        return updated

    @staticmethod
    def batch_restore_tasks(db: Session, task_ids: List[int], user_id: int) -> int:
        """Restaurar múltiples tareas eliminadas."""
        updated = db.query(Task).filter(
            and_(
                Task.id.in_(task_ids),
                Task.user_id == user_id,
                Task.deleted_at.isnot(None)
            )
        ).update(
            {
                Task.deleted_at: None,
                Task.version: Task.version + 1,
                Task.updated_at: datetime.utcnow()
            },
            synchronize_session=False
        )
        db.commit()
        return updated

    @staticmethod
    def batch_update_tasks(
        db: Session,
        task_ids: List[int],
        user_id: int,
        **update_fields
    ) -> int:
        """Actualizar múltiples tareas."""
        update_data = {}
        for key, value in update_fields.items():
            if value is not None and hasattr(Task, key):
                update_data[key] = value
        
        if not update_data:
            return 0
        
        # Agregar timestamp de actualización
        update_data[Task.version] = Task.version + 1
        update_data[Task.updated_at] = datetime.utcnow()
        
        updated = db.query(Task).filter(
            and_(
                Task.id.in_(task_ids),
                Task.user_id == user_id,
                Task.deleted_at.is_(None)
            )
        ).update(update_data, synchronize_session=False)
        db.commit()
        return updated


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

    @staticmethod
    def get_task_events_paginated(
        db: Session,
        task_id: int,
        limit: int = 100,
        offset: int = 0
    ) -> tuple[List[TaskEvent], int]:
        """Obtener eventos de una tarea con paginación."""
        query = db.query(TaskEvent).filter(TaskEvent.task_id == task_id)
        total = query.count()
        events = query.order_by(TaskEvent.created_at.desc()).limit(limit).offset(offset).all()
        return events, total
