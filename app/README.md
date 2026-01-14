# AppTodo - Aplicación Multiusuario de Gestión de Tareas

Aplicación web completa para gestión de tareas con autenticación segura, filtros dinámicos, auditoría y atajos de teclado.

## Estructura

```
app/
├── backend/                # FastAPI + SQLite
│   ├── app/
│   │   ├── core/          # Configuración, database, security
│   │   ├── models/        # Modelos SQLAlchemy
│   │   ├── schemas/       # Modelos Pydantic
│   │   ├── repositories/  # Data access layer
│   │   ├── services/      # Business logic
│   │   ├── routers/       # API endpoints
│   │   └── main.py        # FastAPI app
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
│
└── frontend/               # Vue 3 + TypeScript + Bun
    ├── src/
    │   ├── api/           # API client
    │   ├── components/    # Vue components
    │   ├── router/        # Vue Router
    │   ├── stores/        # Pinia stores
    │   ├── views/         # Pages/views
    │   ├── App.vue
    │   └── main.ts
    ├── package.json
    ├── vite.config.ts
    └── README.md
```

## Quick Start

### Backend

```bash
cd backend
uv sync --python 3.12
uv run uvicorn app.main:app --reload --port 8000
```

API disponible en: `http://localhost:8000`

### Frontend

```bash
cd frontend
bun install
bun run dev
```

App disponible en: `http://localhost:3000`

## Documentación

- **Backend API:** `http://localhost:8000/docs` (Swagger)
- **Health Check:** `http://localhost:8000/health`
- **Readiness:** `http://localhost:8000/ready`

## Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy, SQLite
- **Frontend:** Vue 3, TypeScript, Pinia, Vue Router
- **Database:** SQLite (desarrollo)
- **Auth:** JWT (Access Token 15 min + Refresh Token 7 días)
- **Build:** Vite, Bun

## Fases de Implementación

1. ✅ Setup inicial: Python + FastAPI + SQLite
2. ✅ Backend base: auth, CRUD básico de tareas
3. ✅ Backend avanzado: filtros, categorías, batch operations
4. ✅ Frontend base: Vue setup, router, login
5. ✅ Frontend features: tareas, filtros, UI
6. ✅ Atajos de teclado
7. 🔄 Polish y optimizaciones (en progreso)
