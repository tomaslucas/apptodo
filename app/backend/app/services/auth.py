from sqlalchemy.orm import Session
from app.repositories.user import UserRepository
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.schemas.user import UserResponse
from typing import Optional, Tuple


class AuthService:
    """Servicio de autenticación."""

    @staticmethod
    def register_user(
        db: Session, username: str, email: str, password: str
    ) -> UserResponse:
        """Registrar nuevo usuario."""
        # Verificar que el usuario no exista
        if UserRepository.get_user_by_email(db, email):
            raise ValueError("Email ya registrado")

        if UserRepository.get_user_by_username(db, username):
            raise ValueError("Username ya utilizado")

        # Crear usuario
        user = UserRepository.create_user(db, username, email, password)
        return UserResponse.model_validate(user)

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[Tuple]:
        """Autenticar usuario y retornar tokens."""
        user = UserRepository.get_user_by_email(db, email)

        if not user or not verify_password(password, user.password_hash):
            return None

        # Crear tokens
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return access_token, refresh_token, UserResponse.model_validate(user)

    @staticmethod
    def get_user_from_token(db: Session, user_id: int) -> Optional[UserResponse]:
        """Obtener usuario del ID en token."""
        user = UserRepository.get_user_by_id(db, user_id)
        if user:
            return UserResponse.model_validate(user)
        return None
