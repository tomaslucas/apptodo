from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.task import (
    TaskCreateRequest,
    TaskUpdateRequest,
    TaskCategoryRequest,
    BatchTaskRequest,
    BatchUpdateTaskRequest,
    TaskEventResponse,
)
from app.schemas.response import APIResponse
from app.schemas.user import UserResponse
from app.services.task import TaskService

router = APIRouter(
    prefix="/api/v1/tasks",
    tags=["tasks"],
)


@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    request: TaskCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crear nueva tarea con idempotencia."""
    try:
        task = TaskService.create_task(
            db=db,
            user_id=current_user.id,
            title=request.title,
            description=request.description,
            priority=request.priority,
            deadline=request.deadline,
            status=request.status,
            recurrence_rule=request.recurrence_rule,
        )

        # Agregar categorías si se especificaron
        if request.category_ids:
            for category_id in request.category_ids:
                TaskService.add_category_to_task(
                    db=db,
                    task_id=task.id,
                    user_id=current_user.id,
                    category_id=category_id,
                )
            # Refrescar la tarea para incluir las categorías
            task = TaskService.get_task(db, task.id, current_user.id)

        return APIResponse(
            status="success", data={"task": task}, timestamp=datetime.utcnow()
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear tarea",
        )


@router.get("/{task_id}", response_model=APIResponse)
def get_task(
    task_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener tarea específica."""
    task = TaskService.get_task(db, task_id, current_user.id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada"
        )

    return APIResponse(
        status="success", data={"task": task}, timestamp=datetime.utcnow()
    )


@router.get("", response_model=APIResponse)
def list_tasks(
    status: str = None,
    priority: str = None,
    category_id: int = None,
    categories: str = None,
    deadline_from: str = None,
    deadline_to: str = None,
    search: str = None,
    completed: bool = None,
    include_deleted: bool = False,
    limit: int = 1000,
    offset: int = 0,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener todas las tareas del usuario con filtros avanzados."""
    # Parsear múltiples categorías (comma-separated list)
    category_ids = None
    if categories:
        try:
            category_ids = [int(c.strip()) for c in categories.split(",")]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category IDs format",
            )

    tasks = TaskService.get_user_tasks(
        db=db,
        user_id=current_user.id,
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

    return APIResponse(
        status="success",
        data={
            "tasks": tasks,
            "pagination": {"total": len(tasks), "limit": limit, "offset": offset},
        },
        timestamp=datetime.utcnow(),
    )


@router.put("/{task_id}", response_model=APIResponse)
def update_task(
    task_id: int,
    request: TaskUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualizar tarea con optimistic locking."""
    try:
        task = TaskService.update_task(
            db=db,
            task_id=task_id,
            user_id=current_user.id,
            title=request.title,
            description=request.description,
            priority=request.priority,
            deadline=request.deadline,
            status=request.status,
            recurrence_rule=request.recurrence_rule,
            version=request.version,
        )

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada"
            )

        return APIResponse(
            status="success", data={"task": task}, timestamp=datetime.utcnow()
        )
    except ValueError as e:
        if "Version mismatch" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{task_id}", response_model=APIResponse)
