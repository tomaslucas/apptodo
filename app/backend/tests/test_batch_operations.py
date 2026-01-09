import pytest


def test_batch_complete_tasks(authenticated_client):
    """Completar múltiples tareas."""
    # Crear 3 tareas
    task_ids = []
    for i in range(3):
        response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}"}
        )
        task_ids.append(response.json()["data"]["task"]["id"])

    # Completar todas
    response = authenticated_client.post(
        "/api/v1/tasks/batch/complete",
        json={"task_ids": task_ids}
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 3
    assert data["total_requested"] == 3

    # Verificar que están completadas
    for task_id in task_ids:
        response = authenticated_client.get(f"/api/v1/tasks/{task_id}")
        assert response.json()["data"]["task"]["status"] == "completada"


def test_batch_delete_tasks(authenticated_client):
    """Eliminar múltiples tareas (soft delete)."""
    # Crear 3 tareas
    task_ids = []
    for i in range(3):
        response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}"}
        )
        task_ids.append(response.json()["data"]["task"]["id"])

    # Eliminar todas
    response = authenticated_client.post(
        "/api/v1/tasks/batch/delete",
        json={"task_ids": task_ids}
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 3
    assert data["total_requested"] == 3


def test_batch_restore_tasks(authenticated_client):
    """Restaurar múltiples tareas eliminadas."""
    # Crear 3 tareas
    task_ids = []
    for i in range(3):
        response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}"}
        )
        task_ids.append(response.json()["data"]["task"]["id"])

    # Eliminar todas
    authenticated_client.post(
        "/api/v1/tasks/batch/delete",
        json={"task_ids": task_ids}
    )

    # Restaurar todas
    response = authenticated_client.post(
        "/api/v1/tasks/batch/restore",
        json={"task_ids": task_ids}
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 3
    assert data["total_requested"] == 3


def test_batch_update_tasks(authenticated_client):
    """Actualizar múltiples tareas."""
    # Crear 3 tareas
    task_ids = []
    for i in range(3):
        response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}", "priority": "baja"}
        )
        task_ids.append(response.json()["data"]["task"]["id"])

    # Actualizar prioridad
    response = authenticated_client.patch(
        "/api/v1/tasks/batch/update",
        json={"task_ids": task_ids, "priority": "alta"}
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 3
    assert data["total_requested"] == 3
    assert data["fields_updated"]["priority"] == "alta"

    # Verificar que se actualizaron
    for task_id in task_ids:
        response = authenticated_client.get(f"/api/v1/tasks/{task_id}")
        assert response.json()["data"]["task"]["priority"] == "alta"


def test_batch_update_status(authenticated_client):
    """Actualizar estado de múltiples tareas."""
    # Crear 2 tareas
    task_ids = []
    for i in range(2):
        response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": f"Tarea {i}"}
        )
        task_ids.append(response.json()["data"]["task"]["id"])

    # Actualizar estado a en_progreso
    response = authenticated_client.patch(
        "/api/v1/tasks/batch/update",
        json={"task_ids": task_ids, "status": "en_progreso"}
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 2
    assert data["fields_updated"]["status"] == "en_progreso"


def test_batch_empty_request(authenticated_client):
    """No permitir batch con lista vacía."""
    # Intentar con lista vacía
    response = authenticated_client.post(
        "/api/v1/tasks/batch/complete",
        json={"task_ids": []}
    )

    # Debería fallar validación
    assert response.status_code == 422


def test_batch_nonexistent_tasks(authenticated_client):
    """Batch con tareas inexistentes."""
    # Intentar completar tareas que no existen
    response = authenticated_client.post(
        "/api/v1/tasks/batch/complete",
        json={"task_ids": [9999, 10000]}
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated"] == 0
    assert data["total_requested"] == 2


def test_batch_without_auth(client):
    """No permitir batch sin autenticación."""
    response = client.post(
        "/api/v1/tasks/batch/complete",
        json={"task_ids": [1, 2, 3]}
    )

    assert response.status_code == 401
