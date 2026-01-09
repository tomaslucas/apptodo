"""Tests for task PATCH endpoint."""
import pytest


class TestTaskPatch:
    """Tests para actualizar tareas con PATCH."""

    def test_patch_task_success(self, authenticated_client):
        """Actualizar tarea exitosamente con PATCH."""
        # Crear tarea
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": "Título original"}
        )
        task = create_response.json()["data"]["task"]

        # Actualizar con PATCH
        response = authenticated_client.patch(
            f"/api/v1/tasks/{task['id']}",
            json={
                "title": "Título actualizado",
                "version": task["version"]
            }
        )
        
        # Esto debería fallar con 405 actualmente
        assert response.status_code == 200
        assert response.json()["data"]["task"]["title"] == "Título actualizado"

    def test_patch_task_without_version_success(self, authenticated_client):
        """Actualizar tarea exitosamente con PATCH sin enviar versión."""
        # Crear tarea
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": "Título original"}
        )
        task = create_response.json()["data"]["task"]

        # Actualizar con PATCH sin versión
        response = authenticated_client.patch(
            f"/api/v1/tasks/{task['id']}",
            json={
                "title": "Título actualizado sin versión"
            }
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["task"]["title"] == "Título actualizado sin versión"
