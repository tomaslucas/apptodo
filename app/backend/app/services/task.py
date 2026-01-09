from sqlalchemy.orm import Session
from app.repositories.task import TaskRepository, TaskEventRepository
from app.repositories.category import CategoryRepository, TaskCategoryRepository
from app.schemas.task import TaskResponse
from typing import Optional, List


class TaskService:
    """Servicio de lógica de negocio para tareas."""

    @staticmethod
    def create_task(
        db: Session,
        user_id: int,
        title: str,
        description: Optional[str] = None,
        priority: str = "media",
        deadline: Optional[str] = None,
        status: str = "pendiente",
        recurrence_rule: Optional[str] = None,
    ) -> TaskResponse:
        """Crear nueva tarea y registrar evento."""
        # Crear tarea
        task = TaskRepository.create_task(
            db=db,
            user_id=user_id,
            title=title,
            description=description,
            priority=priority,
            deadline=deadline,
            status=status,
            recurrence_rule=recurrence_rule,
        )

        # Registrar evento de auditoría
        TaskEventRepository.create_event(
            db=db,
            task_id=task.id,
            user_id=user_id,
            event_type="task_created",
            new_state={
                "id": task.id,
                "title": task.title,
                "priority": task.priority,
                "status": task.status,
            },
        )

        return TaskResponse.from_orm(task)

    @staticmethod
    def get_task(db: Session, task_id: int, user_id: int) -> Optional[TaskResponse]:
        """Obtener una tarea específica."""
        task = TaskRepository.get_task_by_id(db, task_id, user_id)
        if task:
            return TaskResponse.from_orm(task)
        return None

    @staticmethod
    def get_user_tasks(
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
        offset: int = 0,
    ) -> List[TaskResponse]:
        """Obtener todas las tareas del usuario con filtros avanzados."""
        tasks = TaskRepository.get_tasks_by_user(
            db=db,
            user_id=user_id,
            status=status,
            priority=priority,
            category_id=category_id,
            category_ids=category_ids,
            deadline_from=deadline_from,
            deadline_to=deadline_to,
            search=search,
            completed=completed,
            include_deleted=include_deleted,
            limit=limit,
            offset=offset,
        )
        return [TaskResponse.from_orm(task) for task in tasks]

    @staticmethod
    def update_task(
        db: Session,
        task_id: int,
        user_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        deadline: Optional[str] = None,
        status: Optional[str] = None,
        recurrence_rule: Optional[str] = None,
        version: Optional[int] = None,
    ) -> Optional[TaskResponse]:
        """Actualizar tarea con optimistic locking."""
        # Obtener tarea actual
        task = TaskRepository.get_task_by_id(db, task_id, user_id)
        if not task:
            return None

        # Preparar cambios
        old_state = {
            "title": task.title,
            "priority": task.priority,
            "status": task.status,
            "deadline": str(task.deadline) if task.deadline else None,
        }

        update_data = {}
        if title is not None:
            update_data["title"] = title
        if description is not None:
            update_data["description"] = description
        if priority is not None:
            update_data["priority"] = priority
        if deadline is not None:
            update_data["deadline"] = deadline
        if status is not None:
            update_data["status"] = status
            if status == "completada":
                from datetime import datetime

                update_data["completed_at"] = datetime.utcnow()
        if recurrence_rule is not None:
            update_data["recurrence_rule"] = recurrence_rule
        if version is not None:
            update_data["version"] = version

        # Actualizar
        updated_task = TaskRepository.update_task(db, task_id, user_id, **update_data)

        # Registrar evento
        new_state = {
            "title": updated_task.title,
            "priority": updated_task.priority,
            "status": updated_task.status,
            "deadline": str(updated_task.deadline) if updated_task.deadline else None,
        }

        TaskEventRepository.create_event(
            db=db,
            task_id=task_id,
            user_id=user_id,
            event_type="task_updated",
            old_state=old_state,
            new_state=new_state,
        )

        return TaskResponse.from_orm(updated_task)

    @staticmethod
    def delete_task(db: Session, task_id: int, user_id: int) -> Optional[TaskResponse]:
        """Soft delete de tarea."""
        task = TaskRepository.soft_delete_task(db, task_id, user_id)
        if task:
            TaskEventRepository.create_event(
                db=db, task_id=task_id, user_id=user_id, event_type="task_deleted"
            )
            return TaskResponse.from_orm(task)
        return None

    @staticmethod
    def restore_task(db: Session, task_id: int, user_id: int) -> Optional[TaskResponse]:
        """Restaurar tarea eliminada."""
        task = TaskRepository.restore_task(db, task_id, user_id)
        if task:
            TaskEventRepository.create_event(
                db=db, task_id=task_id, user_id=user_id, event_type="task_restored"
            )
            return TaskResponse.from_orm(task)
        return None

    @staticmethod
    def complete_task(
        db: Session, task_id: int, user_id: int
    ) -> Optional[TaskResponse]:
        """Marcar tarea como completada."""
        task = TaskRepository.complete_task(db, task_id, user_id)
        if task:
            TaskEventRepository.create_event(
                db=db, task_id=task_id, user_id=user_id, event_type="task_completed"
            )
            return TaskResponse.from_orm(task)
        return None

    @staticmethod
    def add_category_to_task(
        db: Session, task_id: int, user_id: int, category_id: int
    ) -> bool:
        """Agregar categoría a tarea (validar que el usuario posea la tarea y categoría)."""
        # Verificar que la tarea pertenece al usuario
        task = TaskRepository.get_task_by_id(db, task_id, user_id)
        if not task:
            return False

        # Verificar que la categoría pertenece al usuario
        category = CategoryRepository.get_category_by_id(db, category_id, user_id)
        if not category:
            return False

        # Agregar la relación
        TaskCategoryRepository.add_category_to_task(db, task_id, category_id)

        # Registrar evento
        TaskEventRepository.create_event(
            db=db,
            task_id=task_id,
            user_id=user_id,
            event_type="category_added",
            payload={"category_id": category_id},
        )

        return True

    @staticmethod
    def remove_category_from_task(
        db: Session, task_id: int, user_id: int, category_id: int
    ) -> bool:
        """Remover categoría de tarea (validar que el usuario posea la tarea)."""
        # Verificar que la tarea pertenece al usuario
        task = TaskRepository.get_task_by_id(db, task_id, user_id)
        if not task:
            return False

        # Remover la relación
        success = TaskCategoryRepository.remove_category_from_task(
            db, task_id, category_id
        )

        if success:
            # Registrar evento
            TaskEventRepository.create_event(
                db=db,
                task_id=task_id,
                user_id=user_id,
                event_type="category_removed",
                payload={"category_id": category_id},
            )

        return success

    @staticmethod
    def batch_complete_tasks(db: Session, task_ids: List[int], user_id: int) -> dict:
        """Marcar múltiples tareas como completadas."""
        updated_count = TaskRepository.batch_complete_tasks(db, task_ids, user_id)

        # Registrar evento para cada tarea
        for task_id in task_ids:
            TaskEventRepository.create_event(
                db=db, task_id=task_id, user_id=user_id, event_type="task_completed"
            )

        return {"updated": updated_count, "total_requested": len(task_ids)}

    @staticmethod
    def batch_delete_tasks(db: Session, task_ids: List[int], user_id: int) -> dict:
        """Soft delete de múltiples tareas."""
        updated_count = TaskRepository.batch_delete_tasks(db, task_ids, user_id)

        # Registrar evento para cada tarea
        for task_id in task_ids:
            TaskEventRepository.create_event(
                db=db, task_id=task_id, user_id=user_id, event_type="task_deleted"
            )

        return {"updated": updated_count, "total_requested": len(task_ids)}

    @staticmethod
    def batch_restore_tasks(db: Session, task_ids: List[int], user_id: int) -> dict:
        """Restaurar múltiples tareas eliminadas."""
        updated_count = TaskRepository.batch_restore_tasks(db, task_ids, user_id)

        # Registrar evento para cada tarea
        for task_id in task_ids:
            TaskEventRepository.create_event(
                db=db, task_id=task_id, user_id=user_id, event_type="task_restored"
            )

        return {"updated": updated_count, "total_requested": len(task_ids)}

    @staticmethod
    def batch_update_tasks(
        db: Session,
        task_ids: List[int],
        user_id: int,
        status: Optional[str] = None,
        priority: Optional[str] = None,
    ) -> dict:
        """Actualizar múltiples tareas."""
        update_kwargs = {}
        if status:
            update_kwargs["status"] = status
        if priority:
            update_kwargs["priority"] = priority

        updated_count = TaskRepository.batch_update_tasks(
            db, task_ids, user_id, **update_kwargs
        )

        # Registrar evento para cada tarea
        for task_id in task_ids:
            TaskEventRepository.create_event(
                db=db,
                task_id=task_id,
                user_id=user_id,
                event_type="task_updated",
                payload=update_kwargs,
            )

        return {
            "updated": updated_count,
            "total_requested": len(task_ids),
            "fields_updated": update_kwargs,
        }
