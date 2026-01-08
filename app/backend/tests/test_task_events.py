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


def test_get_task_events():
    """Obtener eventos de una tarea."""
    token = create_test_user()
    
    # Crear una tarea
    response = client.post(
        "/api/v1/tasks",
        json={"title": "Tarea para eventos"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    task_id = response.json()["data"]["task"]["id"]
    
    # Actualizar la tarea (genera eventos)
    client.put(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Tarea actualizada", "version": 1},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Completar la tarea
    client.patch(
        f"/api/v1/tasks/{task_id}/complete",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Obtener eventos
    response = client.get(
        f"/api/v1/tasks/{task_id}/events",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["task_id"] == task_id
    assert data["total"] >= 2  # al menos: creación + actualización + completar
    assert len(data["events"]) > 0
    assert all("event_type" in e for e in data["events"])


def test_task_events_pagination():
    """Probar paginación de eventos."""
    token = create_test_user()
    
    # Crear una tarea
    response = client.post(
        "/api/v1/tasks",
        json={"title": "Tarea para paginación"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    task_id = response.json()["data"]["task"]["id"]
    
    # Generar múltiples eventos (actualizar múltiples veces)
    for i in range(3):
        client.put(
            f"/api/v1/tasks/{task_id}",
            json={"title": f"Actualización {i}", "version": i},
            headers={"Authorization": f"Bearer {token}"}
        )
    
    # Obtener con límite
    response = client.get(
        f"/api/v1/tasks/{task_id}/events?limit=2&offset=0",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["events"]) <= 2
    assert data["pagination"]["limit"] == 2
    assert data["pagination"]["offset"] == 0


def test_task_events_nonexistent_task():
    """No encontrar eventos de tarea inexistente."""
    token = create_test_user()
    
    response = client.get(
        "/api/v1/tasks/9999/events",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 404


def test_task_events_unauthorized():
    """No permitir acceso sin autenticación."""
    response = client.get("/api/v1/tasks/1/events")
    
    assert response.status_code == 401


def test_task_events_different_users():
    """No permitir que un usuario vea eventos de otro."""
    # Usuario 1 crea tarea
    token1 = create_test_user()
    response = client.post(
        "/api/v1/tasks",
        json={"title": "Tarea privada"},
        headers={"Authorization": f"Bearer {token1}"}
    )
    task_id = response.json()["data"]["task"]["id"]
    
    # Usuario 2 intenta ver eventos
    token2 = create_test_user()
    response = client.get(
        f"/api/v1/tasks/{task_id}/events",
        headers={"Authorization": f"Bearer {token2}"}
    )
    
    assert response.status_code == 404


def test_task_events_show_changes():
    """Verificar que los eventos muestren cambios."""
    token = create_test_user()
    
    # Crear tarea
    response = client.post(
        "/api/v1/tasks",
        json={"title": "Tarea original", "priority": "baja"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    task_id = response.json()["data"]["task"]["id"]
    
    # Actualizar
    client.put(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Tarea modificada", "priority": "alta", "version": 1},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Obtener eventos
    response = client.get(
        f"/api/v1/tasks/{task_id}/events",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    events = response.json()["data"]["events"]
    
    # Buscar evento de actualización
    update_events = [e for e in events if e["event_type"] == "task_updated"]
    assert len(update_events) > 0
    
    # Verificar que contiene cambios
    event = update_events[0]
    if event.get("old_state") and event.get("new_state"):
        assert event["old_state"].get("priority") != event["new_state"].get("priority")
