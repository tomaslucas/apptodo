from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.security import verify_token
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
)
from app.schemas.response import APIResponse
from app.services.auth import AuthService

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
)


@router.post(
    "/register", response_model=APIResponse, status_code=status.HTTP_201_CREATED
)
def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registrar nuevo usuario con validaciones backend."""
    try:
        user = AuthService.register_user(
            db, request.username, request.email, request.password
        )
        return APIResponse(
            status="success",
            data={"user": user, "message": "Usuario registrado exitosamente"},
            timestamp=datetime.utcnow(),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        import logging
        logging.exception("Error en registro de usuario")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar usuario: {type(e).__name__}",
        )


@router.post("/login", response_model=APIResponse)
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """Autenticar usuario con tokens segmentados."""
    result = AuthService.authenticate_user(db, request.email, request.password)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    access_token, refresh_token, user = result

    # Crear respuesta con refresh token en cookie httpOnly
    response_data = {"access_token": access_token, "token_type": "bearer", "user": user}

    api_response = APIResponse(
        status="success", data=response_data, timestamp=datetime.utcnow()
    )

    # Retornar respuesta JSON y establecer cookie httpOnly
    json_response = JSONResponse(
        content=api_response.model_dump(mode="json"), status_code=200
    )

    # Configurar cookie httpOnly con refresh token
    json_response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # Solo HTTPS en producción
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 días
    )

    return json_response


@router.post("/refresh", response_model=APIResponse)
def refresh(request: Request, db: Session = Depends(get_db)):
    """Refrescar access token usando refresh token de cookie."""

    # Obtener refresh token de la cookie
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found in cookies",
        )

    # Verificar token
    payload = verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    # Obtener ID del usuario
    try:
        user_id = int(payload.get("sub"))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    # Crear nuevo access token
    from app.core.security import create_access_token

    new_access_token = create_access_token({"sub": str(user_id)})

    return APIResponse(
        status="success",
        data={"access_token": new_access_token, "token_type": "bearer"},
        timestamp=datetime.utcnow(),
    )


@router.post("/logout", response_model=APIResponse)
def logout():
    """Cerrar sesión e invalidar refresh token."""
    response = JSONResponse(
        content=APIResponse(
            status="success",
            data={"message": "Logout successful"},
            timestamp=datetime.utcnow(),
        ).model_dump(mode="json")
    )
    response.delete_cookie("refresh_token")
    return response


@router.get("/me", response_model=APIResponse)
def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Obtener usuario actual autenticado."""

    # Obtener usuario del token
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )

    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    user_id = int(payload.get("sub"))
    user = AuthService.get_user_from_token(db, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado"
        )

    return APIResponse(
        status="success", data={"user": user}, timestamp=datetime.utcnow()
    )
