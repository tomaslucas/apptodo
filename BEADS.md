# APPTODO-ROOT - Todo Multiusuario Completo

## Epic

Aplicación completa de gestión de tareas con autenticación segura, filtros dinámicos, auditoría y atajos de teclado. Stack: Vue 3 + TypeScript (frontend) y FastAPI + SQLite (backend).

**Key Assumptions:**
- Separación clara de capas (routes → services → repositories)
- Token-based auth con JWT (access en memoria, refresh en httpOnly cookie)
- Event sourcing para auditoría completa
- Paginación cursor-based para escalabilidad futura
- Idempotencia en todos los endpoints mutables

---

# APPTODO-PHASE1 - Backend Base (Autenticación + CRUD)

## Epic

Establece los fundamentos del backend con FastAPI, SQLite, estructura de capas y autenticación segura. Sin filtros complejos ni categorías aún.

---

## APPTODO-P1-SETUP - Setup inicial: Python + FastAPI + SQLite

Crear estructura de directorios `/app/backend` con:
- Python 3.12 venv + pip
- Dependencias: fastapi, uvicorn, sqlalchemy, pydantic, python-jose, passlib, bcrypt, pytest, coverage
- Estructura de capas: routers/, services/, repositories/, models/, schemas/
- Archivos base: main.py, database.py, config.py
- Logging estructurado (structlog)

**Acceptance Criteria:**
- ✅ `python -m uvicorn app.main:app --reload` ejecuta sin errores
- ✅ `/health` retorna {"status": "ok", "version": "1.0.0"}
- ✅ `/ready` health check de DB
- ✅ requirements.txt con dependencias pinned
- ✅ Structure matches plan

---

## APPTODO-P1-DB-INIT - Inicialización de Base de Datos (Schema + Índices)

Crear migrations con alembic:
- Tablas: users, tasks, refresh_tokens, idempotency_keys (MOVED from P2 to enable P1 task idempotency)
- Índices: idx_users_email, idx_tasks_user_id, idx_tasks_status, idx_tasks_priority, idx_tasks_deadline, idx_tasks_user_status, idx_refresh_tokens_user_id, idx_refresh_tokens_expires_at, idx_idempotency_keys_user_id, idx_idempotency_keys_expires_at
- Script idempotente: `python -m app.database` ejecuta migrations
- Seed data: test user con email/pass para testing manual

**Depends on:** APPTODO-P1-SETUP

**Acceptance Criteria:**
- ✅ DB se crea con todas las tablas
- ✅ Todos los índices creados
- ✅ Script idempotente (sin errores si DB existe)
- ✅ Test user seeded
- ✅ Foreign keys correctamente configuradas

---

## APPTODO-P1-AUTH-REG - Endpoint: POST /api/v1/auth/register

Implementar registro de usuario con validaciones backend:
- Input: {username, email, password}
- Validaciones: password ≥12 chars + mayús + minús + número + símbolo, email format, username/email unique
- Hash password con bcrypt (12 rounds)
- Respuesta: {status: "success", data: {user: {id, username, email, created_at}}}
- Errores: 400 (validation), 409 (conflict)
- Rate limiting: 5 registros/min por IP

**Depends on:** APPTODO-P1-DB-INIT

**Acceptance Criteria:**
- ✅ User válido creado
- ✅ Email/username duplicados → 409
- ✅ Password débil → 400 con mensaje específico
- ✅ Hash nunca retornado
- ✅ Rate limiting funciona

---

## APPTODO-P1-AUTH-LOGIN - Endpoint: POST /api/v1/auth/login + JWT

Implementar login con tokens segmentados:
- Input: {username_or_email, password}
- Generar: access token (JWT 15min), refresh token (7 días en cookie httpOnly)
- Respuesta: {status: "success", data: {access_token, user: {...}}}
- Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
- Errores: 401 (mismo error para user not found y wrong password, evitar enumeration)
- Rate limiting: 5 intentos/min por IP

**Depends on:** APPTODO-P1-AUTH-REG

**Acceptance Criteria:**
- ✅ Access token válido (JWT decodeable)
- ✅ Refresh token en httpOnly cookie
- ✅ User correcto/incorrecto mismo error 401
- ✅ Cookie tiene flags Secure, HttpOnly, SameSite
- ✅ Rate limiting funciona

---

## APPTODO-P1-AUTH-REFRESH - Endpoint: POST /api/v1/auth/refresh + Race Condition Handling

Implementar refresh token automático con manejo de race conditions:
- Recibe cookie con refresh_token
- Validaciones: token existe, no expirado, no revocado
- Genera nuevo access token
- Respuesta: {status: "success", data: {access_token}}
- Refresh token NO rotado (sigue siendo same)
- Rate limiting: 10 refrescos/min por usuario
- **IMPORTANT:** Design for concurrent requests (multiple 401s simultaneously); document queue/lock strategy in implementation

