import pytest
import uuid
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


def create_test_user():
    """Crear usuario de prueba con nombre único."""
    unique_id = str(uuid.uuid4())[:8]
    
    # Registrar
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": f"user_{unique_id}",
            "email": f"user_{unique_id}@example.com",
            "password": "SecurePass123"
        }
    )
    
    if response.status_code != 201:
        raise Exception(f"Failed to register: {response.json()}")
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": f"user_{unique_id}@example.com",
            "password": "SecurePass123"
        }
    )
    
    if response.status_code != 200:
        raise Exception(f"Failed to login: {response.json()}")
    
    return response.json()["data"]["access_token"]


def test_batch_complete_tasks():
    """Completar múltiples tareas."""
    token = create_test_user()
    
    # Crear 3 tareas
    task_ids = []
    for i in range(3):
        response = client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}"},
            headers={"Authorization": f"Bearer {token}"}
        )
        task_ids.append(response.json()["data"]["task"]["id"])
    
    # Completar todas
    response = client.post(
        "/api/v1/tasks/batch/complete",
        json={"task_ids": task_ids},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 3
    assert data["total_requested"] == 3
    
    # Verificar que están completadas
    for task_id in task_ids:
        response = client.get(
            f"/api/v1/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.json()["data"]["task"]["status"] == "completada"


def test_batch_delete_tasks():
    """Eliminar múltiples tareas (soft delete)."""
    token = create_test_user()
    
    # Crear 3 tareas
    task_ids = []
    for i in range(3):
        response = client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}"},
            headers={"Authorization": f"Bearer {token}"}
        )
        task_ids.append(response.json()["data"]["task"]["id"])
    
    # Eliminar todas
    response = client.post(
        "/api/v1/tasks/batch/delete",
        json={"task_ids": task_ids},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 3
    assert data["total_requested"] == 3


def test_batch_restore_tasks():
    """Restaurar múltiples tareas eliminadas."""
    token = create_test_user()
    
    # Crear 3 tareas
    task_ids = []
    for i in range(3):
        response = client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}"},
            headers={"Authorization": f"Bearer {token}"}
        )
        task_ids.append(response.json()["data"]["task"]["id"])
    
    # Eliminar todas
    client.post(
        "/api/v1/tasks/batch/delete",
        json={"task_ids": task_ids},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Restaurar todas
    response = client.post(
        "/api/v1/tasks/batch/restore",
        json={"task_ids": task_ids},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 3
    assert data["total_requested"] == 3


def test_batch_update_tasks():
    """Actualizar múltiples tareas."""
    token = create_test_user()
    
    # Crear 3 tareas
    task_ids = []
    for i in range(3):
        response = client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}", "priority": "baja"},
            headers={"Authorization": f"Bearer {token}"}
        )
        task_ids.append(response.json()["data"]["task"]["id"])
    
    # Actualizar prioridad
    response = client.patch(
        "/api/v1/tasks/batch/update",
        json={"task_ids": task_ids, "priority": "alta"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 3
    assert data["total_requested"] == 3
    assert data["fields_updated"]["priority"] == "alta"
    
    # Verificar que se actualizaron
    for task_id in task_ids:
        response = client.get(
            f"/api/v1/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.json()["data"]["task"]["priority"] == "alta"


def test_batch_update_status():
    """Actualizar estado de múltiples tareas."""
    token = create_test_user()
    
    # Crear 2 tareas
    task_ids = []
    for i in range(2):
        response = client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}"},
            headers={"Authorization": f"Bearer {token}"}
        )
        task_ids.append(response.json()["data"]["task"]["id"])
    
    # Actualizar estado a en_progreso
    response = client.patch(
        "/api/v1/tasks/batch/update",
        json={"task_ids": task_ids, "status": "en_progreso"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 2
    assert data["fields_updated"]["status"] == "en_progreso"


def test_batch_empty_request():
    """No permitir batch con lista vacía."""
    token = create_test_user()
    
    # Intentar con lista vacía
    response = client.post(
        "/api/v1/tasks/batch/complete",
        json={"task_ids": []},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Debería fallar validación
    assert response.status_code == 422


def test_batch_nonexistent_tasks():
    """Batch con tareas inexistentes."""
    token = create_test_user()
    
    # Intentar completar tareas que no existen
    response = client.post(
        "/api/v1/tasks/batch/complete",
        json={"task_ids": [9999, 10000]},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 0
    assert data["total_requested"] == 2


def test_batch_without_auth():
    """No permitir batch sin autenticación."""
    response = client.post(
        "/api/v1/tasks/batch/complete",
        json={"task_ids": [1, 2, 3]}
    )
    
    assert response.status_code == 401
