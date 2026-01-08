from fastapi import Request, HTTPException, status
from functools import wraps
from app.services.idempotency import IdempotencyService
from app.schemas.user import UserResponse
from sqlalchemy.orm import Session
import json


async def check_idempotency(
    request: Request,
    user: UserResponse,
    db: Session,
    body: dict
) -> dict:
    """
    Verificar y gestionar idempotencia para requests.
    Retorna respuesta cacheada si existe, o None si no.
    """
    # Obtener idempotency key del header
    idempotency_key = request.headers.get("Idempotency-Key")
    
    # Validar que el key sea válido
    if not idempotency_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idempotency-Key header is required for mutable operations"
        )
    
    if not IdempotencyService.validate_idempotency_key(idempotency_key):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Idempotency-Key format"
        )
    
    # Computar hash del request
    request_hash = IdempotencyService.compute_request_hash(body)
    
    # Buscar respuesta cacheada
    cached = IdempotencyService.get_cached_response(db, user.id, idempotency_key)
    
    if cached:
        # Retornar respuesta cacheada
        return cached
    
    return None


def cache_response(
    user: UserResponse,
    db: Session,
    idempotency_key: str,
    request_hash: str,
    response_data: dict,
    status_code: int
):
    """Cachear respuesta para operación idempotente."""
    IdempotencyService.cache_response(
        db=db,
        user_id=user.id,
        idempotency_key=idempotency_key,
        request_hash=request_hash,
        response_data=response_data,
        status_code=status_code
    )
