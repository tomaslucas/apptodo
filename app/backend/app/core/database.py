from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app.core.config import settings

# Importar todos los modelos para registrarlos con Base
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
    # Crear tablas desde SQLAlchemy models
    Base.metadata.create_all(bind=engine)

    # Ejecutar SQL de inicialización
    migration_file = (
        Path(__file__).parent.parent.parent / "migrations" / "001_initial_schema.sql"
    )
    if migration_file.exists():
        with open(migration_file, "r") as f:
            sql_script = f.read()
            with engine.connect() as connection:
                # SQLite no soporta múltiples statements en un solo execute
                # Dividir por ; y ejecutar cada uno
                statements = [
                    stmt.strip() for stmt in sql_script.split(";") if stmt.strip()
                ]
                for statement in statements:
                    try:
                        connection.execute(text(statement))
                    except Exception as e:
                        # Algunos statements pueden fallar si ya existen
                        # Ignorar errores de "already exists"
                        if "already exists" not in str(e):
                            print(f"Warning executing migration: {e}")
                connection.commit()


def get_engine():
    """Obtener engine de SQLAlchemy."""
    return engine
