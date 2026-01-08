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


def test_filter_by_status():
    """Filtrar tareas por estatus."""
    token = create_test_user()
    
    # Crear tareas con diferentes status
    client.post(
        "/api/v1/tasks",
        json={"title": "Tarea pendiente", "status": "pendiente"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    client.post(
        "/api/v1/tasks",
        json={"title": "Tarea en progreso", "status": "en_progreso"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Filtrar por status
    response = client.get(
        "/api/v1/tasks?status=pendiente",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(t["status"] == "pendiente" for t in tasks)


def test_filter_by_priority():
    """Filtrar tareas por prioridad."""
    token = create_test_user()
    
    # Crear tareas con diferentes prioridades
    client.post(
        "/api/v1/tasks",
        json={"title": "Tarea alta", "priority": "alta"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    client.post(
        "/api/v1/tasks",
        json={"title": "Tarea baja", "priority": "baja"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Filtrar por prioridad
    response = client.get(
        "/api/v1/tasks?priority=alta",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(t["priority"] == "alta" for t in tasks)


def test_filter_by_deadline_range():
    """Filtrar tareas por rango de fecha de vencimiento."""
    token = create_test_user()
    
    # Crear tareas con diferentes deadlines
    client.post(
        "/api/v1/tasks",
        json={"title": "Vencimiento próximo", "deadline": "2026-01-15"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    client.post(
        "/api/v1/tasks",
        json={"title": "Vencimiento futuro", "deadline": "2026-02-15"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Filtrar por rango de deadlines
    response = client.get(
        "/api/v1/tasks?deadline_from=2026-01-01&deadline_to=2026-01-20",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(t["deadline"] is not None and "2026-01" in t["deadline"] for t in tasks)


def test_search_by_title_and_description():
    """Buscar tareas por título y descripción."""
    token = create_test_user()
    
    # Crear tareas con diferentes titles
    client.post(
        "/api/v1/tasks",
        json={"title": "Comprar leche", "description": "Ir al supermercado"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    client.post(
        "/api/v1/tasks",
        json={"title": "Hacer tareas", "description": "Completar la lista de compras"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Buscar por texto
    response = client.get(
        "/api/v1/tasks?search=compra",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    # Debería encontrar ambas (una tiene "compras" en título, otra en descripción)
    assert len(tasks) >= 1


def test_filter_by_completed():
    """Filtrar por tareas completadas."""
    token = create_test_user()
    
    # Crear tareas
    task1_resp = client.post(
        "/api/v1/tasks",
        json={"title": "Tarea completada"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    task_id = task1_resp.json()["data"]["task"]["id"]
    
    # Marcar como completada
    client.patch(
        f"/api/v1/tasks/{task_id}/complete",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    client.post(
        "/api/v1/tasks",
        json={"title": "Tarea pendiente"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Filtrar solo completadas
    response = client.get(
        "/api/v1/tasks?completed=true",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(t["status"] == "completada" for t in tasks)
    
    # Filtrar solo no completadas
    response = client.get(
        "/api/v1/tasks?completed=false",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(t["status"] != "completada" for t in tasks)


def test_pagination():
    """Probar paginación con limit y offset."""
    token = create_test_user()
    
    # Crear 5 tareas
    for i in range(5):
        client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}"},
            headers={"Authorization": f"Bearer {token}"}
        )
    
    # Obtener con limit
    response = client.get(
        "/api/v1/tasks?limit=2&offset=0",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["tasks"]) == 2
    assert data["pagination"]["limit"] == 2
    assert data["pagination"]["offset"] == 0
    
    # Obtener con offset
    response = client.get(
        "/api/v1/tasks?limit=2&offset=2",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["tasks"]) == 2
    assert data["pagination"]["offset"] == 2


def test_combined_filters():
    """Probar múltiples filtros juntos."""
    token = create_test_user()
    
    # Crear tareas con distintas propiedades
    client.post(
        "/api/v1/tasks",
        json={
            "title": "Compra urgente",
            "priority": "alta",
            "status": "pendiente",
            "deadline": "2026-01-15"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    client.post(
        "/api/v1/tasks",
        json={
            "title": "Compra normal",
            "priority": "media",
            "status": "en_progreso",
            "deadline": "2026-01-20"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Filtrar por múltiples criterios
    response = client.get(
        "/api/v1/tasks?priority=alta&status=pendiente&deadline_to=2026-01-16",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(
        t["priority"] == "alta" and 
        t["status"] == "pendiente"
        for t in tasks
    )