**Depends on:** APPTODO-P1-AUTH-LOGIN

**Acceptance Criteria:**
- ✅ Token válido → nuevo access token
- ✅ Token expirado → 401
- ✅ Access token nuevo tiene exp correcta
- ✅ Refresh token NO en response body
- ✅ Rate limiting activo

---

## APPTODO-P1-AUTH-LOGOUT - Endpoint: POST /api/v1/auth/logout

Implementar logout seguro:
- Requiere auth: bearer token válido
- Eliminar refresh token de DB
- Clear cookie: refresh_token=; Max-Age=0
- Respuesta: {status: "success", data: {}}

**Depends on:** APPTODO-P1-AUTH-LOGIN

**Acceptance Criteria:**
- ✅ Sin auth → 401
- ✅ Refresh token eliminado de DB
- ✅ Cookie cleared
- ✅ Subsequent refresh → 401

---

## APPTODO-P1-AUTH-ME - Endpoint: GET /api/v1/auth/me

Implementar endpoint para obtener usuario actual:
- Requiere auth: bearer token válido
- Extrae user_id del token
- Busca user en DB
- Respuesta: {status: "success", data: {user: {id, username, email, created_at}}}
- Si token stale (user deleted) → 401

**Depends on:** APPTODO-P1-AUTH-LOGIN

**Acceptance Criteria:**
- ✅ Con token válido → user data
- ✅ Sin token → 401
- ✅ Token stale (user deleted) → 401
- ✅ Respuesta NO incluye password_hash

---

## APPTODO-P1-TASKS-CREATE - Endpoint: POST /api/v1/tasks

Implementar creación de tarea con idempotencia:
- Requiere auth e Idempotency-Key (UUID)
- Input: {title, description?, priority?, deadline?}
- Validaciones: title non-empty, priority enum, deadline future
- Guarda en idempotency_keys table
- Response: {status: "success", data: {task: {...}}} (201 Created)
- Errores: 400 (validation), 401 (unauth), 409 (duplicate key con diferente request)

**Depends on:** APPTODO-P1-AUTH-ME

**Acceptance Criteria:**
- ✅ Task válida creada
- ✅ Idempotency-Key requerido
- ✅ Mismo key → idempotent (201 ambas veces)
- ✅ Diferente payload mismo key → 409
- ✅ Status default es 'pendiente'
- ✅ created_at automático

---

## APPTODO-P1-TASKS-GET - Endpoint: GET /api/v1/tasks/:id

Implementar obtener tarea individual:
- Requiere auth
- Valida ownership (404 si no es tuya)
- Respuesta: {status: "success", data: {task: {...}}}

**Depends on:** APPTODO-P1-TASKS-CREATE

**Acceptance Criteria:**
- ✅ Task propia retorna
- ✅ Task de otro user → 404
- ✅ Task no existente → 404
- ✅ Sin auth → 401

---

## APPTODO-P1-TASKS-LIST - Endpoint: GET /api/v1/tasks

Implementar listado con paginación cursor-based:
- Requiere auth
- Query params: limit (default 1000, max 5000), cursor, include_deleted (default false)
- Respuesta: {status: "success", data: {tasks: [...], pagination: {limit, next_cursor, has_more}}}
- Cursor pagination: WHERE id > cursor_id, retorna limit+1 para detectar has_more
- Orden: by id ASC
- Filter automático: WHERE user_id = :user_id AND deleted_at IS NULL (si include_deleted=false)

**Depends on:** APPTODO-P1-TASKS-GET

**Acceptance Criteria:**
- ✅ Sin parámetros retorna todas las tareas (hasta 1000)
- ✅ limit funciona
- ✅ Cursor pagination funciona (next_cursor, has_more)
- ✅ include_deleted=false excluye soft-deleted
- ✅ include_deleted=true incluye deletadas
- ✅ Tareas de otros users NUNCA retornadas

---

## APPTODO-P1-TASKS-UPDATE - Endpoint: PUT /api/v1/tasks/:id

Implementar actualización de tarea con optimistic locking prep:
- Requiere auth e Idempotency-Key
- Input: {title?, description?, priority?, deadline?, status?} (optional fields)
- Validaciones: whitelist de fields, title max 255, description max 5000, priority/status enums
- Soft deleted check: si deleted_at NOT NULL → 410 Gone
- Update: SET updated_at = NOW(), version = version + 1
- Response: {status: "success", data: {task: {...}}} (200 OK)

**Depends on:** APPTODO-P1-TASKS-LIST

**Acceptance Criteria:**
- ✅ Actualizar title/description/priority/deadline/status funciona
- ✅ Validaciones funcionan
- ✅ No permitir actualizar user_id, created_at
- ✅ Soft deleted → 410
- ✅ Version increments
- ✅ Idempotency funciona

---

