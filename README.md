# AppTodo - Aplicación de Tareas

**Nota IMPORTANTE**

> Esta es una aplicación de juguete hecha con agentes para practicar y aprender creándola.
> No usar en producción. No se admiten colaboraciones ni cambios.
> Úsala bajo tu responsabilidad. 

Aplicación web de gestión de tareas con autenticación.

## Stack Técnico

- **Frontend:** Vue 3 + TypeScript + Tailwind CSS
- **Backend:** FastAPI + Python 3.12 + SQLite
- **Gestión de dependencias:** UV (Python) + Bun (Node.js)

## Setup Rápido

```bash
# Instalar dependencias (solo primera vez)
cd app/backend && uv sync --python 3.12
cd app/frontend && bun install

# Iniciar servicios
./dev.sh start        # Frontend + Backend
./dev.sh stop         # Parar todo
./dev.sh status       # Ver estado
```

**Acceso:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Docker (Alternativa)

> [!NOTE]
> Si deseas migrar tu entorno actual de Docker a Setup Nativo, consulta la [Guía de Migración](DOCKER_MIGRATION.md).

```bash
docker-compose up
```

## Tests

### Backend
```bash
cd app/backend
uv run pytest
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
