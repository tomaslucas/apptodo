import pytest


def test_filter_by_status(authenticated_client):
    """Filtrar tareas por estatus."""
    # Crear tareas con diferentes status
    authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Tarea pendiente", "status": "pendiente"}
    )

    authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Tarea en progreso", "status": "en_progreso"}
    )

    # Filtrar por status
    response = authenticated_client.get("/api/v1/tasks?status=pendiente")

    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(t["status"] == "pendiente" for t in tasks)


def test_filter_by_priority(authenticated_client):
    """Filtrar tareas por prioridad."""
    # Crear tareas con diferentes prioridades
    authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Tarea alta", "priority": "alta"}
    )

    authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Tarea baja", "priority": "baja"}
    )

    # Filtrar por prioridad
    response = authenticated_client.get("/api/v1/tasks?priority=alta")

    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(t["priority"] == "alta" for t in tasks)


def test_filter_by_deadline_range(authenticated_client):
    """Filtrar tareas por rango de fecha de vencimiento."""
    # Crear tareas con diferentes deadlines
    authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Vencimiento próximo", "deadline": "2026-01-15"},
    )

    authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Vencimiento futuro", "deadline": "2026-02-15"},
    )

    # Filtrar por rango de deadlines
    response = authenticated_client.get(
        "/api/v1/tasks?deadline_from=2026-01-01&deadline_to=2026-01-20",
    )

    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(t["deadline"] is not None and "2026-01" in t["deadline"] for t in tasks)


def test_search_by_title_and_description(authenticated_client):
    """Buscar tareas por título y descripción."""
    # Crear tareas con diferentes titles
    authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Comprar leche", "description": "Ir al supermercado"},
    )

    authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Hacer tareas", "description": "Completar la lista de compras"},
    )

    # Buscar por texto
    response = authenticated_client.get(
        "/api/v1/tasks?search=compra",
    )

    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    # Debería encontrar ambas (una tiene "compras" en título, otra en descripción)
    assert len(tasks) >= 1


def test_filter_by_completed(authenticated_client):
    """Filtrar por tareas completadas."""
    # Crear tareas
    task1_resp = authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Tarea completada"},
    )

    task_id = task1_resp.json()["data"]["task"]["id"]

    # Marcar como completada
    authenticated_client.patch(
        f"/api/v1/tasks/{task_id}/complete",
    )

    authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Tarea pendiente"},
    )

    # Filtrar solo completadas
    response = authenticated_client.get(
        "/api/v1/tasks?completed=true",
    )

    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(t["status"] == "completada" for t in tasks)

    # Filtrar solo no completadas
    response = authenticated_client.get(
        "/api/v1/tasks?completed=false",
    )

    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(t["status"] != "completada" for t in tasks)


def test_pagination(authenticated_client):
    """Probar paginación con limit y offset."""
    # Crear 5 tareas
    for i in range(5):
        authenticated_client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}"},
        )

    # Obtener con limit
    response = authenticated_client.get(
        "/api/v1/tasks?limit=2&offset=0",
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["tasks"]) == 2
    assert data["pagination"]["limit"] == 2
    assert data["pagination"]["offset"] == 0

    # Obtener con offset
    response = authenticated_client.get(
        "/api/v1/tasks?limit=2&offset=2",
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["tasks"]) == 2
    assert data["pagination"]["offset"] == 2


def test_combined_filters(authenticated_client):
    """Probar múltiples filtros juntos."""
    # Crear tareas con distintas propiedades
    authenticated_client.post(
        "/api/v1/tasks",
        json={
            "title": "Compra urgente",
            "priority": "alta",
            "status": "pendiente",
            "deadline": "2026-01-15"
        },
    )

    authenticated_client.post(
        "/api/v1/tasks",
        json={
            "title": "Compra normal",
            "priority": "media",
            "status": "en_progreso",
            "deadline": "2026-01-20"
        },
    )

    # Filtrar por múltiples criterios
    response = authenticated_client.get(
        "/api/v1/tasks?priority=alta&status=pendiente&deadline_to=2026-01-16",
    )

    assert response.status_code == 200
    tasks = response.json()["data"]["tasks"]
    assert all(
        t["priority"] == "alta" and
        t["status"] == "pendiente"
        for t in tasks
    )
