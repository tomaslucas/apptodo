import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.models.task import Task, Category, TaskCategory, RefreshToken, TaskEvent, IdempotencyKey


# Crear base de datos en memoria para testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


class TestAuthRegister:
    """Tests para el endpoint de registro."""

    def test_register_success(self):
        """Registrar usuario correctamente."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "SecurePass123"
            }
        )
        assert response.status_code == 201
        assert response.json()["status"] == "success"
        assert response.json()["data"]["user"]["username"] == "testuser"
        assert response.json()["data"]["user"]["email"] == "test@example.com"

    def test_register_duplicate_email(self):
        """No permitir email duplicado."""
        client.post(
            "/api/v1/auth/register",
            json={
                "username": "user1",
                "email": "duplicate@example.com",
                "password": "SecurePass123"
            }
        )
        
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "user2",
                "email": "duplicate@example.com",
                "password": "SecurePass456"
            }
        )
        assert response.status_code == 400
        assert "Email ya registrado" in response.json()["detail"]

    def test_register_duplicate_username(self):
        """No permitir username duplicado."""
        client.post(
            "/api/v1/auth/register",
            json={
                "username": "duplicate",
                "email": "user1@example.com",
                "password": "SecurePass123"
            }
        )
        
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "duplicate",
                "email": "user2@example.com",
                "password": "SecurePass456"
            }
        )
        assert response.status_code == 400
        assert "Username ya utilizado" in response.json()["detail"]

    def test_register_invalid_password(self):
        """Contraseña inválida."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "weak"  # Muy corta
            }
        )
        assert response.status_code == 422  # Validation error

    def test_register_password_no_uppercase(self):
        """Contraseña sin mayúsculas."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "lowercase123"
            }
        )
        assert response.status_code == 422

    def test_register_password_no_number(self):
        """Contraseña sin números."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "NoNumbers"
            }
        )
        assert response.status_code == 422

    def test_register_invalid_email(self):
        """Email inválido."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "not-an-email",
                "password": "SecurePass123"
            }
        )
        assert response.status_code == 422

    def test_register_invalid_username(self):
        """Username con caracteres inválidos."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "test@user!",
                "email": "test@example.com",
                "password": "SecurePass123"
            }
        )
        assert response.status_code == 422
