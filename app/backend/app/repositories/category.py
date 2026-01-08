from sqlalchemy.orm import Session
from app.models.task import Category, TaskCategory
from datetime import datetime
from typing import Optional, List


class CategoryRepository:
    """Repositorio para operaciones de categorías."""

    @staticmethod
    def create_category(
        db: Session,
        user_id: int,
        name: str,
        color: Optional[str] = None
    ) -> Category:
        """Crear nueva categoría."""
        category = Category(
            user_id=user_id,
            name=name,
            color=color
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def get_category_by_id(db: Session, category_id: int, user_id: int) -> Optional[Category]:
        """Obtener categoría por ID (solo si pertenece al usuario)."""
        return db.query(Category).filter(
            Category.id == category_id,
            Category.user_id == user_id
        ).first()

    @staticmethod
    def get_categories_by_user(db: Session, user_id: int) -> List[Category]:
        """Obtener todas las categorías del usuario."""
        return db.query(Category).filter(Category.user_id == user_id).all()

    @staticmethod
    def get_category_by_name(db: Session, user_id: int, name: str) -> Optional[Category]:
        """Obtener categoría por nombre (para evitar duplicados)."""
        return db.query(Category).filter(
            Category.user_id == user_id,
            Category.name == name
        ).first()

    @staticmethod
    def update_category(
        db: Session,
        category_id: int,
        user_id: int,
        **kwargs
    ) -> Optional[Category]:
        """Actualizar categoría."""
        category = db.query(Category).filter(
            Category.id == category_id,
            Category.user_id == user_id
        ).first()
        
        if not category:
            return None
        
        # Actualizar campos
        for key, value in kwargs.items():
            if value is not None and hasattr(category, key):
                setattr(category, key, value)
        
        category.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete_category(db: Session, category_id: int, user_id: int) -> bool:
        """Eliminar categoría (y sus asociaciones)."""
        category = db.query(Category).filter(
            Category.id == category_id,
            Category.user_id == user_id
        ).first()
        
        if not category:
            return False
        
        # Las asociaciones se eliminarán automáticamente por CASCADE
        db.delete(category)
        db.commit()
        return True


class TaskCategoryRepository:
    """Repositorio para relaciones Task-Category."""

    @staticmethod
    def add_category_to_task(
        db: Session,
        task_id: int,
        category_id: int
    ) -> TaskCategory:
        """Agregar categoría a tarea."""
        # Verificar si ya existe
        existing = db.query(TaskCategory).filter(
            TaskCategory.task_id == task_id,
            TaskCategory.category_id == category_id
        ).first()
        
        if existing:
            return existing
        
        task_category = TaskCategory(
            task_id=task_id,
            category_id=category_id
        )
        db.add(task_category)
        db.commit()
        db.refresh(task_category)
        return task_category

    @staticmethod
    def remove_category_from_task(
        db: Session,
        task_id: int,
        category_id: int
    ) -> bool:
        """Remover categoría de tarea."""
        task_category = db.query(TaskCategory).filter(
            TaskCategory.task_id == task_id,
            TaskCategory.category_id == category_id
        ).first()
        
        if not task_category:
            return False
        
        db.delete(task_category)
        db.commit()
        return True

    @staticmethod
    def get_task_categories(db: Session, task_id: int) -> List[Category]:
        """Obtener todas las categorías de una tarea."""
        return db.query(Category).join(
            TaskCategory,
            Category.id == TaskCategory.category_id
        ).filter(TaskCategory.task_id == task_id).all()

    @staticmethod
    def get_category_tasks(db: Session, category_id: int) -> List:
        """Obtener todas las tareas de una categoría."""
        from app.models.task import Task
        return db.query(Task).join(
            TaskCategory,
            Task.id == TaskCategory.task_id
        ).filter(TaskCategory.category_id == category_id).all()
