import pytest


class TestAuthRegister:
    """Tests para el endpoint de registro."""

    def test_register_success(self, client):
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

    def test_register_duplicate_email(self, client):
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

    def test_register_duplicate_username(self, client):
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

    def test_register_invalid_password(self, client):
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

    def test_register_password_no_uppercase(self, client):
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

    def test_register_password_no_number(self, client):
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

    def test_register_invalid_email(self, client):
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

    def test_register_invalid_username(self, client):
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


class TestAuthLogin:
    """Tests para el endpoint de login."""

    def test_login_success(self):
        """Login exitoso."""
        # Primero registrar usuario
        client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "SecurePass123"
            }
        )
        
        # Luego hacer login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "SecurePass123"
            }
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert "access_token" in response.json()["data"]
        assert response.json()["data"]["user"]["email"] == "test@example.com"
        assert "refresh_token" in response.cookies

    def test_login_invalid_email(self):
        """Login con email no registrado."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "SecurePass123"
            }
        )
        assert response.status_code == 401
        assert "Email o contraseña incorrectos" in response.json()["detail"]

    def test_login_invalid_password(self):
        """Login con contraseña incorrecta."""
        # Registrar usuario
        client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "SecurePass123"
            }
        )
        
        # Login con contraseña incorrecta
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "WrongPassword123"
            }
        )
        assert response.status_code == 401
        assert "Email o contraseña incorrectos" in response.json()["detail"]


class TestAuthLogout:
    """Tests para el endpoint de logout."""

    def test_logout_success(self):
        """Logout exitoso."""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        # Verificar que se borra la cookie
        assert "refresh_token" not in response.cookies or response.cookies.get("refresh_token") == ""


class TestAuthMe:
    """Tests para el endpoint GET /auth/me."""

    def test_get_current_user_success(self):
        """Obtener usuario actual con token válido."""
        # Registrar y hacer login
        client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "SecurePass123"
            }
        )
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "SecurePass123"
            }
        )
        
        access_token = login_response.json()["data"]["access_token"]
        
        # Obtener usuario actual
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert response.json()["data"]["user"]["email"] == "test@example.com"

    def test_get_current_user_no_token(self):
        """Obtener usuario sin token."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401
        assert "Authorization header missing" in response.json()["detail"]

    def test_get_current_user_invalid_token(self):
        """Obtener usuario con token inválido."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]
