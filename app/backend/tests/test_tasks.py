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


def create_and_login_user():
    """Crear usuario y obtener access token."""
    # Registrar
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePass123"
        }
    )
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "SecurePass123"
        }
    )
    
    return response.json()["data"]["access_token"]


class TestTaskCreate:
    """Tests para crear tareas."""

    def test_create_task_success(self):
        """Crear tarea exitosamente."""
        token = create_and_login_user()
        
        response = client.post(
            "/api/v1/tasks",
            json={
                "title": "Mi primera tarea",
                "description": "Descripción de la tarea",
                "priority": "alta",
                "status": "pendiente"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 201
        assert response.json()["status"] == "success"
        assert response.json()["data"]["task"]["title"] == "Mi primera tarea"
        assert response.json()["data"]["task"]["status"] == "pendiente"

    def test_create_task_without_auth(self):
        """Crear tarea sin autenticación."""
        response = client.post(
            "/api/v1/tasks",
            json={
                "title": "Mi tarea",
                "description": "Descripción"
            }
        )
        
        assert response.status_code == 401

    def test_create_task_missing_title(self):
        """Crear tarea sin título."""
        token = create_and_login_user()
        
        response = client.post(
            "/api/v1/tasks",
            json={
                "description": "Sin título"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 422


class TestTaskList:
    """Tests para listar tareas."""

    def test_list_tasks_empty(self):
        """Listar tareas cuando no hay ninguna."""
        token = create_and_login_user()
        
        response = client.get(
            "/api/v1/tasks",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert len(response.json()["data"]["tasks"]) == 0

    def test_list_tasks_with_data(self):
        """Listar tareas cuando hay tareas."""
        token = create_and_login_user()
        
        # Crear tarea
        client.post(
            "/api/v1/tasks",
            json={
                "title": "Tarea 1",
                "priority": "media"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        client.post(
            "/api/v1/tasks",
            json={
                "title": "Tarea 2",
                "priority": "alta"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Listar
        response = client.get(
            "/api/v1/tasks",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert len(response.json()["data"]["tasks"]) == 2

    def test_list_tasks_filter_by_priority(self):
        """Listar tareas filtradas por prioridad."""
        token = create_and_login_user()
        
        # Crear tareas
        client.post(
            "/api/v1/tasks",
            json={"title": "Tarea baja", "priority": "baja"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        client.post(
            "/api/v1/tasks",
            json={"title": "Tarea alta", "priority": "alta"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Listar solo tareas altas
        response = client.get(
            "/api/v1/tasks?priority=alta",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        tasks = response.json()["data"]["tasks"]
        assert len(tasks) == 1
        assert tasks[0]["priority"] == "alta"


class TestTaskGet:
    """Tests para obtener tarea específica."""

    def test_get_task_success(self):
        """Obtener tarea existente."""
        token = create_and_login_user()
        
        # Crear tarea
        create_response = client.post(
            "/api/v1/tasks",
            json={"title": "Mi tarea"},
            headers={"Authorization": f"Bearer {token}"}
        )
        task_id = create_response.json()["data"]["task"]["id"]
        
        # Obtener
        response = client.get(
            f"/api/v1/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["task"]["title"] == "Mi tarea"

    def test_get_task_not_found(self):
        """Obtener tarea que no existe."""
        token = create_and_login_user()
        
        response = client.get(
            "/api/v1/tasks/999",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404


class TestTaskUpdate:
    """Tests para actualizar tareas."""

    def test_update_task_success(self):
        """Actualizar tarea exitosamente."""
        token = create_and_login_user()
        
        # Crear tarea
        create_response = client.post(
            "/api/v1/tasks",
            json={"title": "Título original"},
            headers={"Authorization": f"Bearer {token}"}
        )
        task = create_response.json()["data"]["task"]
        
        # Actualizar
        response = client.put(
            f"/api/v1/tasks/{task['id']}",
            json={
                "title": "Título actualizado",
                "status": "en_progreso",
                "version": task["version"]
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["task"]["title"] == "Título actualizado"
        assert response.json()["data"]["task"]["status"] == "en_progreso"

    def test_update_task_version_mismatch(self):
        """Actualizar tarea con versión incorrecta."""
        token = create_and_login_user()
        
        # Crear tarea
        create_response = client.post(
            "/api/v1/tasks",
            json={"title": "Título original"},
            headers={"Authorization": f"Bearer {token}"}
        )
        task_id = create_response.json()["data"]["task"]["id"]
        
        # Actualizar
        response = client.put(
            f"/api/v1/tasks/{task_id}",
            json={
                "title": "Título actualizado",
                "version": 999  # Versión incorrecta
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 409  # Conflict


class TestTaskDelete:
    """Tests para eliminar tareas (soft delete)."""

    def test_delete_task_success(self):
        """Eliminar tarea exitosamente."""
        token = create_and_login_user()
        
        # Crear tarea
        create_response = client.post(
            "/api/v1/tasks",
            json={"title": "Tarea a eliminar"},
            headers={"Authorization": f"Bearer {token}"}
        )
        task_id = create_response.json()["data"]["task"]["id"]
        
        # Eliminar
        response = client.delete(
            f"/api/v1/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["task"]["deleted_at"] is not None

    def test_delete_task_not_found(self):
        """Eliminar tarea que no existe."""
        token = create_and_login_user()
        
        response = client.delete(
            "/api/v1/tasks/999",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404


class TestTaskRestore:
    """Tests para restaurar tareas eliminadas."""

    def test_restore_task_success(self):
        """Restaurar tarea eliminada."""
        token = create_and_login_user()
        
        # Crear y eliminar tarea
        create_response = client.post(
            "/api/v1/tasks",
            json={"title": "Tarea a restaurar"},
            headers={"Authorization": f"Bearer {token}"}
        )
        task_id = create_response.json()["data"]["task"]["id"]
        
        client.delete(
            f"/api/v1/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Restaurar
        response = client.patch(
            f"/api/v1/tasks/{task_id}/restore",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["task"]["deleted_at"] is None


class TestTaskComplete:
    """Tests para completar tareas."""

    def test_complete_task_success(self):
        """Completar tarea exitosamente."""
        token = create_and_login_user()
        
        # Crear tarea
        create_response = client.post(
            "/api/v1/tasks",
            json={"title": "Tarea a completar"},
            headers={"Authorization": f"Bearer {token}"}
        )
        task_id = create_response.json()["data"]["task"]["id"]
        
        # Completar
        response = client.patch(
            f"/api/v1/tasks/{task_id}/complete",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["task"]["status"] == "completada"
        assert response.json()["data"]["task"]["completed_at"] is not None
