# AppTodo Backend

Backend FastAPI + SQLite para la aplicación de gestión de tareas.

## Setup

### Prerequisites

- UV (https://docs.astral.sh/uv/)
- Python 3.12 (managed by UV)

### Installation

```bash
# Instalar dependencias con UV (crea .venv automáticamente)
uv sync --python 3.12

# Activar ambiente virtual
source .venv/bin/activate

# Configurar variables de entorno
cp .env.example .env
# Editar .env con valores reales
```

### Running

```bash
# Modo desarrollo
uvicorn app.main:app --reload --port 8000

# Modo producción
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

La aplicación estará disponible en `http://localhost:8000`

- API Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health: `http://localhost:8000/health`
- Ready: `http://localhost:8000/ready`

## Estructura

```
app/
├── core/                    # Configuración central
│   ├── config.py           # Settings
│   ├── database.py         # Setup SQLAlchemy
│   ├── security.py         # JWT y contraseñas
├── models/                 # Modelos SQLAlchemy
│   └── user.py
├── schemas/                # Modelos Pydantic (request/response)
│   ├── user.py
│   └── response.py
├── repositories/           # Data access layer
│   └── user.py
├── services/               # Business logic layer
│   └── auth.py
├── routers/                # API endpoints
│   └── auth.py
└── main.py                 # FastAPI app
```

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /ready` - Readiness check

### Authentication
- `POST /api/v1/auth/register` - Registrar usuario
- `POST /api/v1/auth/login` - Login usuario
- `POST /api/v1/auth/refresh` - Refrescar access token
- `POST /api/v1/auth/logout` - Logout usuario
- `GET /api/v1/auth/me` - Obtener usuario actual

## Testing

```bash
pytest tests/ -v
```

## Development

Para cambios en requirements:
```bash
pip freeze > requirements.txt
```
