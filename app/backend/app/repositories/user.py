from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import hash_password
from typing import Optional


class UserRepository:
    """Repositorio para operaciones de usuario."""

    @staticmethod
    def create_user(db: Session, username: str, email: str, password: str) -> User:
        """Crear nuevo usuario."""
        hashed_password = hash_password(password)
        user = User(username=username, email=email, password_hash=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Obtener usuario por email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Obtener usuario por username."""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Obtener usuario por ID."""
        return db.query(User).filter(User.id == user_id).first()
