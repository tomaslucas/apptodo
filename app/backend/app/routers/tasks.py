from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.task import (
    TaskCreateRequest,
    TaskUpdateRequest,
    TaskResponse,
    TaskListResponse
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
    db: Session = Depends(get_db)
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
            recurrence_rule=request.recurrence_rule
        )
        
        return APIResponse(
            status="success",
            data={"task": task},
            timestamp=datetime.utcnow()
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear tarea"
        )


@router.get("/{task_id}", response_model=APIResponse)
def get_task(
    task_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener tarea específica."""
    task = TaskService.get_task(db, task_id, current_user.id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea no encontrada"
        )
    
    return APIResponse(
        status="success",
        data={"task": task},
        timestamp=datetime.utcnow()
    )


@router.get("", response_model=APIResponse)
def list_tasks(
    status: str = None,
    priority: str = None,
    include_deleted: bool = False,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener todas las tareas del usuario con filtros opcionalesivos."""
    tasks = TaskService.get_user_tasks(
        db=db,
        user_id=current_user.id,
        status=status,
        priority=priority,
        include_deleted=include_deleted
    )
    
    return APIResponse(
        status="success",
        data={
            "tasks": tasks,
            "pagination": {
                "total": len(tasks),
                "limit": 1000
            }
        },
        timestamp=datetime.utcnow()
    )


@router.put("/{task_id}", response_model=APIResponse)
def update_task(
    task_id: int,
    request: TaskUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
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
            version=request.version
        )
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarea no encontrada"
            )
        
        return APIResponse(
            status="success",
            data={"task": task},
            timestamp=datetime.utcnow()
        )
    except ValueError as e:
        if "Version mismatch" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{task_id}", response_model=APIResponse)
def delete_task(
    task_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete de tarea."""
    task = TaskService.delete_task(db, task_id, current_user.id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea no encontrada"
        )
    
    return APIResponse(
        status="success",
        data={"task": task},
        timestamp=datetime.utcnow()
    )


@router.patch("/{task_id}/restore", response_model=APIResponse)
def restore_task(
    task_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restaurar tarea eliminada."""
    task = TaskService.restore_task(db, task_id, current_user.id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea no encontrada"
        )
    
    return APIResponse(
        status="success",
        data={"task": task},
        timestamp=datetime.utcnow()
    )


@router.patch("/{task_id}/complete", response_model=APIResponse)
def complete_task(
    task_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marcar tarea como completada."""
    task = TaskService.complete_task(db, task_id, current_user.id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea no encontrada"
        )
    
    return APIResponse(
        status="success",
        data={"task": task},
        timestamp=datetime.utcnow()
    )
