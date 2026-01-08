import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app.core.config import settings
from app.models.user import Base

# Configurar la base de datos SQLite
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Para SQLite en desarrollo, usar StaticPool para evitar problemas con threading
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Obtener sesión de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Inicializar la base de datos creando todas las tablas."""
    Base.metadata.create_all(bind=engine)


def get_engine():
    """Obtener engine de SQLAlchemy."""
    return engine
