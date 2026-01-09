import pytest


def test_get_task_events(authenticated_client):
    """Obtener eventos de una tarea."""
    # Crear una tarea
    response = authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Tarea para eventos"}
    )

    task_id = response.json()["data"]["task"]["id"]

    # Actualizar la tarea (genera eventos)
    authenticated_client.put(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Tarea actualizada", "version": 1}
    )

    # Completar la tarea
    authenticated_client.patch(
        f"/api/v1/tasks/{task_id}/complete"
    )

    # Obtener eventos
    response = authenticated_client.get(
        f"/api/v1/tasks/{task_id}/events"
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["task_id"] == task_id
    assert data["total"] >= 2  # al menos: creación + actualización + completar
    assert len(data["events"]) > 0
    assert all("event_type" in e for e in data["events"])


def test_task_events_pagination(authenticated_client):
    """Probar paginación de eventos."""
    # Crear una tarea
    response = authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Tarea para paginación"}
    )

    task_id = response.json()["data"]["task"]["id"]

    # Generar múltiples eventos (actualizar múltiples veces)
    for i in range(3):
        authenticated_client.put(
            f"/api/v1/tasks/{task_id}",
            json={"title": f"Actualización {i}", "version": i}
        )

    # Obtener con límite
    response = authenticated_client.get(
        f"/api/v1/tasks/{task_id}/events?limit=2&offset=0"
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["events"]) <= 2
    assert data["pagination"]["limit"] == 2
    assert data["pagination"]["offset"] == 0


def test_task_events_nonexistent_task(authenticated_client):
    """No encontrar eventos de tarea inexistente."""
    response = authenticated_client.get("/api/v1/tasks/9999/events")
    
    assert response.status_code == 404


def test_task_events_unauthorized(client):
    """No permitir acceso sin autenticación."""
    response = client.get("/api/v1/tasks/1/events")
    
    assert response.status_code == 401


def test_task_events_different_users(client):
    """No permitir que un usuario vea eventos de otro."""
    # Usuario 1 crea tarea
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "user1",
            "email": "user1@example.com",
            "password": "SecurePass123"
        }
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user1@example.com", "password": "SecurePass123"}
    )
    token1 = response.json()["data"]["access_token"]
    
    response = client.post(
        "/api/v1/tasks",
        json={"title": "Tarea privada"},
        headers={"Authorization": f"Bearer {token1}"}
    )
    task_id = response.json()["data"]["task"]["id"]
    
    # Usuario 2 intenta ver eventos
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "user2",
            "email": "user2@example.com",
            "password": "SecurePass123"
        }
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user2@example.com", "password": "SecurePass123"}
    )
    token2 = response.json()["data"]["access_token"]
    
    response = client.get(
        f"/api/v1/tasks/{task_id}/events",
        headers={"Authorization": f"Bearer {token2}"}
    )
    
    assert response.status_code == 404


def test_task_events_show_changes(authenticated_client):
    """Verificar que los eventos muestren cambios."""
    # Crear tarea
    response = authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Tarea original", "priority": "baja"}
    )
    
    task_id = response.json()["data"]["task"]["id"]
    
    # Actualizar
    authenticated_client.put(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Tarea modificada", "priority": "alta", "version": 1}
    )
    
    # Obtener eventos
    response = authenticated_client.get(
        f"/api/v1/tasks/{task_id}/events"
    )
    
    events = response.json()["data"]["events"]
    
    # Buscar evento de actualización
    update_events = [e for e in events if e["event_type"] == "task_updated"]
    assert len(update_events) > 0
    
    # Verificar que contiene cambios
    event = update_events[0]
    if event.get("old_state") and event.get("new_state"):
        assert event["old_state"].get("priority") != event["new_state"].get("priority")
