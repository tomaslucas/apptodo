"""Tests for task management endpoints."""
import pytest


class TestTaskCreate:
    """Tests para crear tareas."""

    def test_create_task_success(self, authenticated_client):
        """Crear tarea exitosamente."""
        response = authenticated_client.post(
            "/api/v1/tasks",
            json={
                "title": "Mi primera tarea",
                "description": "Descripción de la tarea",
                "priority": "alta",
                "status": "pendiente"
            }
        )
        
        assert response.status_code == 201
        assert response.json()["status"] == "success"
        assert response.json()["data"]["task"]["title"] == "Mi primera tarea"
        assert response.json()["data"]["task"]["status"] == "pendiente"

    def test_create_task_without_auth(self, client):
        """Crear tarea sin autenticación."""
        response = client.post(
            "/api/v1/tasks",
            json={
                "title": "Mi tarea",
                "description": "Descripción"
            }
        )
        
        assert response.status_code == 401

    def test_create_task_missing_title(self, authenticated_client):
        """Crear tarea sin título."""
        response = authenticated_client.post(
            "/api/v1/tasks",
            json={
                "description": "Sin título"
            }
        )
        
        assert response.status_code == 422


class TestTaskList:
    """Tests para listar tareas."""

    def test_list_tasks_empty(self, authenticated_client):
        """Listar tareas cuando no hay ninguna."""
        response = authenticated_client.get(
            "/api/v1/tasks"
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert len(response.json()["data"]["tasks"]) == 0

    def test_list_tasks_with_data(self, authenticated_client):
        """Listar tareas cuando hay tareas."""
        # Crear tarea
        authenticated_client.post(
            "/api/v1/tasks",
            json={
                "title": "Tarea 1",
                "priority": "media"
            }
        )

        authenticated_client.post(
            "/api/v1/tasks",
            json={
                "title": "Tarea 2",
                "priority": "alta"
            }
        )

        # Listar
        response = authenticated_client.get(
            "/api/v1/tasks"
        )
        
        assert response.status_code == 200
        assert len(response.json()["data"]["tasks"]) == 2

    def test_list_tasks_filter_by_priority(self, authenticated_client):
        """Listar tareas filtradas por prioridad."""
        # Crear tareas
        authenticated_client.post(
            "/api/v1/tasks",
            json={"title": "Tarea baja", "priority": "baja"}
        )

        authenticated_client.post(
            "/api/v1/tasks",
            json={"title": "Tarea alta", "priority": "alta"}
        )

        # Listar solo tareas altas
        response = authenticated_client.get(
            "/api/v1/tasks?priority=alta"
        )
        
        assert response.status_code == 200
        tasks = response.json()["data"]["tasks"]
        assert len(tasks) == 1
        assert tasks[0]["priority"] == "alta"


class TestTaskGet:
    """Tests para obtener tarea específica."""

    def test_get_task_success(self, authenticated_client):
        """Obtener tarea existente."""
        # Crear tarea
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": "Mi tarea"}
        )
        task_id = create_response.json()["data"]["task"]["id"]

        # Obtener
        response = authenticated_client.get(
            f"/api/v1/tasks/{task_id}"
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["task"]["title"] == "Mi tarea"

    def test_get_task_not_found(self, authenticated_client):
        """Obtener tarea que no existe."""
        response = authenticated_client.get(
            "/api/v1/tasks/999"
        )
        
        assert response.status_code == 404


class TestTaskUpdate:
    """Tests para actualizar tareas."""

    def test_update_task_success(self, authenticated_client):
        """Actualizar tarea exitosamente."""
        # Crear tarea
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": "Título original"}
        )
        task = create_response.json()["data"]["task"]

        # Actualizar
        response = authenticated_client.put(
            f"/api/v1/tasks/{task['id']}",
            json={
                "title": "Título actualizado",
                "status": "en_progreso",
                "version": task["version"]
            }
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["task"]["title"] == "Título actualizado"
        assert response.json()["data"]["task"]["status"] == "en_progreso"

    def test_update_task_version_mismatch(self, authenticated_client):
        """Actualizar tarea con versión incorrecta."""
        # Crear tarea
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": "Título original"}
        )
        task_id = create_response.json()["data"]["task"]["id"]

        # Actualizar
        response = authenticated_client.put(
            f"/api/v1/tasks/{task_id}",
            json={
                "title": "Título actualizado",
                "version": 999  # Versión incorrecta
            }
        )
        
        assert response.status_code == 409  # Conflict


class TestTaskDelete:
    """Tests para eliminar tareas (soft delete)."""

    def test_delete_task_success(self, authenticated_client):
        """Eliminar tarea exitosamente."""
        # Crear tarea
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": "Tarea a eliminar"}
        )
        task_id = create_response.json()["data"]["task"]["id"]

        # Eliminar
        response = authenticated_client.delete(
            f"/api/v1/tasks/{task_id}"
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["task"]["deleted_at"] is not None

    def test_delete_task_not_found(self, authenticated_client):
        """Eliminar tarea que no existe."""
        response = authenticated_client.delete(
            "/api/v1/tasks/999"
        )
        
        assert response.status_code == 404


class TestTaskRestore:
    """Tests para restaurar tareas eliminadas."""

    def test_restore_task_success(self, authenticated_client):
        """Restaurar tarea eliminada."""
        # Crear y eliminar tarea
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": "Tarea a restaurar"}
        )
        task_id = create_response.json()["data"]["task"]["id"]

        authenticated_client.delete(
            f"/api/v1/tasks/{task_id}"
        )

        # Restaurar
        response = authenticated_client.patch(
            f"/api/v1/tasks/{task_id}/restore"
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["task"]["deleted_at"] is None


class TestTaskComplete:
    """Tests para completar tareas."""

    def test_complete_task_success(self, authenticated_client):
        """Completar tarea exitosamente."""
        # Crear tarea
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={"title": "Tarea a completar"}
        )
        task_id = create_response.json()["data"]["task"]["id"]

        # Completar
        response = authenticated_client.patch(
            f"/api/v1/tasks/{task_id}/complete"
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["task"]["status"] == "completada"
        assert response.json()["data"]["task"]["completed_at"] is not None