## APPTODO-P1-TASKS-DELETE - Endpoint: DELETE /api/v1/tasks/:id

Implementar soft delete seguro:
- Requiere auth e Idempotency-Key
- Soft delete: UPDATE tasks SET deleted_at = NOW()
- Response: 204 No Content
- Idempotent: si ya deleted, retorna 204 igual

**Depends on:** APPTODO-P1-TASKS-UPDATE

**Acceptance Criteria:**
- ✅ Soft delete funciona (deleted_at set)
- ✅ 204 response
- ✅ Reintento → 204 (idempotent)
- ✅ No aparece en LIST (include_deleted=false)
- ✅ Aparece en LIST (include_deleted=true)

---

## APPTODO-P1-TEST-AUTH - Tests: Autenticación

Tests completos para register, login, refresh, logout, me:
- Test suite: test_auth.py
- Fixtures: test_db (in-memory SQLite), test_client, seed data
- Tests: register (valid/weak password/duplicate), login (valid/invalid/rate limit), refresh (valid/expired), logout, /me
- Coverage: ≥90% de auth routers + services

**Depends on:** APPTODO-P1-AUTH-ME

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Coverage ≥90%
- ✅ Tests <10s execution

---

## APPTODO-P1-TEST-TASKS - Tests: CRUD de Tareas

Tests para crear, obtener, listar, actualizar, eliminar tareas:
- Test suite: test_tasks.py
- Tests: create (valid/invalid/idempotency), GET/:id, LIST (pagination/filters/include_deleted), UPDATE (partial/validation), DELETE (soft delete/idempotency)
- Coverage: ≥85% de task routers + services

**Depends on:** APPTODO-P1-TASKS-DELETE

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Coverage ≥85%
- ✅ Tests <30s execution

---

## APPTODO-P1-TEST-IDEMPOTENCY - Tests: Idempotency Key Management

Tests específicos para idempotency + race conditions:
- Valid/invalid keys, same key + same/different body, concurrent requests
- Coverage de edge cases

**Depends on:** APPTODO-P1-TEST-TASKS

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Race conditions handled

---

## APPTODO-P1-TEST-SECURITY - Tests: Seguridad

Tests de SQL injection, XSS, traversal, rate limiting, auth bypass, token expiration:
- Coverage: OWASP Top 10 items en scope

**Depends on:** APPTODO-P1-TEST-IDEMPOTENCY

**Acceptance Criteria:**
- ✅ All security tests pass
- ✅ Vulnerability checklist completada

---

# APPTODO-PHASE2 - Backend Avanzado (Filtros, Categorías, Batch)

## Epic

Endpoints avanzados: filtros dinámicos, categorías, batch operations, event sourcing para auditoría.

---

## APPTODO-P2-DB-CATEGORIES - Schema: Tablas categories + task_categories + task_events + idempotency_keys

Agregar nuevas migraciones alembic:
- categories: id, user_id, name, color, created_at, updated_at + UNIQUE(user_id, name)
- task_categories: M2M relation (task_id, category_id)
- task_events: id, task_id, user_id, event_type, old_state JSON, new_state JSON, payload JSON, created_at
- idempotency_keys: id, user_id, idempotency_key, request_hash, response_data JSON, status_code, expires_at, created_at
- Índices: idx_categories_user_id, idx_task_categories_*, idx_task_events_*, idx_idempotency_keys_*

**Depends on:** APPTODO-P1-TEST-SECURITY

**Acceptance Criteria:**
- ✅ All tables created
- ✅ All indices created
- ✅ Foreign keys configured
- ✅ Migrations reversible

---

## APPTODO-P2-CATEGORIES-CRUD - Endpoints: Categorías CRUD

Implementar CRUD para categorías:
- POST /api/v1/categories: crear (require auth + Idempotency-Key, unique name per user)
- GET /api/v1/categories/:id: obtener
- GET /api/v1/categories: listar (cursor pagination)
- PUT /api/v1/categories/:id: actualizar (require auth + Idempotency-Key)
- DELETE /api/v1/categories/:id: hard delete (require auth + Idempotency-Key, error 409 si tasks using)

**Depends on:** APPTODO-P2-DB-CATEGORIES

