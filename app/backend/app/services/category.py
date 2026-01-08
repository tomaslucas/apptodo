from sqlalchemy.orm import Session
from app.repositories.category import CategoryRepository, TaskCategoryRepository
from app.schemas.category import CategoryResponse
from typing import Optional, List


class CategoryService:
    """Servicio de lógica de negocio para categorías."""

    @staticmethod
    def create_category(
        db: Session,
        user_id: int,
        name: str,
        color: Optional[str] = None
    ) -> CategoryResponse:
        """Crear nueva categoría."""
        # Validar que no exista una categoría con el mismo nombre para este usuario
        existing = CategoryRepository.get_category_by_name(db, user_id, name)
        if existing:
            raise ValueError(f"Ya existe una categoría con el nombre '{name}'")
        
        # Crear categoría
        category = CategoryRepository.create_category(
            db=db,
            user_id=user_id,
            name=name,
            color=color
        )
        
        return CategoryResponse.from_orm(category)

    @staticmethod
    def get_category(db: Session, category_id: int, user_id: int) -> Optional[CategoryResponse]:
        """Obtener categoría por ID."""
        category = CategoryRepository.get_category_by_id(db, category_id, user_id)
        
        if not category:
            return None
        
        return CategoryResponse.from_orm(category)

    @staticmethod
    def get_user_categories(db: Session, user_id: int) -> List[CategoryResponse]:
        """Obtener todas las categorías del usuario."""
        categories = CategoryRepository.get_categories_by_user(db, user_id)
        return [CategoryResponse.from_orm(cat) for cat in categories]

    @staticmethod
    def update_category(
        db: Session,
        category_id: int,
        user_id: int,
        name: Optional[str] = None,
        color: Optional[str] = None
    ) -> Optional[CategoryResponse]:
        """Actualizar categoría."""
        # Verificar que existe
        category = CategoryRepository.get_category_by_id(db, category_id, user_id)
        if not category:
            return None
        
        # Si se cambia el nombre, verificar que no exista otro con el mismo
        if name and name != category.name:
            existing = CategoryRepository.get_category_by_name(db, user_id, name)
            if existing:
                raise ValueError(f"Ya existe una categoría con el nombre '{name}'")
        
        # Actualizar
        updated = CategoryRepository.update_category(
            db=db,
            category_id=category_id,
            user_id=user_id,
            name=name,
            color=color
        )
        
        return CategoryResponse.from_orm(updated) if updated else None

    @staticmethod
    def delete_category(db: Session, category_id: int, user_id: int) -> bool:
        """Eliminar categoría."""
        return CategoryRepository.delete_category(db, category_id, user_id)


class TaskCategoryService:
    """Servicio para manejar relaciones Task-Category."""

    @staticmethod
    def add_category_to_task(
        db: Session,
        task_id: int,
        category_id: int,
        user_id: int  # Para validar que el usuario es dueño de la tarea
    ) -> bool:
        """Agregar categoría a tarea."""
        from app.repositories.task import TaskRepository
        
        # Validar que el usuario es dueño de la tarea
        task = TaskRepository.get_task_by_id(db, task_id, user_id)
        if not task:
            raise ValueError("Tarea no encontrada")
        
        # Validar que el usuario es dueño de la categoría
        category = CategoryRepository.get_category_by_id(db, category_id, user_id)
        if not category:
            raise ValueError("Categoría no encontrada")
        
        # Agregar relación
        TaskCategoryRepository.add_category_to_task(db, task_id, category_id)
        return True

    @staticmethod
    def remove_category_from_task(
        db: Session,
        task_id: int,
        category_id: int,
        user_id: int  # Para validar que el usuario es dueño de la tarea
    ) -> bool:
        """Remover categoría de tarea."""
        from app.repositories.task import TaskRepository
        
        # Validar que el usuario es dueño de la tarea
        task = TaskRepository.get_task_by_id(db, task_id, user_id)
        if not task:
            raise ValueError("Tarea no encontrada")
        
        # Remover relación
        return TaskCategoryRepository.remove_category_from_task(db, task_id, category_id)

    @staticmethod
    def get_task_categories(db: Session, task_id: int) -> List:
        """Obtener categorías de una tarea."""
        return TaskCategoryRepository.get_task_categories(db, task_id)
