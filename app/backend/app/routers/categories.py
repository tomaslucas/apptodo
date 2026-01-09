from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.category import (
    CategoryCreateRequest,
    CategoryUpdateRequest,
)
from app.schemas.response import APIResponse
from app.schemas.user import UserResponse
from app.services.category import CategoryService

router = APIRouter(
    prefix="/api/v1/categories",
    tags=["categories"],
)


@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    request: CategoryCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crear nueva categoría."""
    try:
        category = CategoryService.create_category(
            db=db, user_id=current_user.id, name=request.name, color=request.color
        )

        return APIResponse(
            status="success", data={"category": category}, timestamp=datetime.utcnow()
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear categoría",
        )


@router.get("/{category_id}", response_model=APIResponse)
def get_category(
    category_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener categoría específica."""
    category = CategoryService.get_category(db, category_id, current_user.id)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada"
        )

    return APIResponse(
        status="success", data={"category": category}, timestamp=datetime.utcnow()
    )


@router.get("", response_model=APIResponse)
def list_categories(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener todas las categorías del usuario."""
    categories = CategoryService.get_user_categories(db, current_user.id)

    return APIResponse(
        status="success",
        data={
            "categories": categories,
            "pagination": {"total": len(categories), "limit": 1000},
        },
        timestamp=datetime.utcnow(),
    )


@router.put("/{category_id}", response_model=APIResponse)
def update_category(
    category_id: int,
    request: CategoryUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualizar categoría."""
    try:
        category = CategoryService.update_category(
            db=db,
            category_id=category_id,
            user_id=current_user.id,
            name=request.name,
            color=request.color,
        )

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada"
            )

        return APIResponse(
            status="success", data={"category": category}, timestamp=datetime.utcnow()
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{category_id}", response_model=APIResponse)
def delete_category(
    category_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Eliminar categoría."""
    success = CategoryService.delete_category(db, category_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada"
        )

    return APIResponse(
        status="success",
        data={"message": "Categoría eliminada"},
        timestamp=datetime.utcnow(),
    )