**Acceptance Criteria:**
- ✅ CRUD funciona
- ✅ Idempotency funciona
- ✅ Ownership validado
- ✅ Constraints (unique, can't delete if used)

---

## APPTODO-P2-TASKS-CATEGORIES - Endpoint: Asignar/Remover Categorías a Tareas

Implementar M2M relations:
- POST /api/v1/tasks/:id/categories: asignar categoría (require auth + Idempotency-Key)
- DELETE /api/v1/tasks/:id/categories/:category_id: remover
- GET /api/v1/tasks/:id ahora incluye: categories: [{id, name, color}]

**Depends on:** APPTODO-P2-CATEGORIES-CRUD

**Acceptance Criteria:**
- ✅ Asignar/remover funciona
- ✅ Task retorna categorías en GET
- ✅ Validaciones (no other user's category)
- ✅ Idempotency funciona

---

## APPTODO-P2-TASKS-FILTERS-DB - Endpoint: GET /api/v1/tasks con Filtros en DB

Expandir GET /api/v1/tasks con filtros aplicados en DB:
- Query params: status, priority, deadline_from/to, category_id, search, sort, order, include_deleted
- Filtros con IN clauses, JOIN para categories, LIKE para search
- Índices existentes optimizan queries
- Response igual: {status, data: {tasks, pagination}}

**Depends on:** APPTODO-P2-TASKS-CATEGORIES

**Acceptance Criteria:**
- ✅ Todos los filtros funcionan (status, priority, deadline, category, search)
- ✅ Sort y order funcionan
- ✅ Combinación de filtros funciona (AND logic)
- ✅ Cursor pagination funciona con filtros

---

## APPTODO-P2-TASKS-BATCH - Endpoints: Batch Operations

Implementar operaciones en batch:
- POST /api/v1/tasks/batch/complete: marcar múltiples como completadas
- POST /api/v1/tasks/batch/delete: soft delete múltiples
- POST /api/v1/tasks/batch/priority: cambiar prioridad a múltiples
- POST /api/v1/tasks/batch/category: asignar categoría a múltiples
- Todos: require auth + Idempotency-Key, validar ownership, atomic transaction, rate limit 20/min
- **MAX SIZE:** Máximo 500 items por request (prevent DB lock, memory issues)
- Response: {status: "success", data: {updated_count: N}}

**Depends on:** APPTODO-P2-TASKS-FILTERS-DB

**Acceptance Criteria:**
- ✅ Todos los batch operations funcionan
- ✅ Validaciones (no empty, ownership)
- ✅ Idempotency funciona
- ✅ Rate limiting funciona

---

## APPTODO-P2-TASKS-RESTORE - Endpoint: Restaurar Tarea Eliminada

Implementar restore de soft-deleted tasks:
- PATCH /api/v1/tasks/:id/restore: restaurar tarea (require auth + Idempotency-Key)
- Validación: task es tuya, está deleteda (deleted_at NOT NULL)
- Update: SET deleted_at = NULL
- Response: {status: "success", data: {task: {...}}}

**Depends on:** APPTODO-P2-TASKS-BATCH

**Acceptance Criteria:**
- ✅ Deleted task puede restaurarse
- ✅ deleted_at set a NULL
- ✅ Restored task aparece en LIST
- ✅ No deleted task → 400

---

## APPTODO-P2-TASK-EVENTS - Endpoint: Event Log de Tarea (Auditoría)

Implementar event sourcing para auditoría:
- GET /api/v1/tasks/:id/events: obtener historial (cursor pagination)
- Event types: task_created, task_updated, task_completed, status_changed, priority_changed, deadline_changed, category_added, category_removed, task_deleted, task_restored
- Response: {status: "success", data: {events: [...], pagination: {...}}}
- Events creados en cada operación CRUD (crear evento en services)
- Event: {id, event_type, old_state, new_state, payload, created_at, user: {id, username}}

**Depends on:** APPTODO-P2-TASKS-RESTORE

**Acceptance Criteria:**
- ✅ Eventos se crean para todos los cambios
- ✅ GET /events retorna con event data correcto
- ✅ Cursor pagination funciona
- ✅ Otros usuarios no ven eventos de tareas ajenas

---

# APPTODO-PHASE3 - Frontend Base (Vue 3 + Router + Auth)

## Epic

Frontend base con Vue 3, TypeScript, Router, Pinia stores, login y estructura de dashboard.

---

## APPTODO-P3-SETUP - Setup: Vue 3 + TypeScript + Bun + Router

Crear estructura `/app/frontend`:
- Bun como package manager + bundler
- Instalar: vue@3, vue-router@4, pinia, axios, typescript
- Directorios: components/, views/, stores/, types/, utils/, styles/, api/, router/
- TypeScript strict mode
- main.ts, App.vue, tsconfig.json, vite config
- Dev server: `bun run dev` en puerto 5173

**Depends on:** APPTODO-P2-TASK-EVENTS

**Acceptance Criteria:**
- ✅ `bun install` instala dependencias
- ✅ `bun run dev` inicia servidor en localhost:5173
- ✅ App.vue renderiza
- ✅ TypeScript stricto sin errores

---

## APPTODO-P3-ROUTER - Configurar Vue Router: Rutas Básicas

Crear src/router/index.ts:
- Rutas: /login, /dashboard, /register, catch-all
- Guards: unauth → /login, auth + on /login → /dashboard
- Lazy loading de views (dynamic import)
- Router history: createWebHistory

**Depends on:** APPTODO-P3-SETUP

**Acceptance Criteria:**
- ✅ Routes configuradas
- ✅ Guards funcionan
- ✅ Lazy loading funciona

---

## APPTODO-P3-AUTH-STORE - Pinia Store: AuthStore

Crear stores/authStore.ts:
- State: user, isAuthenticated, accessToken, isLoading, error
- Actions: login, logout, register, refresh, fetchUser, setAccessToken, clearAuth
- Getters: isAuthenticated, hasValidToken
- NO guardar token en localStorage (in-memory)

**Depends on:** APPTODO-P3-ROUTER

**Acceptance Criteria:**
- ✅ Login guarda token + user
- ✅ Logout limpia todo
- ✅ Token no en localStorage
- ✅ fetchUser() obtiene user

---

## APPTODO-P3-API-INTERCEPTOR - API Client: Axios + Interceptor + Environment Config

Crear api/client.ts (axios instance) con soporte multi-environment:
- baseURL: Configurable por environment (dev: localhost:8000, staging: ..., prod: ...)
  - Load from import.meta.env.VITE_API_BASE_URL con fallback a localhost:8000
- Request interceptor: agregar Authorization header, Idempotency-Key (uuid4 para mutators)
- Response interceptor: 401 + auto-refresh con race condition handling (queue concurrent 401s), error mapping, logging
- ErrorClass: AppError(status, message, details)
- **Race Condition Handling:** If multiple requests get 401 simultaneously, only one should refresh; others wait for result

**Depends on:** APPTODO-P3-AUTH-STORE

**Acceptance Criteria:**
- ✅ Auth header presente
- ✅ Idempotency-Key auto en POST/PUT/DELETE
- ✅ 401 triggers refresh + retry automático
- ✅ Errores mapeados a user-friendly messages

---

## APPTODO-P3-LOGIN-VIEW - Componente: LoginView

Crear views/LoginView.vue:
- Tabs/toggle entre Login y Register
- Form fields: email/username, password, confirm password (register)
- Validaciones frontend: email format, password strength, match confirm
- Components helper: PasswordStrengthMeter, FormInput
- Styling: responsive, dark mode compatible

**Depends on:** APPTODO-P3-API-INTERCEPTOR

**Acceptance Criteria:**
- ✅ Login funciona
- ✅ Register funciona
- ✅ Validaciones frontend funcionan
- ✅ Errores servidor mostrados
- ✅ Auto-redirect /dashboard después login

---

## APPTODO-P3-DASHBOARD-STRUCTURE - Componente: DashboardView (Estructura base)

Crear views/DashboardView.vue:
- Header: branding, user menu
- Sidebar: navegación (colapsable mobile)
- Main content: placeholder para TaskList
- Components: Header.vue, Sidebar.vue, LayoutWrapper.vue
- User menu: Profile (future), Logout

**Depends on:** APPTODO-P3-LOGIN-VIEW

**Acceptance Criteria:**
- ✅ Layout renderiza
- ✅ User menu funciona
- ✅ Logout funciona
- ✅ Responsive design

---

# APPTODO-PHASE4 - Frontend Features (Tareas + Filtros + Interacción)

## Epic

Componentes principales, stores de tareas, integración API, selección múltiple, acciones batch.

---

## APPTODO-P4-TASK-STORE - Pinia Store: TaskStore

Crear stores/taskStore.ts:
- State: tasks, filters, isLoading, error, cursor, hasMore
- Actions: fetchTasks, createTask, updateTask, deleteTask, restoreTask, setFilters, resetFilters, loadMore, batch*(complete/delete/priority/category)
- Computed: visibleTasks, filteredTasks, tasksByStatus, countByStatus, overdueTasks
- Getters: taskById, hasUnsyncedChanges

**Depends on:** APPTODO-P3-DASHBOARD-STRUCTURE

---

## APPTODO-P4-CATEGORY-STORE - Pinia Store: CategoryStore (NEW)

Crear stores/categoryStore.ts (complementa TaskStore):
- State: categories, isLoading, error
- Actions: fetchCategories, createCategory, updateCategory, deleteCategory
- Computed: categoriesById (for quick lookup)
- Getters: getCategory, hasCategoriesLoaded
- Purpose: Provide categories for TaskForm multi-select, FilterBar selector, TaskItem badges
- **Note:** Must load categories early (in dashboard mount) for UI responsiveness

**Depends on:** APPTODO-P4-TASK-STORE

**Acceptance Criteria:**
- ✅ fetchTasks obtiene de API
- ✅ CRUD actions funcionan
- ✅ setFilters aplica + refetch
- ✅ visibleTasks computed eficiente
- ✅ Batch operations funcionan

---

## APPTODO-P4-UI-STORE - Pinia Store: UIStore

Crear stores/uiStore.ts:
- State: selectedTaskIds, focusedTaskId, modals, shortcuts, toasts, sidebarCollapsed
- Actions: selectTask, deselectTask, toggleSelect, selectAll, clearSelection, setFocusedTask, openModal, closeModal, addToast, removeToast, toggleSidebar
- Getters: isTaskSelected, selectionCount, hasSelection, hasActiveModal
- Separación: UIStore = UI state (no domain logic)

**Depends on:** APPTODO-P4-CATEGORY-STORE

**Acceptance Criteria:**
- ✅ Selection funciona
- ✅ Modal state funciona
- ✅ Focused task tracking funciona
- ✅ Toasts auto-clear

---

## APPTODO-P4-TASK-ITEM-COMPONENT - Componente: TaskItem.vue

Crear components/TaskItem.vue:
- Props: task, isSelected, isFocused
- Emits: @click, @select-toggle, @edit, @delete
- Renderiza: checkbox, title, description preview, priority badge, deadline, categories, status, actions
- Styling: color-coded priority/status, selected/focused states

**Depends on:** APPTODO-P4-UI-STORE

**Acceptance Criteria:**
- ✅ Renderiza con todos los campos
- ✅ Checkbox funciona
- ✅ Colors y styling correcto
- ✅ Buttons funcionales

---

## APPTODO-P4-TASK-FORM-COMPONENT - Componente: TaskForm.vue

Crear components/TaskForm.vue (modal):
- Props: task? (edit mode), mode: 'create'|'edit'
- Form fields: title, description, priority, deadline, categories multi-select
- Validations: title required, deadline future, char counters
- Submit/Cancel/Delete buttons

**Depends on:** APPTODO-P4-TASK-ITEM-COMPONENT

**Acceptance Criteria:**
- ✅ Create/edit modes funcionan
- ✅ Validations frontend funcionan
- ✅ Categories dropdown funciona
- ✅ Submit emits, Cancel cierra

---

## APPTODO-P4-FILTER-BAR-COMPONENT - Componente: FilterBar.vue

Crear components/FilterBar.vue:
- Filters: status (checkboxes), priority, deadline range/presets, categories multi-select, search (debounced), sort, order
- Include deleted checkbox
- Apply/Reset buttons
- Mobile: colapsable

**Depends on:** APPTODO-P4-TASK-FORM-COMPONENT

**Acceptance Criteria:**
- ✅ Todos los filters funcionan
- ✅ Search real-time (debounced)
- ✅ Apply → taskStore.setFilters
- ✅ Reset clears filters

---

## APPTODO-P4-TASK-LIST-COMPONENT - Componente: TaskList.vue

Crear components/TaskList.vue (orchestrator):
- Renderiza: FilterBar, Create button, Selection toolbar, TaskItems, Empty/Loading/Error states, Load more
- Multi-select: Select all + individual
- Batch actions: Complete, Delete, Priority, Category (visible si hasSelection)
- Keyboard navigation prep (shortcuts en siguiente fase)

**Depends on:** APPTODO-P4-FILTER-BAR-COMPONENT

**Acceptance Criteria:**
- ✅ FilterBar integrado
- ✅ TaskItems renderizadas
- ✅ Create button funciona
- ✅ Multi-select funciona
- ✅ Batch actions visible si selección
- ✅ Empty/Loading/Error states

---

## APPTODO-P4-API-INTEGRATION - Integración Completa API

Conectar componentes ↔ Backend vía stores:
- TaskStore actions: fetchTasks, createTask, updateTask, deleteTask, restoreTask, batch operations
- CategoryStore (nuevo): fetchCategories, createCategory, updateCategory, deleteCategory, assignToTask
- API client: axios instance con auth + idempotency interceptors
- Testing: mock axios responses

**Depends on:** APPTODO-P4-TASK-LIST-COMPONENT

**Acceptance Criteria:**
- ✅ fetchTasks obtiene y popula store
- ✅ CRUD API calls funcionan
- ✅ Batch operations funcionan
- ✅ Filtros en query params
- ✅ Error handling graceful

---

## APPTODO-P4-DELETE-CONFIRM-MODAL - Componente: DeleteConfirmModal.vue

Crear components/DeleteConfirmModal.vue:
- Props: task
- Emits: @confirm, @cancel
- Renderiza: warning colors, task preview, Delete/Cancel buttons, Esc to close

**Depends on:** APPTODO-P4-API-INTEGRATION

**Acceptance Criteria:**
- ✅ Modal renderiza
- ✅ Delete/Cancel emits
- ✅ Esc cierra

---

# APPTODO-PHASE5 - Atajos de Teclado

## Epic

Sistema centralizado de 9 atajos de teclado, context-aware.

---

## APPTODO-P5-SHORTCUTS-MANAGER - Gestor de Atajos Centralizado

Crear utils/shortcutsManager.ts:
- registerShortcut(key, handler, config)
- unregisterShortcut(key)
- handleKeyDown(event) - match + execute
- isModalOpen() - check context
- getActiveShortcuts() - for help UI
- 9 shortcuts: Ctrl+K (new), E (edit), D (delete), Shift+D (restore), Space (toggle), 1/2/3 (priority), Shift+↑↓ (multi-select), B (batch), Escape (close)
- Context-aware: desabilita shortcuts si modal abierto (except Escape)

**Depends on:** APPTODO-P4-DELETE-CONFIRM-MODAL

**Acceptance Criteria:**
- ✅ registerShortcut funciona
- ✅ handleKeyDown matchea + ejecuta
- ✅ Modal context desabilita shortcuts
- ✅ Logging funciona

---

## APPTODO-P5-SHORTCUTS-IMPL - Implementar 9 Atajos en Componentes

Integrar shortcutsManager en TaskList + componentes:
1. Ctrl+K: abre TaskForm modal (create)
2. E: abre TaskForm modal (edit, si task focused)
3. D: abre DeleteConfirmModal (si task focused)
4. Shift+D: restore task (si deleted + focused)
5. Space: toggle status (si task focused)
6. 1/2/3: change priority (si task focused)
7. Shift+↑↓: navigate + multi-select
8. B: toggle batch actions menu (si selección)
9. Escape: close modal / clear selection / clear focus

Usar uiStore.focusedTaskId para navegación, uiStore.selectedTaskIds para batch.

**Depends on:** APPTODO-P5-SHORTCUTS-MANAGER

**Acceptance Criteria:**
- ✅ Todos los 9 atajos funcionan
- ✅ Context-aware (no interfieren con input)
- ✅ Feedback visual para cada acción

---

## APPTODO-P5-SHORTCUTS-HELP - UI: Mostrar Atajos Disponibles

Crear components/ShortcutsHelp.vue (modal):
- Botón "?" en header
- Tabla: Atajo | Descripción | Contexto
- Modal scrollable, Escape cierra
- Usa shortcutsManager.getActiveShortcuts()

**Depends on:** APPTODO-P5-SHORTCUTS-IMPL

**Acceptance Criteria:**
- ✅ Todos los 9 atajos listados
- ✅ Descripciones claras
- ✅ Modal accesible

---

# APPTODO-PHASE6 - Polish, Testing, Optimizaciones

## Epic

Styling, testing, performance, accessibility, responsiveness.

---

## APPTODO-P6-STYLING - Estilos y Responsive Design

Implementar styling con Tailwind CSS:
- Color scheme: primary (blue), success (green), danger (red), warning (orange), neutral (gray)
- Responsive: mobile (<640px), tablet (640-1024px), desktop (>1024px)
- Components: header, sidebar, filterbar, tasklist responsive
- Dark mode prep: CSS vars
- Accessibility: color contrast ≥4.5:1 (AA), semantic HTML, ARIA attributes, focus outlines

**Depends on:** APPTODO-P5-SHORTCUTS-HELP

**Acceptance Criteria:**
- ✅ Responsive (mobile/tablet/desktop)
- ✅ Color scheme consistent
- ✅ WCAG AA compliance
- ✅ No horizontal scroll mobile

---

## APPTODO-P6-ANIMATIONS - Animaciones y Transiciones Suaves

Implementar Vue transitions:
- Modal open/close (fade + slide)
- Task add/delete (fade + slide)
- Filter bar toggle
- Toast notifications
- CSS animations: hover, focus, loading states
- Duration: 200-300ms, GPU acceleration (transform, opacity)
- Performance: 60fps (profile en DevTools)

**Depends on:** APPTODO-P6-STYLING

**Acceptance Criteria:**
- ✅ Modals animate smoothly
- ✅ Tasks fade in/out
- ✅ Hover effects smooth
- ✅ No jank (60fps)

---

## APPTODO-P6-FORM-VALIDATIONS - Validaciones Avanzadas en Formularios

Implementar validaciones en TaskForm:
- Real-time validation (on blur + input)
- Error messages inline + específicas
- Visual feedback (red border, error color)
- Character counters
- Deadline: future date only
- Use VeeValidate o custom validators
- Submit disabled hasta válido

**Depends on:** APPTODO-P6-ANIMATIONS

**Acceptance Criteria:**
- ✅ Real-time validation
- ✅ Error messages específicas
- ✅ Character counters funciona
- ✅ Submit disabled hasta válido

---

## APPTODO-P6-LOADING-STATES - Loading States y Feedback Visual

Implementar loading indicators:
- Spinner durante fetchTasks, button disable + spinner durante submit
- Error banner + retry button
- Toast notifications (success/error/info, auto-clear 5s)
- Optimistic updates + rollback
- Empty states ("No hay tareas")

**Depends on:** APPTODO-P6-FORM-VALIDATIONS

**Acceptance Criteria:**
- ✅ Loading spinner visible
- ✅ Toast notifications funcionan
- ✅ Error banner visible
- ✅ Empty state friendly

---

## APPTODO-P6-ACCESSIBILITY - Accesibilidad (WCAG AA)

Implementar accesibilidad:
- Semantic HTML (<button>, <label>, <nav>, <main>)
- ARIA attributes (aria-label, aria-hidden, aria-live, aria-expanded)
- Keyboard navigation: Tab, Escape, Enter, Arrow keys
- Focus visible (outline on :focus)
- Screen reader compatibility
- Color contrast ≥4.5:1
- Testing: Axe DevTools, VoiceOver/NVDA, keyboard-only nav

**Depends on:** APPTODO-P6-LOADING-STATES

**Acceptance Criteria:**
- ✅ Semantic HTML
- ✅ ARIA correct
- ✅ Keyboard nav works
- ✅ Focus visible
- ✅ Color contrast meets WCAG AA
- ✅ Axe scan passes

---

## APPTODO-P6-PERFORMANCE - Performance Optimizations

Optimizar performance:
- Code splitting (lazy load views)
- Tree shaking (remove unused)
- Minification (vite)
- Computed memoization, v-show vs v-if
- HTTP/2, caching headers, gzip
- Cleanup event listeners, cancel requests
- Lighthouse ≥90, FCP <2s, LCP <2.5s, CLS <0.1
- Testing: Chrome Lighthouse, bun bundle analysis

**Depends on:** APPTODO-P6-ACCESSIBILITY

**Acceptance Criteria:**
- ✅ Lighthouse ≥90
- ✅ Bundle size <500KB (gzipped)
- ✅ Code splitting working
- ✅ No memory leaks

---

## APPTODO-P6-FRONTEND-TESTS - Tests: Frontend Componentes + Stores

Implementar tests con Vitest + Vue Test Utils:
- Component tests: TaskItem, TaskForm, FilterBar, TaskList
- Store tests: authStore, taskStore, uiStore
- Integration tests: TaskList + API
- Coverage: components ≥70%, stores ≥80%, overall ≥70%
- Mock axios, mock stores, factories para test data

**Depends on:** APPTODO-P6-PERFORMANCE

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Coverage ≥70% overall
- ✅ Tests <30s execution

---

## APPTODO-P6-E2E-TESTS - Tests: E2E + Automated Accessibility

Implementar E2E tests con Cypress/Playwright + automated a11y testing:
- Scenarios: Auth (register/login/logout), CRUD, Filters, Batch, Categories, Shortcuts, Responsive
- Setup: servers running, fresh DB, seeding
- Assertions: visibility, URL, data, network
- Screenshots on failure
- **NEW:** Integrate axe-core for automated accessibility testing in each E2E test
  - Run axe scans on critical pages (login, dashboard, task form, filters)
  - Fail test if WCAG AA violations found
  - Document known issues if any

**Depends on:** APPTODO-P6-FRONTEND-TESTS

**Acceptance Criteria:**
- ✅ All E2E scenarios pass
- ✅ Tests <5min execution
- ✅ No flaky tests
- ✅ Automated a11y testing integrated (Axe Core)

---

## APPTODO-P6-DOCUMENTATION - Documentación

Escribir documentación:
- README.md: overview, setup, testing, building
- API docs: Swagger auto-generated (/docs)
- User guide: create/edit/delete, filters, shortcuts, accessibility
- Developer docs: architecture, stores, API client, testing, deployment
- Code comments: docstrings, gotchas

**Depends on:** APPTODO-P6-E2E-TESTS

**Acceptance Criteria:**
- ✅ README complete
- ✅ API docs auto-generated
- ✅ Code well-commented

---

## APPTODO-P6-PRODUCTION-BUILD - Build y Deployment

Preparar deployment:
- Frontend: bun build, test build, dist/
- Backend: Gunicorn/Uvicorn, env vars, alembic migrations
- Docker (optional): Dockerfile, docker-compose.yml
- Checklist: HTTPS, CORS, rate limiting, logging, secrets, backups, monitoring, health checks

**Depends on:** APPTODO-P6-DOCUMENTATION

**Acceptance Criteria:**
- ✅ Frontend builds without errors
- ✅ Backend starts with prod config
- ✅ Requests work (CORS OK)
- ✅ Secrets not in repo
- ✅ Health checks work

---

## APPTODO-CLEANUP - Cleanup: Remover Seed Data, Finalizar Configuraciones

Cleanup final:
- Backend: remover seed data, logging review, error messages clean, rate limiting, CORS
- Frontend: remover console.logs, API endpoints clean, env vars
- Git: .gitignore proper, no secrets, pinned dependencies

**Depends on:** APPTODO-P6-PRODUCTION-BUILD

**Acceptance Criteria:**
- ✅ No console.logs en prod
- ✅ No sensitive data in logs
- ✅ .env not committed
- ✅ Code clean