def patch_task(
    task_id: int,
    request: TaskUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualizar tarea parcialmente con optimistic locking."""
    try:
        task = TaskService.update_task(
            db=db,
            task_id=task_id,
            user_id=current_user.id,
            title=request.title,
            description=request.description,
            priority=request.priority,
            deadline=request.deadline,
            status=request.status,
            recurrence_rule=request.recurrence_rule,
            version=request.version,
        )

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada"
            )

        # Actualizar categorías si se especificaron
        if request.category_ids is not None:
            TaskService.sync_task_categories(
                db=db,
                task_id=task_id,
                user_id=current_user.id,
                category_ids=request.category_ids,
            )
            # Refrescar la tarea para incluir las categorías actualizadas
            task = TaskService.get_task(db, task_id, current_user.id)

        return APIResponse(
            status="success", data={"task": task}, timestamp=datetime.utcnow()
        )
    except ValueError as e:
        if "Version mismatch" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{task_id}", response_model=APIResponse)
def delete_task(
    task_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete de tarea."""
    task = TaskService.delete_task(db, task_id, current_user.id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada"
        )

    return APIResponse(
        status="success", data={"task": task}, timestamp=datetime.utcnow()
    )


@router.patch("/{task_id}/restore", response_model=APIResponse)
def restore_task(
    task_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Restaurar tarea eliminada."""
    task = TaskService.restore_task(db, task_id, current_user.id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada"
        )

    return APIResponse(
        status="success", data={"task": task}, timestamp=datetime.utcnow()
    )


@router.patch("/{task_id}/complete", response_model=APIResponse)
def complete_task(
    task_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marcar tarea como completada."""
    task = TaskService.complete_task(db, task_id, current_user.id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada"
        )

    return APIResponse(
        status="success", data={"task": task}, timestamp=datetime.utcnow()
    )


@router.post(
    "/{task_id}/categories",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_category_to_task(
    task_id: int,
    request: TaskCategoryRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Agregar categoría a tarea."""
    success = TaskService.add_category_to_task(
        db=db, task_id=task_id, user_id=current_user.id, category_id=request.category_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea o categoría no encontrada",
        )

    return APIResponse(
        status="success",
        data={"message": "Categoría agregada a tarea"},
        timestamp=datetime.utcnow(),
    )


@router.delete("/{task_id}/categories/{category_id}", response_model=APIResponse)
def remove_category_from_task(
    task_id: int,
    category_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remover categoría de tarea."""
    success = TaskService.remove_category_from_task(
        db=db, task_id=task_id, user_id=current_user.id, category_id=category_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea o categoría no encontrada",
        )

    return APIResponse(
        status="success",
        data={"message": "Categoría removida de tarea"},
        timestamp=datetime.utcnow(),
    )


@router.post("/batch/complete", response_model=APIResponse)
def batch_complete_tasks(
    request: BatchTaskRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Completar múltiples tareas."""
    result = TaskService.batch_complete_tasks(
        db=db, task_ids=request.task_ids, user_id=current_user.id
    )

    return APIResponse(status="success", data=result, timestamp=datetime.utcnow())


@router.post("/batch/delete", response_model=APIResponse)
def batch_delete_tasks(
    request: BatchTaskRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Eliminar múltiples tareas (soft delete)."""
    result = TaskService.batch_delete_tasks(
        db=db, task_ids=request.task_ids, user_id=current_user.id
    )

    return APIResponse(status="success", data=result, timestamp=datetime.utcnow())


@router.post("/batch/restore", response_model=APIResponse)
def batch_restore_tasks(
    request: BatchTaskRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Restaurar múltiples tareas eliminadas."""
    result = TaskService.batch_restore_tasks(
        db=db, task_ids=request.task_ids, user_id=current_user.id
    )

    return APIResponse(status="success", data=result, timestamp=datetime.utcnow())


@router.patch("/batch/update", response_model=APIResponse)
def batch_update_tasks(
    request: BatchUpdateTaskRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualizar múltiples tareas."""
    result = TaskService.batch_update_tasks(
        db=db,
        task_ids=request.task_ids,
        user_id=current_user.id,
        status=request.status,
        priority=request.priority,
    )

    return APIResponse(status="success", data=result, timestamp=datetime.utcnow())


@router.get("/{task_id}/events", response_model=APIResponse)
def get_task_events(
    task_id: int,
    limit: int = 100,
    offset: int = 0,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener historial de eventos (auditoría) de una tarea."""
    # Verificar que la tarea pertenece al usuario
    task = TaskService.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tarea no encontrada"
        )

    # Obtener eventos
    from app.repositories.task import TaskEventRepository

    events, total = TaskEventRepository.get_task_events_paginated(
        db, task_id, limit=limit, offset=offset
    )

    # Convertir a respuesta
    event_responses = [TaskEventResponse.from_orm(event) for event in events]

    return APIResponse(
        status="success",
        data={
            "task_id": task_id,
            "events": event_responses,
            "total": total,
            "pagination": {"limit": limit, "offset": offset},
        },
        timestamp=datetime.utcnow(),
    )
