# AppTodo - Aplicación de Tareas

Aplicación web de gestión de tareas con autenticación, filtros dinámicos y atajos de teclado.

## Stack Técnico

- **Frontend:** Vue 3 + TypeScript + Tailwind CSS
- **Backend:** FastAPI + Python 3.12 + SQLite
- **Gestión de dependencias:** UV (Python) + Bun (Node.js)

## Setup Rápido

### Opción 1: Desarrollo Nativo (Recomendado)

**Backend:**
```bash
cd app/backend
uv sync --python 3.12
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd app/frontend
bun install
bun run dev
```

**Acceso:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Opción 2: Docker (Alternativa)

> [!NOTE]
> Si deseas migrar tu entorno actual de Docker a Setup Nativo, consulta la [Guía de Migración](DOCKER_MIGRATION.md).

```bash
docker-compose up
```

## Tests

### Backend
```bash
cd app/backend
source .venv/bin/activate
pytest
```

### Frontend
```bash
cd app/frontend
bun run test        # Unit tests
bun run lint        # Linting
bun run type-check  # TypeScript check
```

## Estructura del Proyecto

```
apptodo/
├── app/
│   ├── backend/      # FastAPI + SQLAlchemy
│   └── frontend/     # Vue 3 SPA
├── specs/            # Documentación técnica
└── docker-compose.yml
```

## Documentación

- [PLAN.md](specs/PLAN.md) - Arquitectura y especificaciones completas
- [SIMPLIFICATION_PLAN.md](specs/SIMPLIFICATION_PLAN.md) - Configuración de desarrollo simplificada

## CI/CD

El pipeline ejecuta automáticamente:
- Tests de backend (pytest, linting)
- Tests de frontend (vitest, type-check, linting)

**Nota:** Esta es una aplicación de desarrollo local. No hay deploy automático configurado.
