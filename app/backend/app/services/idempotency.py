from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.task import IdempotencyKey
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import json


class IdempotencyService:
    """Servicio para gestionar claves de idempotencia."""

    @staticmethod
    def get_cached_response(
        db: Session,
        user_id: int,
        idempotency_key: str
    ) -> Optional[dict]:
        """Obtener respuesta cacheada si existe."""
        cached = db.query(IdempotencyKey).filter(
            and_(
                IdempotencyKey.user_id == user_id,
                IdempotencyKey.idempotency_key == idempotency_key,
                IdempotencyKey.expires_at > datetime.utcnow()
            )
        ).first()
        
        if cached and cached.response_data:
            return {
                "status_code": cached.status_code,
                "response_data": cached.response_data
            }
        
        return None

    @staticmethod
    def cache_response(
        db: Session,
        user_id: int,
        idempotency_key: str,
        request_hash: str,
        response_data: dict,
        status_code: int,
        ttl_minutes: int = 1440  # 24 horas
    ) -> IdempotencyKey:
        """Cachear respuesta de una operación."""
        expires_at = datetime.utcnow() + timedelta(minutes=ttl_minutes)
        
        # Limpiar claves expiradas del mismo usuario
        db.query(IdempotencyKey).filter(
            and_(
                IdempotencyKey.user_id == user_id,
                IdempotencyKey.expires_at <= datetime.utcnow()
            )
        ).delete()
        
        # Crear nueva entrada
        cached = IdempotencyKey(
            user_id=user_id,
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            response_data=response_data,
            status_code=status_code,
            expires_at=expires_at
        )
        
        db.add(cached)
        db.commit()
        db.refresh(cached)
        
        return cached

    @staticmethod
    def compute_request_hash(body: dict) -> str:
        """Computar hash del request body."""
        body_str = json.dumps(body, sort_keys=True)
        return hashlib.sha256(body_str.encode()).hexdigest()

    @staticmethod
    def validate_idempotency_key(key: str) -> bool:
        """Validar formato de idempotency key (debe ser UUID o string válido)."""
        if not key or len(key) == 0:
            return False
        if len(key) > 255:
            return False
        return True
