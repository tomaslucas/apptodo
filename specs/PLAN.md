# Plan: Aplicación de To-Do Multiusuario

## 1. Visión General

Aplicación web de gestión de tareas con autenticación segura, filtros dinámicos, auditoría completa y atajos de teclado para máxima productividad.

**Stack:**
- **Frontend:** Vue 3 + TypeScript + Bun + Vue Router (en `/app/frontend`)
- **Backend:** Python 3.12 + FastAPI + SQLite (en `/app/backend`)
- **Arquitectura:** SPA con rutas, dashboard único con filtros dinámicos, APIs versionadas

---

## 2. Arquitectura de Datos

### Convenciones de Dominio

- **status:** `pendiente` | `en_progreso` | `completada` (enums de dominio)
- **priority:** `baja` | `media` | `alta` (enums de dominio)

Estos valores se validan tanto en frontend como en backend.

### Base de Datos (SQLite)

#### Tabla: `users`
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

#### Tabla: `tasks`
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'media' CHECK(priority IN ('baja', 'media', 'alta')),
  deadline DATE,
  status TEXT DEFAULT 'pendiente' CHECK(status IN ('pendiente', 'en_progreso', 'completada')),
  recurrence_rule TEXT,
  completed_at TIMESTAMP,
  deleted_at TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para filtros y rendimiento
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_deadline ON tasks(user_id, deadline);
```

#### Tabla: `categories`
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
```

#### Tabla: `task_categories` (relación M2M)
```sql
CREATE TABLE task_categories (
  task_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (task_id, category_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

#### Tabla: `refresh_tokens` (para autenticación segura)
```sql
CREATE TABLE refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

#### Tabla: `task_events` (Auditoría y Event Sourcing)
```sql
CREATE TABLE task_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK(
    event_type IN (
      'task_created', 'task_updated', 'task_completed',
      'task_deleted', 'task_restored', 'priority_changed',
      'deadline_changed', 'status_changed', 'category_added',
      'category_removed'
    )
  ),
  old_state JSON,
  new_state JSON,
  payload JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_events_task_id ON task_events(task_id);
CREATE INDEX idx_task_events_user_id ON task_events(user_id);
CREATE INDEX idx_task_events_event_type ON task_events(event_type);
CREATE INDEX idx_task_events_created_at ON task_events(created_at);
```

#### Tabla: `idempotency_keys` (Prevención de Duplicados)
```sql
CREATE TABLE idempotency_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  request_hash TEXT,
  response_data JSON,
  status_code INTEGER,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_idempotency_keys_user_id ON idempotency_keys(user_id);
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);
```

---

## 3. API Backend (Python + FastAPI)

### Versioning y Convenciones

Todos los endpoints están versionados con `/api/v1/`. Respuestas siempre en JSON con estructura:

```json
{
  "status": "success|error",
  "data": {},
  "error": null,
  "timestamp": "2026-01-08T10:30:00Z"
}
```

### Health & Status

```
GET /health       → { status: "ok", version: "1.0.0" }
GET /ready        → { status: "ready", checks: { database: "ok" } }
                    (503 si DB no responde)
```

### Autenticación

#### Tokens
- **Access Token:** JWT corto (15 min), en memoria (frontend)
- **Refresh Token:** Largo (7 días), en cookie `httpOnly`

```
POST /api/v1/auth/register
POST /api/v1/auth/login          → { access_token, user }
POST /api/v1/auth/refresh        → { access_token }
POST /api/v1/auth/logout         → invalida refresh token
GET  /api/v1/auth/me             → usuario actual
```

#### Idempotencia
Todos los endpoints mutables requieren header:
```
Header: Idempotency-Key: <UUID>
```
Si el mismo key se recibe 2 veces → retorna resultado anterior (cached)

### Tareas (CRUD)

```
GET    /api/v1/tasks             - Obtener tareas (con filtros)
GET    /api/v1/tasks/:id         - Obtener tarea específica
POST   /api/v1/tasks             - Crear nueva tarea
PUT    /api/v1/tasks/:id         - Actualizar tarea (con optimistic locking)
DELETE /api/v1/tasks/:id         - Soft delete (marca deleted_at)
PATCH  /api/v1/tasks/:id/restore - Restaurar tarea eliminada
```

#### Parámetros de filtro y paginación
```
GET /api/v1/tasks
  ?limit=50                 (default: 1000, cursor-based)
  &cursor=opaque_string     (opcional)
  &status=pendiente
  &priority=alta
  &deadline_from=2026-01-15&deadline_to=2026-02-15
  &category_id=1,2,3
  &search=palabra_clave
  &include_deleted=false
  &sort=deadline&order=asc
```

Respuesta cursor-based:
```json
{
  "status": "success",
  "data": {
    "tasks": [...],
    "pagination": {
      "limit": 50,
      "next_cursor": "abc123xyz",
      "has_more": true
    }
  }
}
```

#### Acciones batch
```
POST /api/v1/tasks/batch/complete   - Marcar múltiples como completadas
POST /api/v1/tasks/batch/delete      - Soft delete múltiples
POST /api/v1/tasks/batch/priority    - Cambiar prioridad a múltiples
```

### Categorías

```
GET    /api/v1/categories        - Obtener todas las categorías
POST   /api/v1/categories        - Crear categoría
PUT    /api/v1/categories/:id    - Actualizar categoría
DELETE /api/v1/categories/:id    - Eliminar categoría
```

### Errores y Validación

Códigos HTTP:
- `200` - OK
- `201` - Created
- `400` - Bad Request (validación fallida)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (optimistic locking fallido)
- `500` - Server Error

Respuesta de error:
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripción del error",
    "details": { "field": "mensaje" }
  }
}
```

---

## 4. Estructura del Proyecto

```
/
├── /app
│   ├── /frontend                    # Vue 3 + TypeScript + Bun
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── TaskForm.vue           # Formulario crear/editar
│   │   │   │   ├── TaskList.vue           # Lista filtrada
│   │   │   │   ├── TaskItem.vue           # Item individual
│   │   │   │   ├── TaskBulkActions.vue    # Acciones batch
│   │   │   │   ├── FilterBar.vue          # Barra de filtros dinámicos
│   │   │   │   ├── CategoryBadge.vue      # Badge de categoría
│   │   │   │   └── AuthForm.vue           # Login/Register
│   │   │   ├── views/
│   │   │   │   ├── LoginView.vue
│   │   │   │   ├── DashboardView.vue      # Vista principal
│   │   │   │   └── NotFoundView.vue
│   │   │   ├── stores/
│   │   │   │   ├── authStore.ts           # Pinia: autenticación
│   │   │   │   └── taskStore.ts           # Pinia: tareas raw + filtros
│   │   │   ├── services/
│   │   │   │   ├── api.ts                 # Cliente HTTP (interceptores)
│   │   │   │   ├── auth.ts                # Servicios de auth
│   │   │   │   └── task.ts                # Servicios de tareas
│   │   │   ├── utils/
│   │   │   │   └── shortcuts.ts           # Atajos de teclado
│   │   │   ├── types/
│   │   │   │   ├── Task.ts
│   │   │   │   ├── User.ts
│   │   │   │   ├── Category.ts
│   │   │   │   └── Api.ts
│   │   │   ├── App.vue
│   │   │   ├── main.ts
│   │   │   └── router.ts
│   │   ├── package.json
│   │   └── bunfig.toml
│   │
│   └── /backend                     # Python 3.12 + FastAPI + SQLite
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py              # FastAPI app
│       │   ├── database.py           # SQLite setup
│       │   ├── config.py             # Settings
│       │   ├── routes/
│       │   │   ├── auth.py
│       │   │   ├── tasks.py
│       │   │   └── categories.py
│       │   ├── services/
│       │   │   ├── auth_service.py
│       │   │   ├── task_service.py
│       │   │   └── category_service.py
│       │   ├── repositories/
│       │   │   ├── user_repository.py
│       │   │   ├── task_repository.py
│       │   │   └── category_repository.py
│       │   ├── models/
│       │   │   ├── user.py
│       │   │   ├── task.py
│       │   │   └── category.py
│       │   ├── schemas/
│       │   │   ├── user.py
│       │   │   ├── task.py
│       │   │   └── category.py
│       │   └── utils/
│       │       ├── security.py
│       │       ├── dependencies.py
│       │       └── validators.py
│       ├── tests/
│       │   ├── test_auth.py
│       │   ├── test_tasks.py
│       │   └── test_categories.py
│       ├── migrations/              # Esquema inicial
│       │   └── init.sql
│       ├── requirements.txt
│       ├── .env.example
│       └── README.md
│
├── specs/
│   └── PLAN.md
└── SETUP.md                         # Instrucciones de inicialización
```

---

## 5. Estructura Frontend (Vue 3 + TypeScript)

### Store (Pinia)

**taskStore** (Dominio)
- `tasks`: array de tareas (raw, sin filtrar)
- `filters`: objeto con estado de filtros activos
- **computed:** `visibleTasks` (tareas filtradas en memoria)
- Métodos: fetchTasks, createTask, updateTask, deleteTask, etc.

```ts
// En el componente:
const visibleTasks = computed(() => taskStore.getFilteredTasks())
```

**authStore** (Dominio)
- `user`: usuario actual
- `isAuthenticated`: boolean
- Métodos: login, logout, refresh

**uiStore** (Estado UI - NUEVO)
- `selectedTaskIds`: IDs de tareas seleccionadas (para batch)
- `focusedTaskId`: tarea con foco (para navegación)
- `modals`: estado de modales (create, edit, delete confirm)
- `shortcuts`: estado de shortcuts activos
- Métodos: selectTask, toggleSelect, openModal, closeModal, etc.

**Separación:**
- taskStore = sin estado UI
- uiStore = sin lógica de dominio
- Mejor performance + testabilidad

### Componentes Clave

1. **TaskForm.vue** - Modal/inline para crear/editar tareas
2. **FilterBar.vue** - Filtros dinámicos (status, priority, deadline, categoría, búsqueda)
3. **TaskList.vue** - Renderiza lista filtrada, permite drag-drop (opcional)
4. **TaskItem.vue** - Card individual, muestra todos los campos

---

## 6. Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+K` (o `Cmd+K`) | Abrir formulario de nueva tarea |
| `E` (tarea seleccionada) | Editar tarea |
| `D` (tarea seleccionada) | Soft delete con confirmación |
| `Shift+D` (tarea seleccionada) | Restaurar tarea eliminada |
| `Space` (tarea seleccionada) | Marcar como completada/pendiente |
| `1, 2, 3` (tarea seleccionada) | Cambiar prioridad a baja, media, alta |
| `Shift + ↑ ↓` | Selección múltiple |
| `B` (tareas seleccionadas) | Menú de acciones batch |
| `Escape` | Cerrar modal/formulario o deseleccionar |
| `↑ ↓` | Navegar entre tareas |

---

## 7. Filtros Dinámicos en Dashboard

Los filtros se aplican **en memoria** en el frontend una vez las tareas están cargadas. El backend expone endpoints para pre-filtrar si es necesario.

**Estados:**
- Pendiente
- En progreso
- Completada
- Mostrar/ocultar eliminadas

**Prioridades:**
- Baja
- Media
- Alta

**Fecha límite:**
- Hoy
- Esta semana
- Este mes
- Rango personalizado (desde-hasta)

**Categorías:**
- Selector múltiple con checkboxes

**Búsqueda:**
- Input de texto (busca en título y descripción, en tiempo real)

**Ordenamiento:**
- Por deadline
- Por prioridad
- Por fecha de creación

---

## 8. Flujo de Autenticación (Seguro)

1. Usuario no autenticado → LoginView
2. POST `/api/v1/auth/login` → backend retorna:
   - `access_token` (JWT corto, 15 min)
   - `user` (datos del usuario)
3. Frontend guarda `access_token` en memoria (variable)
4. Backend guarda `refresh_token` en cookie `httpOnly` (automático)
5. Cada request incluye `Authorization: Bearer <access_token>` (interceptor)
6. Token expirado → POST `/api/v1/auth/refresh` (automático con interceptor)
7. Logout → POST `/api/v1/auth/logout` → invalida refresh token → localStorage limpio → LoginView
8. Browser cierra → access token perdido (seguro)

---

## 9. Inicialización y Setup

### Backend

```bash
cd /app/backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.database  # Ejecuta migrations/init.sql
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd /app/frontend
bun install
bun run dev
```

La app estará en `http://localhost:5173` (dev) con API en `http://localhost:8000/api/v1/`.

---

## 10. Fases de Implementación

### Fase 1: Backend Base
- [ ] Setup Python + FastAPI + SQLite
- [ ] Estructura por capas (routers, services, repositories)
- [ ] Migrations (init.sql)
- [ ] Endpoints de autenticación (register, login, refresh, logout)
- [ ] CRUD básico de tareas (sin filtros complejos aún)
- [ ] Soft delete implementado

### Fase 2: Backend Avanzado
- [ ] Endpoints de filtros complejos
- [ ] Gestión de categorías
- [ ] Acciones batch
- [ ] Validaciones de negocio
- [ ] Manejo de errores robusto
- [ ] Interceptores de autenticación

### Fase 2.5: Backend Testing
- [ ] Tests unitarios de servicios
- [ ] Tests de filtros complejos
- [ ] Tests de validación y errores
- [ ] Cobertura mínima 80%

### Fase 3: Frontend Base
- [ ] Setup Vue + TypeScript + Bun
- [ ] Router configuration (rutas básicas)
- [ ] LoginView + AuthForm
- [ ] DashboardView estructura
- [ ] Interceptor de API para refresh tokens
- [ ] Store de autenticación (Pinia)

### Fase 4: Frontend Features
- [ ] Store de tareas (Pinia) con computed para filtros
- [ ] TaskForm, TaskList, TaskItem
- [ ] FilterBar dinámico
- [ ] Integración completa con API
- [ ] Selección múltiple y acciones batch
- [ ] Soft delete y restore

### Fase 4.5: Frontend Testing
- [ ] Tests de componentes principales
- [ ] Tests de stores (Pinia)
- [ ] Tests de integración API
- [ ] Cobertura mínima 70%

### Fase 5: Atajos de Teclado
- [ ] Gestor de shortcuts centralizado
- [ ] Todos los atajos implementados (9 atajos)
- [ ] Context-aware (atajos según estado)
- [ ] Gestión de conflictos con browser

### Fase 6: Polish
- [ ] Estilos y responsive design
- [ ] Animaciones (transiciones suaves)
- [ ] Validaciones de UI avanzadas
- [ ] Feedback visual (toasts, loading states)
- [ ] Accesibilidad (ARIA, keyboard navigation)
- [ ] Performance (bundling, lazy loading)

---

## 11. Consideraciones Técnicas

### Seguridad
- **Access Token:** JWT corto, en memoria, con refresh automático
- **Refresh Token:** Cookie `httpOnly`, no accesible desde JS
- **CORS:** Configurado en backend para permitir frontend
- **Password:** Hash con bcrypt (mínimo 12 rounds)
- **Validación:** Backend SIEMPRE valida entrada
- **Rate Limiting:** `/auth/login` (5/min), `/auth/refresh` (10/min), `/tasks/batch/*` (20/min)
- **Idempotencia:** Todos los endpoints mutables requieren `Idempotency-Key` header

### Performance
- **Índices:** Todos los campos de filtro indexados
- **Caché:** Tareas en memoria del frontend
- **Lazy Loading:** Componentes y vistas lazy-loaded
- **Paginación:** Si el futuro requiere (ahora no necesario)

### Mantenibilidad
- **Arquitectura:** Capas limpias (routes → services → repositories)
- **Testing:** Desde el inicio, no al final
- **Logging:** Structured logging en backend
- **Versionado API:** Desde `/api/v1/`

---

## 12. Características Futuras Desbloqueadas por Arquitectura

### Ya preparadas por mejoras:
- **Historial completo** (Event Log ya está)
- **Undo/Redo** (eventos permiten replay)
- **Auditoría detallada** (quién, qué, cuándo)
- **Escalabilidad a 10k+ tareas** (cursor pagination + índices)
- **Sync offline** (Idempotencia + event log)

### Futuras (diseño preparado):
- Tareas recurrentes (RRULE simplificada)
- Colaboración real-time (event log para sync)
- Integración con calendar
- Exportar a CSV/PDF
- Mobile app (API versionada + healthchecks)
- Webhooks (event log permite subscribers)
- Analytics avanzado (eventos ya indexados)

---

## 13. Próximos Pasos

1. **Setup inicial:** Crear estructura en `/app/frontend` y `/app/backend`
2. **Fase 1:** Backend base + autenticación segura
3. **Fase 2:** Backend avanzado + filtros + validaciones
4. **Fase 2.5:** Testing backend
5. **Fase 3:** Frontend base + router + login
6. **Fase 4:** Frontend features + integración API
7. **Fase 4.5:** Frontend testing
8. **Fase 5:** Atajos de teclado
9. **Fase 6:** Polish y optimizaciones
