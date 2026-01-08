# Beads Structure: AppTodo - Multi-user Task Management App

## Epic Structure Overview

Esta estructura de beads implementa un enfoque de desarrollo modular con épicas, fases y tareas granulares. Cada bead contiene comentarios detallados sobre contexto, dependencias y justificación técnica.

---

# EPIC: APPTODO-COMPLETE - Todo Multiusuario Completo

**Status:** Open  
**Description:** Aplicación completa de gestión de tareas con autenticación segura, filtros dinámicos, auditoría y atajos de teclado. SPA con Vue 3 + TypeScript (frontend) y FastAPI + SQLite (backend).

**Architectural Assumptions:**
- Separación clara de capas (routes → services → repositories)
- Token-based auth con JWT (access en memoria, refresh en httpOnly cookie)
- Event sourcing para auditoría completa
- Paginación cursor-based para escalabilidad futura
- Idempotencia en todos los endpoints mutables

**Key Success Criteria:**
- Auth flow seguro y validado end-to-end
- Filtros dinámicos funcionando en frontend
- Todos los 9 atajos de teclado implementados
- Cobertura de tests ≥75% (backend) y ≥70% (frontend)
- API versionada desde v1 con docs Swagger

---

## EPIC: APPTODO-PHASE1 - Backend Base (Autenticación + CRUD Básico)

**Status:** Open  
**Description:** Establece los fundamentos del backend con FastAPI, SQLite, estructura de capas y autenticación segura. Sin filtros complejos ni categorías aún.

**Dependencies:** None (root epic)

**Rationale:**
Fase crítica que establece patrones de arquitectura para el resto del proyecto. La autenticación segura es prerrequisito para todo lo demás. El CRUD básico permite validar la arquitectura de capas.

---

### TASK: APPTODO-P1-SETUP - Setup inicial: Python + FastAPI + SQLite

**Status:** Open  
**Description:**
- Crear estructura de directorios: `/app/backend`
- Python 3.12 venv con pip
- Instalar dependencias: fastapi, uvicorn, sqlalchemy, pydantic, python-jose, passlib, bcrypt, python-multipart
- Configurar pytest y coverage para testing
- Crear archivos base: main.py, database.py, config.py
- Estructura de capas: app/routers/, app/services/, app/repositories/, app/models/, app/schemas/
- Logging estructurado (structlog)

**Technical Rationale:**
- FastAPI ofrece validación automática con Pydantic, OpenAPI docs gratis, async nativo
- SQLAlchemy facilita migrations y relaciones complejas (M2M para categories)
- Estructura por capas permite testabilidad y mantenimiento
- Logging estructurado crítico para debugging en producción

**Acceptance Criteria:**
- ✅ `python -m uvicorn app.main:app --reload` ejecuta sin errores
- ✅ `/health` retorna {"status": "ok", "version": "1.0.0"}
- ✅ `/ready` hace health check de DB y retorna status
- ✅ Estructura de directorios coincide con el plan
- ✅ requirements.txt con todas las dependencias pinned

**Notes:**
- Usar virtual environment aislado
- Documentar setup en README.md local
- Config debe soportar dev/staging/prod vía env vars

---

### TASK: APPTODO-P1-DB-INIT - Inicialización de Base de Datos (Schema + Índices)

**Status:** Open  
**Depends on:** APPTODO-P1-SETUP  
**Description:**
- Crear migrations en alembic (db/migrations/)
- Schema inicial: users, tasks, refresh_tokens
- Crear índices para performance:
  - idx_users_email
  - idx_tasks_user_id, idx_tasks_status, idx_tasks_priority, idx_tasks_deadline
  - idx_tasks_user_status (composite para filtros comunes)
  - idx_refresh_tokens_user_id, idx_refresh_tokens_expires_at
- Script: `python -m app.database` ejecuta todas las migrations
- Seed data opcional: test user con contraseña "testpass123"

**Technical Rationale:**
- Índices sobre campos de filtro (status, priority, deadline, user_id) son críticos para performance con 10k+ tareas
- Composite index (user_id, status) optimiza el patrón común de "tareas de usuario por estado"
- Usar alembic permite versionado de DB y rollbacks seguros
- Seed data facilita testing manual rápido

**Acceptance Criteria:**
- ✅ DB se crea con todas las tablas
- ✅ Todos los índices listados creados correctamente
- ✅ Script de init es idempotente (sin errores si DB ya existe)
- ✅ Test user existe con email/username
- ✅ Foreign keys configuradas correctamente

**Notes:**
- Tablas: users, tasks, refresh_tokens (fase 1 solo)
- Soft delete: tasks.deleted_at NOT NULL DEFAULT NULL
- Version field en tasks (para optimistic locking futuro)

---

### TASK: APPTODO-P1-AUTH-REG - Endpoint: POST /api/v1/auth/register

**Status:** Open  
**Depends on:** APPTODO-P1-DB-INIT  
**Description:**
- Input schema: {username, email, password} con validaciones
- Validaciones backend:
  - Password ≥12 caracteres, req: mayúscula, minúscula, número, símbolo
  - Email formato válido
  - Username único, email único (CHECK unique en DB)
  - No permitir users con nombres reservados
- Hash password con bcrypt (rounds: 12)
- Crear usuario, retornar {status: "success", data: {user: {id, username, email, created_at}}}
- Error responses:
  - 400 Bad Request si validaciones fallan (detalles específicos)
  - 409 Conflict si email/username ya existen
  - 500 si error no esperado
- Rate limiting: 5 registros/min por IP

**Technical Rationale:**
- Bcrypt con 12 rounds: balance entre seguridad (resistencia a ataques brute-force) y performance (200-300ms por hash)
- Validaciones de password en regex backend aseguran consistencia
- Rate limiting previene spam/registration attacks
- No retornar password_hash en respuesta (obvio pero crítico)

**Acceptance Criteria:**
- ✅ User válido se crea y se retorna ID
- ✅ Email/username duplicados retornan 409
- ✅ Password débil rechazado con mensaje específico
- ✅ Email inválido rechazado
- ✅ Hash nunca retornado al cliente
- ✅ created_at timestamp automático

**Notes:**
- Usar Pydantic model para validación: `class UserRegisterSchema(BaseModel): ...`
- Response schema: no incluir password_hash nunca
- Logging: registrar intentos de registro fallidos (no password)

---

### TASK: APPTODO-P1-AUTH-LOGIN - Endpoint: POST /api/v1/auth/login + JWT

**Status:** Open  
**Depends on:** APPTODO-P1-AUTH-REG  
**Description:**
- Input: {username_or_email, password}
- Buscar user por email O username
- Verificar password con bcrypt.verify()
- Generar tokens:
  - Access token: JWT con payload {user_id, username, exp: now + 15min}, secret: SECRET_KEY
  - Refresh token: Token aleatorio (secrets.token_urlsafe(32)), hash con SHA256, store en DB con expires_at: now + 7 days
- Response: {status: "success", data: {access_token, user: {id, username, email}}}
- Set cookie: Set-Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
- Respuesta no incluye refresh_token en body (está en cookie)
- Error responses:
  - 401 si user no existe O password incorrecto (MISMO error para ambos, evitar user enumeration)
  - 500 si error no esperado
- Rate limiting: 5 intentos/min por IP

**Technical Rationale:**
- JWT access token en memoria (frontend) es seguro porque:
  - No persiste si browser cierra
  - No vulnerable a CSRF (no es cookie)
  - Expiración corta (15min) limita window de compromise
- Refresh token en httpOnly cookie es seguro porque:
  - JS no puede accederlo (previene XSS)
  - Browser envía automáticamente
  - CSRF mitigado con SameSite=Strict
- Mismo error 401 para user not found y wrong password previene user enumeration
- SHA256 hash de refresh token en DB previene que DB leak exponga tokens

**Acceptance Criteria:**
- ✅ User correcto retorna access_token válido (decodeable, payload correcto)
- ✅ Refresh token en cookie httpOnly (verificable con test)
- ✅ User no existe → 401 (sin revelar si existe)
- ✅ Password incorrecto → 401
- ✅ Cookie tiene flags Secure, HttpOnly, SameSite=Strict
- ✅ Token expira correctamente (15min)
- ✅ Rate limiting bloquea después de 5 intentos

**Notes:**
- Implementar clase base de configuración para secrets
- Usar python-jose para JWT (más standard que alternatives)
- Logging: intentos fallidos con IP (sin password/email)
- Testing: usar test user seeded en DB

---

### TASK: APPTODO-P1-AUTH-REFRESH - Endpoint: POST /api/v1/auth/refresh

**Status:** Open  
**Depends on:** APPTODO-P1-AUTH-LOGIN  
**Description:**
- Interceptor de request automático en frontend (implementado después)
- Cuando access token expirado (401), frontend automaticamente POST a /auth/refresh
- Backend recibe cookie con refresh_token
- Validaciones:
  - Buscar refresh token hash en DB (match)
  - Verificar expires_at > now
  - Token no ha sido revocado (future: logout lista negra)
- Generar nuevo access token (mismo payload)
- Response: {status: "success", data: {access_token}}
- NO actualizar refresh token (sigue siendo mismo)
- Error responses:
  - 401 si refresh token no existe/expirado/inválido
  - 500 si error no esperado
- Rate limiting: 10 refrescos/min por usuario

**Technical Rationale:**
- Refresh token nunca enviado en response (evita que JSON logs lo expongan)
- Token no rotado en cada refresh (simplifica lógica, es acceptable para 7 días lifetime)
- Refresh token almacenado como hash en DB: si DB leak, tokens no directamente usables
- Expiración de refresh token (7 días) es ventana máxima de compromise después de logout

**Acceptance Criteria:**
- ✅ Token válido retorna nuevo access token
- ✅ Token expirado rechazado (401)
- ✅ Token inválido rechazado (401)
- ✅ Access token nuevo tiene exp correcta (now + 15min)
- ✅ Cookie refresh token NO está en response body
- ✅ Rate limiting activo

**Notes:**
- Cleanup tarea aparte: eliminar refresh tokens expirados (cron job)
- Logging: refrescos exitosos y fallidos (IP, user_id)

---

### TASK: APPTODO-P1-AUTH-LOGOUT - Endpoint: POST /api/v1/auth/logout

**Status:** Open  
**Depends on:** APPTODO-P1-AUTH-REFRESH  
**Description:**
- Requiere auth: bearer token válido
- Extraer user_id de token
- Buscar y ELIMINAR refresh token para ese user
- Response: {status: "success", data: {}}
- Set-Cookie: refresh_token=; Max-Age=0 (clear cookie)
- Frontend: limpiar access token de memoria
- Error responses:
  - 401 si no autenticado
  - 500 si error no esperado

**Technical Rationale:**
- Eliminar refresh token invalida inmediatamente la sesión (no hay ventana)
- Clear cookie del browser asegura que no se reenvíe
- Access token en memoria perdido al cerrar browser de todas formas
- Logout inmediato es mejor que lista negra (simplicity + security)

**Acceptance Criteria:**
- ✅ Logout requiere token válido (401 sin token)
- ✅ Refresh token eliminado de DB
- ✅ Cookie set a vacío con Max-Age=0
- ✅ Subsequent refresh attempts fallan (401)
- ✅ Otros usuarios NO afectados

**Notes:**
- No requiere body
- Logging: logout exitoso (user_id, IP, timestamp)

---

### TASK: APPTODO-P1-AUTH-ME - Endpoint: GET /api/v1/auth/me

**Status:** Open  
**Depends on:** APPTODO-P1-AUTH-REFRESH  
**Description:**
- Requiere auth: bearer token válido
- Extraer user_id de token payload
- Buscar user en DB
- Response: {status: "success", data: {user: {id, username, email, created_at}}}
- Error responses:
  - 401 si no autenticado O user no existe (token stale)
  - 500 si error no esperado

**Technical Rationale:**
- Endpoint simple que permite frontend saber usuario actual sin guardar en localStorage
- Útil para refresh de página (get user del token)
- Si user fue eliminado pero token válido: retornar 401 (user stale)

**Acceptance Criteria:**
- ✅ Con token válido retorna user data
- ✅ Sin token retorna 401
- ✅ Token inválido retorna 401
- ✅ Respuesta NO incluye password_hash, created_at sensitivos

**Notes:**
- Cache en frontend por duración de token para evitar spam
- No retornar refresh token related info

---

### TASK: APPTODO-P1-TASKS-CREATE - Endpoint: POST /api/v1/tasks

**Status:** Open  
**Depends on:** APPTODO-P1-AUTH-ME  
**Description:**
- Requiere auth y header Idempotency-Key (UUID)
- Input schema: {title, description?, priority?, deadline?}
- Validaciones:
  - title: non-empty, max 255 chars
  - description: max 5000 chars (optional)
  - priority: 'baja'|'media'|'alta' (default: 'media')
  - deadline: ISO date futuro o vacío
  - Idempotency-Key: valid UUID
- Crear task con status='pendiente', user_id=current_user
- Check idempotency: si Idempotency-Key existe en tabla idempotency_keys con mismo request_hash → retornar cached response (status_code + response_data)
- Si no existe: guardar {user_id, idempotency_key, request_hash, response_data, status_code, expires_at: now + 24h}
- Response: {status: "success", data: {task: {id, title, ..., created_at}}} (201 Created)
- Error responses:
  - 400 si validaciones fallan
  - 401 si no autenticado
  - 409 si duplicate idempotency key con diferente request (hash mismatch)
  - 500 si error no esperado

**Technical Rationale:**
- Idempotency Key permite safe retries: si frontend timeout, puede reintentar con mismo key y obtener mismo resultado
- Deduplicación por request_hash: si client reenvía exactamente mismo request → cached response idéntica
- Expires_at en 24h: data de idempotencia se limpia automáticamente
- Status='pendiente' por defecto es estado más común

**Acceptance Criteria:**
- ✅ Task válida se crea con todos los campos
- ✅ Task tiene created_at y updated_at automáticos
- ✅ Status default es 'pendiente'
- ✅ Idempotency-Key sin UUID rechazado (400)
- ✅ Mismo request con mismo key retorna 201 nuevamente (idempotent)
- ✅ Requests con diferentes payloads pero mismo key retornan 409
- ✅ Task pertenece a usuario autenticado

**Notes:**
- Usar Pydantic model: `class TaskCreateSchema(BaseModel)`
- Campo version=1 en DB (future: optimistic locking)
- Logging: task created (user_id, task_id, title)

---

### TASK: APPTODO-P1-TASKS-GET - Endpoint: GET /api/v1/tasks/:id

**Status:** Open  
**Depends on:** APPTODO-P1-TASKS-CREATE  
**Description:**
- Requiere auth
- Path param: id (integer)
- Validar que task existe Y pertenece al usuario autenticado
- Response: {status: "success", data: {task: {id, title, ..., updated_at}}}
- Error responses:
  - 401 si no autenticado
  - 404 si task no existe O pertenece a otro usuario
  - 500 si error no esperado

**Technical Rationale:**
- Validar ownership es CRÍTICO para seguridad multi-tenant
- Retornar 404 para "no existe" y "no es tuyo" evita user enumeration
- GET no requiere Idempotency-Key (read-only)

**Acceptance Criteria:**
- ✅ Task propia retorna datos completos
- ✅ Task de otro user retorna 404
- ✅ Task no existente retorna 404
- ✅ Sin auth retorna 401

**Notes:**
- Usar endpoint para validar antes de edit/delete

---

### TASK: APPTODO-P1-TASKS-LIST - Endpoint: GET /api/v1/tasks

**Status:** Open  
**Depends on:** APPTODO-P1-TASKS-GET  
**Description:**
- Requiere auth
- Query params (filtros básicos, sin búsqueda aún):
  - limit: int (default: 1000, max: 5000) → LIMIT clause
  - cursor: opaque string (optional, next_cursor de response anterior)
  - include_deleted: bool (default: false) → WHERE deleted_at IS NULL/NOT NULL
- Response: {status: "success", data: {tasks: [...], pagination: {limit, next_cursor, has_more}}}
- Cursor-based pagination:
  - Si cursor presente: WHERE id > cursor_id (decode cursor)
  - Si no cursor: start from id=0
  - Retornar limit+1 rows para detectar has_more
  - next_cursor = encode(last_task.id) si has_more=true else null
  - Response tiene limit (limit dado) + next_cursor + has_more
- Orden: by id ASC (consistente)
- Filter automático: WHERE user_id = :user_id

**Technical Rationale:**
- Cursor-based pagination mejor que offset para grandes datasets (no rescane)
- Opaque cursor (base64 encoded) permite cambiar implementation sin breaking API
- include_deleted=false por defecto mantiene UI limpia
- limit default 1000 es reasonable (puede paginar si queremos menos)
- Orden by id asegura resultado consistente

**Acceptance Criteria:**
- ✅ Sin parámetros retorna todas las tareas del usuario (hasta 1000)
- ✅ Con limit=10 retorna máximo 10 tareas
- ✅ Si hay más tareas: has_more=true, next_cursor presente
- ✅ Si no hay más: has_more=false, next_cursor=null
- ✅ Cursor de response anterior funciona para next page
- ✅ include_deleted=true incluye soft-deleted (deleted_at NOT NULL)
- ✅ include_deleted=false (default) excluye deleted
- ✅ Tareas de otros usuarios NUNCA retornadas

**Notes:**
- Sin filtros complejos aún (fase 2)
- Soft delete: WHERE deleted_at IS NULL condicionalmente
- Logging: requests con grandes limits (detection de abuse)

---

### TASK: APPTODO-P1-TASKS-UPDATE - Endpoint: PUT /api/v1/tasks/:id

**Status:** Open  
**Depends on:** APPTODO-P1-TASKS-LIST  
**Description:**
- Requiere auth e Idempotency-Key
- Path param: id
- Input: {title?, description?, priority?, deadline?, status?} (fields opcionales)
- Validaciones:
  - Solo updateable fields permitidos (no: user_id, created_at, version, etc.)
  - title: max 255 chars si presente
  - description: max 5000 chars si presente
  - priority/status: enum values si presente
  - deadline: ISO date si presente
- Validar ownership
- Soft delete check: si deleted_at NOT NULL → error 410 Gone
- Idempotency igual a create
- Update task: SET updated_at = NOW(), version = version + 1
- Response: {status: "success", data: {task: {...updated...}}} (200 OK)
- Error responses:
  - 400 si validaciones fallan
  - 401 si no autenticado
  - 404 si task no existe O no es tuyo
  - 410 si task eliminada (soft deleted)
  - 500 si error no esperado

**Technical Rationale:**
- Fields parciales (PATCH-like pero con PUT) permiten actualizar solo lo necesario
- Whitelist de fields es crítico (nunca trust client con user_id, etc.)
- Soft deleted check: error 410 es semantic (resource "gone" but can restore)
- Version increment (sin optimistic locking aún, solo increment)
- Idempotency asegura que retries no crean duplicates

**Acceptance Criteria:**
- ✅ Actualizar title funciona
- ✅ Actualizar múltiples campos funciona
- ✅ No actualizar fields bloqueados (user_id, created_at, etc.)
- ✅ Validaciones de priority/status/deadline funcionan
- ✅ Soft deleted task retorna 410
- ✅ Version increment en cada update
- ✅ updated_at es timestamp de ahora
- ✅ Idempotency funciona (retry retorna mismo resultado)

**Notes:**
- Usar Pydantic model con Optional para campos parciales
- Version field preparado para optimistic locking (fase 2)
- Logging: updates (user_id, task_id, fields_changed)

---

### TASK: APPTODO-P1-TASKS-DELETE - Endpoint: DELETE /api/v1/tasks/:id

**Status:** Open  
**Depends on:** APPTODO-P1-TASKS-UPDATE  
**Description:**
- Requiere auth e Idempotency-Key
- Path param: id
- Soft delete: UPDATE tasks SET deleted_at = NOW() WHERE id = :id AND user_id = :user_id
- Response: {status: "success", data: {}} (204 No Content)
- Error responses:
  - 401 si no autenticado
  - 404 si task no existe O no es tuyo
  - 500 si error no esperado

**Technical Rationale:**
- Soft delete mantiene data para auditoría (event log futuro)
- Idempotent: si ya deleted_at, retornar 204 igual (no error)
- No retornar 410 (gone) en delete porque es operación "exitosa"
- 204 No Content es response standard para DELETE

**Acceptance Criteria:**
- ✅ Task válida soft-deleted (deleted_at set)
- ✅ Reintento con mismo Idempotency-Key retorna 204
- ✅ Task no aparece en GET /tasks (include_deleted=false por defecto)
- ✅ Task aparece en GET /tasks?include_deleted=true
- ✅ Task no existe O no es tuyo → 404
- ✅ Sin auth → 401

**Notes:**
- Hard delete NUNCA, siempre soft delete
- Idempotency igual a update
- Logging: soft delete (user_id, task_id, timestamp)

---

## EPIC: APPTODO-PHASE1-TESTING - Testing Phase 1 Backend

**Status:** Open  
**Depends on:** APPTODO-P1-TASKS-DELETE  
**Description:** Tests completos de todos los endpoints de fase 1 y validación de arquitectura.

**Rationale:**
Testing es parte integral del desarrollo, no "después". Validar que arquitectura base es sólida antes de escalar.

---

### TASK: APPTODO-P1-TEST-AUTH - Tests: Autenticación (Register, Login, Refresh, Logout, Me)

**Status:** Open  
**Depends on:** APPTODO-P1-AUTH-ME  
**Description:**
- Test suite: test_auth.py en app/tests/
- Fixtures: test_db (in-memory SQLite), test_client (TestClient de fastapi)
- Seed data: crear test users con contraseñas conocidas
- Tests para register:
  - ✅ valid user creado exitosamente
  - ✅ weak password rechazado
  - ✅ duplicate email/username rechazado (409)
  - ✅ invalid email rechazado
  - ✅ rate limiting funciona (>5 registros/min)
- Tests para login:
  - ✅ valid credentials retorna access_token y refresh cookie
  - ✅ invalid password → 401 (sin revelar user exist)
  - ✅ user no existe → 401
  - ✅ access_token decodeable con payload correcto
  - ✅ refresh cookie httpOnly
  - ✅ rate limiting funciona
- Tests para refresh:
  - ✅ valid refresh token retorna nuevo access token
  - ✅ expired refresh token → 401
  - ✅ token revocado → 401
  - ✅ access token nuevo tiene nuevo exp
- Tests para logout:
  - ✅ logout invalida refresh token
  - ✅ reintento refresh después de logout → 401
- Tests para /me:
  - ✅ con token válido retorna user
  - ✅ sin token → 401
  - ✅ token stale (user deleted pero token válido) → 401

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Coverage ≥90% de auth routers y services
- ✅ Tests ejecutan en <10s
- ✅ No hardcoded paths (use fixtures)

**Notes:**
- Usar pytest + pytest-fastapi
- Fixtures reaprovechar en otros tests
- Mocking passwords es OK, no usar reales

---

### TASK: APPTODO-P1-TEST-TASKS - Tests: CRUD de Tareas

**Status:** Open  
**Depends on:** APPTODO-P1-TASKS-DELETE  
**Description:**
- Test suite: test_tasks.py en app/tests/
- Fixtures: reutilizar test_client, test_db, test_user (logged in)
- Tests para create:
  - ✅ valid task creado
  - ✅ title vacío rechazado (400)
  - ✅ priority enum validation
  - ✅ deadline futuro funciona, pasado rechazado
  - ✅ Idempotency-Key requerido
  - ✅ mismo Idempotency-Key retorna mismo resultado (201 ambas veces)
  - ✅ different request body con mismo key → 409
- Tests para GET /:id:
  - ✅ task propia retorna
  - ✅ task de otro user → 404
  - ✅ non-existent → 404
- Tests para LIST:
  - ✅ retorna todas las tareas del user (up to limit)
  - ✅ limit funciona
  - ✅ cursor pagination funciona
  - ✅ include_deleted=false por defecto (soft deleted no retornadas)
  - ✅ include_deleted=true incluye soft deleted
  - ✅ has_more=true si hay más, next_cursor presente
  - ✅ tareas de otros users no retornadas
- Tests para UPDATE:
  - ✅ válido actualiza
  - ✅ partial updates funcionan
  - ✅ no permitir actualizar user_id
  - ✅ soft deleted task → 410
  - ✅ Idempotency-Key requerido
  - ✅ version increments
  - ✅ updated_at cambia
- Tests para DELETE:
  - ✅ soft delete funciona (deleted_at set)
  - ✅ GET después muestra deleted (include_deleted=true)
  - ✅ reintento delete con mismo key → 204

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Coverage ≥85% de task routers y services
- ✅ Tests ejecutan en <30s total
- ✅ Edge cases cubiertos

**Notes:**
- Usar factories para crear test tasks rápidamente
- Parametrize tests para enum values
- Test isolation: cada test debe limpiar su data

---

### TASK: APPTODO-P1-TEST-IDEMPOTENCY - Tests: Idempotency Key Management

**Status:** Open  
**Depends on:** APPTODO-P1-TEST-TASKS  
**Description:**
- Tests específicos para idempotency:
  - ✅ Key válido (UUID) aceptado
  - ✅ Key inválido (non-UUID) rechazado (400)
  - ✅ Mismo key + mismo request body → mismo response
  - ✅ Mismo key + diferente request body → 409
  - ✅ Requests con diferentes keys → respuestas independientes
  - ✅ Idempotency data expira (cleanup)
- Tests de race conditions:
  - ✅ Dos requests simultáneos con mismo key → uno gana, otro usa cached

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Race condition handling validado
- ✅ Cleanup de datos expirados funciona

**Notes:**
- Usar threading/async para simular race conditions
- Validation de que idempotency data NO se crea para GET

---

### TASK: APPTODO-P1-TEST-SECURITY - Tests: Seguridad (Validaciones, Rate Limiting, etc.)

**Status:** Open  
**Depends on:** APPTODO-P1-TEST-IDEMPOTENCY  
**Description:**
- Tests de seguridad:
  - ✅ SQL injection: payload malicioso en inputs rechazado
  - ✅ XSS: special chars en title/description no ejecutan (stored como text)
  - ✅ Traversal: user no puede acceder tasks de otros
  - ✅ Rate limiting: /auth/login bloqueado después de 5/min
  - ✅ Rate limiting: /auth/register bloqueado después de 5/min
  - ✅ CORS: requests de origin no permitido rechazados
  - ✅ Auth bypass: requests sin token rechazados (401)
  - ✅ Token expiration: access token viejo rechazado
  - ✅ Refresh token: revoked no funciona

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Vulnerability checklist completada
- ✅ OWASP Top 10 items cubiertos (en scope de TODO app)

**Notes:**
- No reinventar rate limiting (usar dependencia)
- Logging de intentos de seguridad fallo
- Documentar security findings

---

## EPIC: APPTODO-PHASE2 - Backend Avanzado (Filtros, Categorías, Batch)

**Status:** Open  
**Depends on:** APPTODO-P1-TEST-SECURITY  
**Description:** Endpoints avanzados del backend: filtros dinámicos en DB, categorías, batch operations, validaciones de negocio.

**Rationale:**
Con la base sólida, agregar features complejas que no degradan performance ni seguridad.

---

### TASK: APPTODO-P2-DB-CATEGORIES - Schema: Tablas categories + task_categories + task_events + idempotency_keys

**Status:** Open  
**Depends on:** APPTODO-P1-TEST-SECURITY  
**Description:**
- Nuevas migraciones alembic:
  - categories: id, user_id, name, color, created_at, updated_at + UNIQUE(user_id, name)
  - task_categories: task_id, category_id (M2M relation)
  - task_events: id, task_id, user_id, event_type, old_state JSON, new_state JSON, payload JSON, created_at
  - idempotency_keys: id, user_id, idempotency_key, request_hash, response_data JSON, status_code, expires_at, created_at
- Índices:
  - idx_categories_user_id
  - idx_task_categories_task_id, idx_task_categories_category_id
  - idx_task_events_task_id, idx_task_events_user_id, idx_task_events_event_type, idx_task_events_created_at
  - idx_idempotency_keys_user_id, idx_idempotency_keys_expires_at
- Script migration hecho idempotente (alembic handles)

**Acceptance Criteria:**
- ✅ All tables created
- ✅ All indices created
- ✅ Foreign keys configured
- ✅ Migrations reversible

**Notes:**
- Task_events para auditoría completa (event sourcing)
- Idempotency_keys para deduplicación requests
- Color field en categories para UI (future)

---

### TASK: APPTODO-P2-CATEGORIES-CRUD - Endpoints: Categorías CRUD (Create, Read, List, Update, Delete)

**Status:** Open  
**Depends on:** APPTODO-P2-DB-CATEGORIES  
**Description:**
- POST /api/v1/categories: crear categoría
  - Input: {name, color?}
  - Require auth + Idempotency-Key
  - Validaciones: name unique por user, max 100 chars, color opcional
  - Response: {status: "success", data: {category: {...}}}
- GET /api/v1/categories/:id: obtener categoría
  - Require auth
  - Validar ownership
  - Response: {status: "success", data: {category: {...}}}
- GET /api/v1/categories: listar categorías
  - Require auth
  - Query: limit (default 100), cursor
  - Cursor pagination igual a tasks
  - Response: {status: "success", data: {categories: [...], pagination: {...}}}
- PUT /api/v1/categories/:id: actualizar
  - Require auth + Idempotency-Key
  - Input: {name?, color?}
  - Validaciones: name unique (except own)
  - Response: {status: "success", data: {category: {...}}}
- DELETE /api/v1/categories/:id: eliminar
  - Require auth + Idempotency-Key
  - Hard delete (no soft delete, no tareas dependen)
  - Response: 204 No Content
  - Si categoría tiene tasks: error 409 (tasks still use it)

**Technical Rationale:**
- Categories son simples (no soft delete, hard delete con constraint)
- UNIQUE(user_id, name) en DB asegura nombres únicos por usuario
- Cursor pagination consistente con tasks

**Acceptance Criteria:**
- ✅ CRUD funciona
- ✅ Idempotency funciona en create/update/delete
- ✅ Ownership validado
- ✅ Constraints (unique name, can't delete if used) funcionan
- ✅ Otros usuarios no pueden acceder

**Notes:**
- Tests para categorías en suite aparte
- Logging de CRUD de categorías

---

### TASK: APPTODO-P2-TASKS-CATEGORIES - Endpoint: Asignar/Remover Categorías a Tareas

**Status:** Open  
**Depends on:** APPTODO-P2-CATEGORIES-CRUD  
**Description:**
- POST /api/v1/tasks/:id/categories: asignar categoría
  - Path: task_id
  - Input: {category_id}
  - Require auth + Idempotency-Key
  - Validaciones: task es tuya, categoria es tuya, relation no existe yet
  - Insert en task_categories
  - Response: {status: "success", data: {task: {..., categories: [...]}}}
  - Error: 409 si relation ya existe
- DELETE /api/v1/tasks/:id/categories/:category_id: remover
  - Path: task_id, category_id
  - Require auth + Idempotency-Key
  - Validaciones: task es tuya, categoria es tuya
  - Delete de task_categories
  - Response: 204 No Content
  - Error: 404 si relation no existe
- GET /api/v1/tasks/:id ahora incluye: categories: [{id, name, color}]

**Technical Rationale:**
- M2M relation permite task con múltiples categorías
- Endpoints separados (no inline en PUT /tasks) para clarity
- Idempotency en asignar (si ya existe, retornar 201 con task)
- DELETE de categoría falla si hay tasks usando (409)

**Acceptance Criteria:**
- ✅ Asignar categoría funciona
- ✅ Remover categoría funciona
- ✅ Task retorna categorías en GET
- ✅ Validaciones funciona (no other user's category)
- ✅ Idempotency funciona

**Notes:**
- Tests de M2M relations
- List tasks filtrando por category (fase 2 filtros)

---

### TASK: APPTODO-P2-TASKS-FILTERS-DB - Endpoint: GET /api/v1/tasks con Filtros en DB

**Status:** Open  
**Depends on:** APPTODO-P2-TASKS-CATEGORIES  
**Description:**
- Expandir GET /api/v1/tasks con filtros:
  - Query params:
    - status: 'pendiente'|'en_progreso'|'completada' (single or comma-separated list)
    - priority: 'baja'|'media'|'alta' (single or comma-separated list)
    - deadline_from: ISO date (WHERE deadline >= :from)
    - deadline_to: ISO date (WHERE deadline <= :to)
    - category_id: int or comma-separated (JOIN task_categories WHERE category_id IN (...))
    - search: text (WHERE title LIKE '%search%' OR description LIKE '%search%')
    - sort: 'deadline'|'priority'|'created_at'|'updated_at' (default: deadline)
    - order: 'asc'|'desc' (default: asc)
    - include_deleted: bool (default: false)
- Filtros se aplican en DB (no en-memory aún, todo en SELECT)
- Índices existentes optimizan: idx_tasks_user_status, idx_tasks_deadline, etc.
- Response estructura igual: {status: "success", data: {tasks: [...], pagination: {...}}}

**Technical Rationale:**
- DB-side filtering es más eficiente (no cargar todas las tareas)
- Parámetros como comma-separated lists permite IN clauses
- search en LIKE (sin fulltext aún, simple es OK para MVP)
- Sort options flexibles para future UX needs
- Índices hacen queries rápidas (idx_tasks_user_status para user + status combo)

**Acceptance Criteria:**
- ✅ status filter funciona (single y múltiples)
- ✅ priority filter funciona
- ✅ deadline_from/to funcionan
- ✅ category_id filter funciona (JOIN correcto)
- ✅ search funciona (case-insensitive)
- ✅ sort funciona (todos los options)
- ✅ order funciona (asc/desc)
- ✅ Combinación de filtros funciona (AND logic)
- ✅ Cursor pagination funciona con filtros

**Notes:**
- Query builder bien organizado (SQLAlchemy ORM o raw SQL)
- Logging de complex queries (para monitoring)
- Tests de cada filtro + combinaciones

---

### TASK: APPTODO-P2-TASKS-BATCH - Endpoints: Batch Operations

**Status:** Open  
**Depends on:** APPTODO-P2-TASKS-FILTERS-DB  
**Description:**
- POST /api/v1/tasks/batch/complete: marcar múltiples como completadas
  - Input: {task_ids: [1, 2, 3]}
  - Require auth + Idempotency-Key
  - Validaciones: todas las tasks son tuyas
  - UPDATE tasks SET status='completada', completed_at=NOW() WHERE id IN (...)
  - Response: {status: "success", data: {updated_count: 3}}
  - Error: 400 si list vacía, 404 si alguna task no existe
- POST /api/v1/tasks/batch/delete: soft delete múltiples
  - Input: {task_ids: [1, 2, 3]}
  - Require auth + Idempotency-Key
  - UPDATE tasks SET deleted_at=NOW() WHERE id IN (...)
  - Response: {status: "success", data: {updated_count: 3}}
- POST /api/v1/tasks/batch/priority: cambiar prioridad a múltiples
  - Input: {task_ids: [1, 2, 3], priority: 'alta'}
  - Require auth + Idempotency-Key
  - UPDATE tasks SET priority=:priority WHERE id IN (...)
  - Response: {status: "success", data: {updated_count: 3}}
- POST /api/v1/tasks/batch/category: asignar categoría a múltiples
  - Input: {task_ids: [1, 2, 3], category_id: 5}
  - Require auth + Idempotency-Key
  - INSERT INTO task_categories (task_id, category_id) ... (skip if exists)
  - Response: {status: "success", data: {updated_count: 3}}
- Todos requieren: no empty list, todas las tasks son tuyas, Idempotency-Key
- Rate limiting: 20 requests/min (más permisivo que single updates)

**Technical Rationale:**
- Batch operations mejoran UX (multi-select en frontend → una API call)
- Transaction por batch asegura atomicity (all or nothing)
- Rate limiting más permisivo (batch es feature, not spam vector)
- Idempotency permite safe retries

**Acceptance Criteria:**
- ✅ Todos los batch operations funcionan
- ✅ Validaciones (no empty, ownership) funcionan
- ✅ Updated_count retornado correctamente
- ✅ Idempotency funciona (same request → same result)
- ✅ No permitir tareas de otros usuarios
- ✅ Rate limiting funciona

**Notes:**
- Usar database transactions (ACID)
- Logging de batch operations (user_id, operation, count)
- Tests de batch operations

---

### TASK: APPTODO-P2-TASKS-RESTORE - Endpoint: Restaurar Tarea Eliminada

**Status:** Open  
**Depends on:** APPTODO-P2-TASKS-BATCH  
**Description:**
- PATCH /api/v1/tasks/:id/restore: restaurar soft-deleted task
  - Require auth + Idempotency-Key
  - Validación: task existe (include deleted), es tuya, deleted_at NOT NULL
  - UPDATE tasks SET deleted_at=NULL WHERE id=:id
  - Response: {status: "success", data: {task: {...}}}
  - Error: 400 si task no está deleteda (deleted_at IS NULL)
  - Error: 404 si task no existe

**Technical Rationale:**
- Soft delete permite restore (undo)
- PATCH porque es operación parcial (no reemplaza todo)
- Validar que task está realmente deleteda (no error si ya restored)

**Acceptance Criteria:**
- ✅ Deleted task puede restaurarse
- ✅ deleted_at set a NULL
- ✅ Restored task aparece en GET /tasks (include_deleted=false)
- ✅ No deleted task → 400
- ✅ Idempotency funciona

**Notes:**
- Simétrico con DELETE (soft delete) operación

---

### TASK: APPTODO-P2-TASK-EVENTS - Endpoint: Event Log de Tarea (Auditoría)

**Status:** Open  
**Depends on:** APPTODO-P2-TASKS-RESTORE  
**Description:**
- GET /api/v1/tasks/:id/events: obtener historial de cambios
  - Require auth
  - Query: limit (default 100), cursor
  - Response: {status: "success", data: {events: [...], pagination: {...}}}
  - Event structure: {id, event_type, old_state, new_state, payload, created_at, user: {id, username}}
  - Event types: task_created, task_updated, task_completed, status_changed, priority_changed, deadline_changed, category_added, category_removed, task_deleted, task_restored
- Validación: task es tuya, existe
- Error: 404 si task no existe
- Populate events:
  - CREATE task → task_created event (payload: {title, description, priority})
  - UPDATE task → task_updated event (old_state: old values, new_state: new values)
  - DELETE (soft) task → task_deleted event
  - RESTORE task → task_restored event
  - Cambios en categories → category_added/removed events

**Technical Rationale:**
- Event log permite auditoría completa (quién, qué, cuándo)
- old_state + new_state permite rebuild de estado anterior
- Event sourcing foundation para features futuras (undo/redo, replay)
- Cursor pagination en eventos también

**Acceptance Criteria:**
- ✅ Eventos se crean para todos los cambios
- ✅ GET /events retorna en orden cronológico
- ✅ Event data correcto (old_state, new_state, type)
- ✅ Cursor pagination funciona
- ✅ Otros usuarios no pueden ver eventos de tareas ajenas

**Notes:**
- Crear eventos en DB on each CRUD operation
- Logging de quién hizo qué (user_id en evento)
- Tests de event creation + retrieval

---

## EPIC: APPTODO-PHASE3 - Frontend Base (Vue 3 + Router + Auth)

**Status:** Open  
**Depends on:** APPTODO-P2-TASK-EVENTS  
**Description:** Frontend base con Vue 3, TypeScript, Router, Pinia stores, login y estructura de dashboard.

**Rationale:**
Con backend completo, construir frontend sólido que comunique con API.

---

### TASK: APPTODO-P3-SETUP - Setup: Vue 3 + TypeScript + Bun + Router

**Status:** Open  
**Depends on:** APPTODO-P2-TASK-EVENTS  
**Description:**
- Crear estructura en `/app/frontend`
- Bun como package manager + bundler
- Instalar: vue@3, vue-router@4, pinia, axios, typescript
- Estructura de directorios:
  - src/components/ (Vue components)
  - src/views/ (Pages)
  - src/stores/ (Pinia stores)
  - src/types/ (TypeScript interfaces)
  - src/utils/ (Helpers)
  - src/styles/ (SCSS/CSS)
  - src/api/ (API client)
  - src/router/index.ts (Router config)
  - public/ (Static assets)
- Setup TypeScript: tsconfig.json con strict mode
- Estructura main.ts, App.vue
- Bun config: bun.lockb, bunfig.toml (si necesario)
- Dev server en puerto 5173 (vite default)

**Acceptance Criteria:**
- ✅ `bun install` instala dependencias
- ✅ `bun run dev` inicia servidor en localhost:5173
- ✅ App.vue renderiza
- ✅ TypeScript stricto, sin errores
- ✅ Router disponible (vacío aún)

**Notes:**
- Vite default bundler (Bun lo usa)
- SCSS para estilos (install sass)
- ESLint + Prettier para code quality

---

### TASK: APPTODO-P3-ROUTER - Configurar Vue Router: Rutas Básicas

**Status:** Open  
**Depends on:** APPTODO-P3-SETUP  
**Description:**
- Crear src/router/index.ts con rutas:
  - /login → LoginView
  - /dashboard → DashboardView (protected)
  - /register → RegisterView (optional, if not inline)
  - Catch-all → redirect /login o 404 view
- Guard: if not authenticated → redirect /login
- Guard: if authenticated AND on /login → redirect /dashboard
- Router history: createWebHistory
- Lazy loading: views cargadas con dynamic import

**Technical Rationale:**
- Router guards aseguran only authenticated users ven dashboard
- Dynamic import reduce bundle size inicial
- SimpleAuth check (token en memory)

**Acceptance Criteria:**
- ✅ Routes configuradas
- ✅ Guards funcionan (unauth → /login)
- ✅ Lazy loading de views funciona
- ✅ Navigation entre rutas funciona

**Notes:**
- Guards reutilizan AuthStore (created en siguiente task)

---

### TASK: APPTODO-P3-AUTH-STORE - Pinia Store: AuthStore (login, logout, user, isAuthenticated)

**Status:** Open  
**Depends on:** APPTODO-P3-ROUTER  
**Description:**
- Crear src/stores/authStore.ts (Pinia)
- State:
  - user: {id, username, email} | null
  - isAuthenticated: boolean
  - accessToken: string | null (en memory)
  - isLoading: boolean
  - error: string | null
- Actions:
  - login(email/username, password): POST /api/v1/auth/login, guarda token, user
  - logout(): POST /api/v1/auth/logout, limpia token/user
  - register(username, email, password): POST /api/v1/auth/register
  - refresh(): POST /api/v1/auth/refresh, obtiene nuevo token
  - fetchUser(): GET /api/v1/auth/me, carga user si token presente
  - setAccessToken(token): setter para token
  - clearAuth(): helper para logout
- Getters:
  - isAuthenticated: boolean (user !== null)
  - hasValidToken: boolean (token presente)
- Persistencia: NO guardar token en localStorage (in-memory only)
  - accessToken se pierde al refresh de página (expected)
  - Usar refresh token (en cookie) para reautenticar

**Technical Rationale:**
- Access token in-memory: seguro contra XSS (no en localStorage)
- Refresh token en cookie httpOnly: seguro contra CSRF + XSS
- fetchUser() en app init permite recover session (si refresh token válido)
- AuthStore centraliza lógica de auth (no duplicar en componentes)

**Acceptance Criteria:**
- ✅ Login guarda token + user
- ✅ Logout limpia todo
- ✅ isAuthenticated cambia correctamente
- ✅ fetchUser() obtiene user del /me endpoint
- ✅ Token no persiste en localStorage
- ✅ Refresh token automático (handled en API interceptor, próxima task)

**Notes:**
- Usar defineStore() (Pinia v2+)
- Type interfaces para user, state
- Logging de auth events (debug)

---

### TASK: APPTODO-P3-API-INTERCEPTOR - API Client: Axios + Interceptor para Auth + Refresh Token

**Status:** Open  
**Depends on:** APPTODO-P3-AUTH-STORE  
**Description:**
- Crear src/api/client.ts (axios instance)
- Configurar:
  - baseURL: http://localhost:8000/api/v1/
  - timeout: 30s
  - headers: Content-Type: application/json
- Request interceptor:
  - Agregar Authorization: Bearer <token> si existe
  - Agregar Idempotency-Key si es mutator (POST/PUT/DELETE) (usar uuid4 o header existente)
  - Inyectar user agent
- Response interceptor:
  - Si 401 (Unauthorized):
    - Verificar si es /auth/refresh (no reintentar si refresh falla)
    - POST /auth/refresh (automático)
    - Si refresh OK: reintentar request original con nuevo token
    - Si refresh falla: logout user, redirect /login
  - Si 4xx/5xx: procesar error, pasar a componente
  - Si success: retornar response.data
- Error handling:
  - Crear clase AppError(status, message, details)
  - Mapear errores de backend → user-friendly messages (en español?)
  - Logging de errores (console.error en dev, sentry futuro)

**Technical Rationale:**
- Interceptor centraliza logic de token refresh (no duplicar en cada call)
- Idempotency-Key automático previene duplicates en retries
- 401 + auto-refresh permite transparent token renewal
- Error class permite typed error handling

**Acceptance Criteria:**
- ✅ Requests tienen Authorization header
- ✅ Idempotency-Key presente en POST/PUT/DELETE
- ✅ 401 triggers refresh automático
- ✅ Refresh exitoso retinta request original
- ✅ Refresh fallo logout + redirect /login
- ✅ Errores mapeados a mensajes user-friendly

**Notes:**
- Usar axios response type para JSON
- Testing: mock axios para tests de componentes
- Idempotency-Key generation puede usar uuid4 o store timestamp

---

### TASK: APPTODO-P3-LOGIN-VIEW - Componente: LoginView (Login + Register en mismo lugar o tabs)

**Status:** Open  
**Depends on:** APPTODO-P3-API-INTERCEPTOR  
**Description:**
- Crear src/views/LoginView.vue
- Estructura:
  - Tabs o toggle entre "Login" y "Register"
  - Form campos:
    - Login: email/username, password
    - Register: username, email, password, confirm password
  - Validaciones en frontend:
    - Email format (básico)
    - Password strength indicator (visual)
    - Confirm password match
  - Buttons: Submit (Login/Register), Clear
  - Error display: banner con error message del servidor
  - Loading state: button deshabilitado, spinner
  - Success: redirect /dashboard automático
- Componentes helper:
  - PasswordStrengthMeter (visual indicator)
  - FormInput (reusable input component)
- Styling: responsive (mobile-first), dark mode compatible

**Technical Rationale:**
- Tabs en mismo lugar = UX simple, no navegación extra
- Frontend validations = feedback rápido (no server round-trip)
- Backend revalida siempre (nunca trust client)
- Password strength meter educa users (security UX)

**Acceptance Criteria:**
- ✅ Login funciona (llama authStore.login, redirects /dashboard)
- ✅ Register funciona (llama authStore.register)
- ✅ Validaciones frontend funcionan
- ✅ Errores servidor mostrados al usuario
- ✅ Loading state visible
- ✅ Responsive design

**Notes:**
- Uso de v-model para form data
- Watch para redirect automático
- Reusable FormInput component
- Accessibility: labels, aria-labels

---

### TASK: APPTODO-P3-DASHBOARD-STRUCTURE - Componente: DashboardView (Estructura base)

**Status:** Open  
**Depends on:** APPTODO-P3-LOGIN-VIEW  
**Description:**
- Crear src/views/DashboardView.vue
- Estructura:
  - Header: branding, user menu (username + logout button)
  - Sidebar/NavBar: navegación (future: multiple views)
  - Main content area: placeholder para TaskList
  - Footer: opcional, info
- Layout: responsive (sidebar colapsable en mobile)
- User menu: dropdown con "Profile" (future), "Logout"
- Logout button: POST /api/v1/auth/logout, redirect /login
- Componentes:
  - Header.vue (reusable, contiene user menu)
  - Sidebar.vue (future: más items)
  - LayoutWrapper.vue (contenedor principal)

**Technical Rationale:**
- Estructura base permite agregar features sin refactoring
- Header + Sidebar pattern familiar
- User menu centralizado

**Acceptance Criteria:**
- ✅ Layout renderiza sin errores
- ✅ User menu funciona
- ✅ Logout funciona (POST + redirect /login)
- ✅ Responsive design
- ✅ Placeholder para TaskList

**Notes:**
- Component composition (Header, Sidebar are separate)
- TailwindCSS o SCSS para styling
- Dark mode toggle (future)

---

## EPIC: APPTODO-PHASE4 - Frontend Features (Tareas + Filtros + Interacción)

**Status:** Open  
**Depends on:** APPTODO-P3-DASHBOARD-STRUCTURE  
**Description:** Componentes principales, stores de tareas, integración API, selección múltiple, acciones batch.

---

### TASK: APPTODO-P4-TASK-STORE - Pinia Store: TaskStore (tasks, filtros, computed visibleTasks)

**Status:** Open  
**Depends on:** APPTODO-P3-DASHBOARD-STRUCTURE  
**Description:**
- Crear src/stores/taskStore.ts (Pinia)
- State:
  - tasks: Task[] (raw data from API)
  - filters: {status?: string[], priority?: string[], category_id?: number[], search?: string, deadline_from?: date, deadline_to?: date, sort?: string, order?: string}
  - isLoading: boolean
  - error: string | null
  - cursor: string | null (pagination)
  - hasMore: boolean
- Actions:
  - fetchTasks(params?): GET /api/v1/tasks, carga tasks (con filtros si present en state.filters)
  - createTask(taskData): POST /api/v1/tasks, agregar a tasks[]
  - updateTask(id, data): PUT /api/v1/tasks/:id, update en tasks[] (find + modify)
  - deleteTask(id): DELETE /api/v1/tasks/:id, set deleted_at
  - restoreTask(id): PATCH /api/v1/tasks/:id/restore, unset deleted_at
  - setFilters(filters): actualizar state.filters, refetch tasks
  - resetFilters(): clear filters, refetch all
  - loadMore(): fetch con cursor (próxima página)
  - batchComplete(taskIds): POST /api/v1/tasks/batch/complete
  - batchDelete(taskIds): POST /api/v1/tasks/batch/delete
  - batchPriority(taskIds, priority): POST /api/v1/tasks/batch/priority
  - batchCategory(taskIds, categoryId): POST /api/v1/tasks/batch/category
- Computed:
  - visibleTasks: tasks (todos) vs filtered en memoria (opcional post-fetch)
  - filteredTasks(filters): apply filters in-memory (search, etc.)
  - tasksByStatus: group by status
  - countByStatus: counts de tareas por status
  - overdueTasks: tasks con deadline < today
- Getters:
  - taskById(id): find task por id
  - hasUnsyncedChanges: boolean (future: offline support)

**Technical Rationale:**
- TaskStore centraliza task logic (no duplicar en componentes)
- state.filters es filtros activos actuales (UI state)
- visibleTasks computed permite efficient rendering (recompute solo si tasks/filters cambian)
- Batch operations optimizan UX (multi-select → una API call)
- Cursor pagination en store permite infinite scroll futuro

**Acceptance Criteria:**
- ✅ fetchTasks obtiene tareas de API
- ✅ createTask agrega nueva task
- ✅ updateTask modifica task en place
- ✅ deleteTask marca como eliminada
- ✅ setFilters aplica filtros + refetch
- ✅ visibleTasks computed recomputa eficientemente
- ✅ Batch operations funcionan

**Notes:**
- Type interface: interface Task { id, title, ..., status, categories: Category[] }
- Usar storeToRefs() para state reactivo
- Logging de cambios de filtros

---

### TASK: APPTODO-P4-UI-STORE - Pinia Store: UIStore (selectedTasks, focusedTask, modals, shortcuts)

**Status:** Open  
**Depends on:** APPTODO-P4-TASK-STORE  
**Description:**
- Crear src/stores/uiStore.ts (Pinia)
- Separación: UIStore = UI state (no domain logic), TaskStore = domain
- State:
  - selectedTaskIds: number[] (para batch operations)
  - focusedTaskId: number | null (para keyboard navigation)
  - modals: {createEditTask: boolean, deleteConfirm: boolean, ...}
  - shortcuts: {enabled: boolean, lastPressed: string[]} (para keyboard handler)
  - toasts: {message, type: 'success'|'error'|'info', id} []
  - sidebarCollapsed: boolean
- Actions:
  - selectTask(id): agregar id a selectedTaskIds
  - deselectTask(id): remover de selectedTaskIds
  - toggleSelect(id): toggle en selectedTaskIds
  - selectAll(taskIds): selected = all
  - clearSelection(): selectedTaskIds = []
  - setFocusedTask(id): focusedTaskId = id
  - openModal(name): modals[name] = true
  - closeModal(name): modals[name] = false
  - addToast(message, type): crear toast (auto-clear en 5s)
  - removeToast(id): remover toast
  - toggleSidebar(): sidebar toggle
- Getters:
  - isTaskSelected(id): boolean
  - selectionCount: number
  - hasSelection: boolean
  - hasActiveModal: boolean (any modal open)
  - currentModals: list de open modals

**Technical Rationale:**
- Separar UI state de domain state permite clean testing
- selectedTaskIds = estado de multi-select checkboxes
- focusedTaskId = para keyboard navigation (highlighting)
- modals = modal state (no en componentes, centralized)
- toasts = notifications (success/error messages)
- UIStore no depende de TaskStore (clean separation)

**Acceptance Criteria:**
- ✅ Selection funciona (select, deselect, toggle, selectAll)
- ✅ Modal state funciona (open, close)
- ✅ Focused task tracking funciona
- ✅ Toasts crean/eliminan automáticamente
- ✅ Sidebar toggle funciona

**Notes:**
- Toast auto-clear después de 5s (usar timeout)
- selectedTaskIds vacío si no hay selección
- UIStore accesible desde templates (con useStore())

---

### TASK: APPTODO-P4-TASK-ITEM-COMPONENT - Componente: TaskItem.vue (Card individual)

**Status:** Open  
**Depends on:** APPTODO-P4-UI-STORE  
**Description:**
- Crear src/components/TaskItem.vue
- Props: task (Task), isSelected: boolean, isFocused: boolean
- Emits: @click, @select-toggle, @edit, @delete
- Estructura:
  - Checkbox (isSelected binding)
  - Task info: title, description preview, priority badge, deadline
  - Categories: badges inline
  - Status: color-coded indicator
  - Actions: Edit, Delete buttons (hover to show)
  - Drag handle (future: drag-drop)
- Styling:
  - Priority colors: baja=gray, media=yellow, alta=red
  - Status colors: pendiente=blue, en_progreso=orange, completada=green
  - Selected state: highlight background
  - Focused state: border highlight + keyboard navigation
  - Responsive: flex layout
- Interactions:
  - Click → emit select (o focus para keyboard nav)
  - Checkbox → emit select-toggle
  - Edit button → emit edit (abre modal)
  - Delete button → emit delete (soft delete)

**Technical Rationale:**
- Card design permite displays limpio de múltiples tareas
- Color-coding visual aids comprehension (status, priority)
- Checkbox para batch selection (multi-select)
- Separar TaskItem permite reusability y testing

**Acceptance Criteria:**
- ✅ TaskItem renderiza con todos los campos
- ✅ Checkbox funciona (v-model, emit select-toggle)
- ✅ Colors y styling correcto
- ✅ Buttons funcionales (emits)
- ✅ Responsive en mobile

**Notes:**
- Usar component composition para badges (PriorityBadge.vue, etc.)
- Accessibility: labels en checkbox, semantic HTML
- Testing: unit test para props + emits

---

### TASK: APPTODO-P4-TASK-FORM-COMPONENT - Componente: TaskForm.vue (Modal Create/Edit)

**Status:** Open  
**Depends on:** APPTODO-P4-TASK-ITEM-COMPONENT  
**Description:**
- Crear src/components/TaskForm.vue
- Props: task?: Task (if edit), mode: 'create'|'edit'
- Emits: @submit, @cancel, @delete
- Estructura (modal):
  - Title: "Nueva Tarea" o "Editar Tarea"
  - Form fields:
    - title: text input, required, max 255 chars (char counter)
    - description: textarea, optional, max 5000 chars
    - priority: dropdown (baja, media, alta)
    - deadline: date input, optional
    - categories: multi-select checkboxes (load from store)
  - Validations:
    - title required + non-empty
    - deadline future (validate on blur)
    - character counters (visual feedback)
  - Buttons: Submit (Create/Update), Cancel
  - Error display: inline field errors o banner
  - Loading state: button disabled during submit
- Form behavior:
  - Create mode: clear form after submit
  - Edit mode: populate fields from task prop
  - Cancel → closeModal
  - Submit → emit with form data

**Technical Rationale:**
- Modal component permits focused editing
- Character counters educate users (field limits)
- Validations frontend (backend revalida)
- Multi-select categories permite assign during create/edit

**Acceptance Criteria:**
- ✅ Create mode funciona (empty form, submit creates)
- ✅ Edit mode funciona (populate, submit updates)
- ✅ Validations frontend funcionan (required, limits)
- ✅ Categories dropdown carga y permite select
- ✅ Submit emits correcto
- ✅ Cancel cierra sin guardar

**Notes:**
- Usar v-model para form data (local state)
- Watch task prop para populate en edit mode
- Pinia action para crear/actualizar (en componente o store)
- Accessibility: labels, form elements

---

### TASK: APPTODO-P4-FILTER-BAR-COMPONENT - Componente: FilterBar.vue (Filtros dinámicos)

**Status:** Open  
**Depends on:** APPTODO-P4-TASK-FORM-COMPONENT  
**Description:**
- Crear src/components/FilterBar.vue
- Props: none (consume taskStore + uiStore)
- Estructura:
  - Status filter: checkboxes [Pendiente, En Progreso, Completada]
  - Priority filter: checkboxes [Baja, Media, Alta]
  - Deadline filter: date range pickers (desde, hasta) o presets (Hoy, Esta semana, Este mes)
  - Categories filter: multi-select (load de categores via API o store)
  - Search input: text, real-time filtering
  - Sort: dropdown (Deadline, Prioridad, Fecha creación)
  - Order: radio (Ascendente, Descendente)
  - Include deleted: checkbox
  - Buttons: Apply, Reset filters, Toggle advanced (future)
- Behavior:
  - Cada cambio → taskStore.setFilters()
  - Filtros aplicados triggean fetchTasks (con parámetros)
  - Reset → taskStore.resetFilters()
  - Search es real-time (debounced, 500ms)
  - Mobile: filter colapsable, toggle para mostrar
- Styling:
  - Responsive: grid layout (mobile: single column)
  - Icons para filters (visual)
  - Color feedback (filtered count)

**Technical Rationale:**
- Centralized filter UI = consistent UX
- Real-time search (debounced) = feedback rápido sin spam
- Filter state en store = persist durante sesión
- Presets para deadline (common use cases)

**Acceptance Criteria:**
- ✅ Status/Priority checkboxes funcionan
- ✅ Deadline range picker funciona
- ✅ Categories multi-select funciona
- ✅ Search real-time (debounced)
- ✅ Sort + Order dropdowns funcionan
- ✅ Include deleted checkbox funciona
- ✅ Apply → calls taskStore.setFilters
- ✅ Reset clears filters

**Notes:**
- Usar Pinia composition (computed + actions)
- Debounce search (usar lodash debounce)
- Icons de feather-icons o heroicons
- Testing: unit test para filter logic

---

### TASK: APPTODO-P4-TASK-LIST-COMPONENT - Componente: TaskList.vue (Renderiza lista filtrada)

**Status:** Open  
**Depends on:** APPTODO-P4-FILTER-BAR-COMPONENT  
**Description:**
- Crear src/components/TaskList.vue
- Props: none (consume taskStore + uiStore)
- Estructura:
  - FilterBar (top)
  - Actions toolbar: Create button, Batch actions button (si hay selección)
  - Task list: TaskItem para cada task en taskStore.visibleTasks
  - Empty state: "No hay tareas" mensaje si tasks.length === 0
  - Loading state: spinner si isLoading === true
  - Error state: error banner si error present
  - Pagination: "Load more" button si hasMore === true (cursor pagination)
- Multi-select:
  - Select all checkbox (header)
  - Individual checkboxes en TaskItem
  - Selection count display (X tasks selected)
- Batch actions (appear si hasSelection):
  - Complete selected button (Mark completed)
  - Delete selected button (Soft delete)
  - Priority dropdown (Change priority)
  - Category dropdown (Add category)
- Keyboard navigation:
  - Arrow keys: navigate focused task
  - Enter: open edit modal
  - Space: toggle selection
  - Escape: clear selection + close modal
- Sorting/Filtering:
  - Aplicado via FilterBar → taskStore.setFilters()
  - List automáticamente recomputa (computed visibleTasks)

**Technical Rationale:**
- TaskList = orchestrator component (glues FilterBar + TaskItem)
- visibleTasks computed = reactive (re-render si tasks/filters change)
- Batch actions toolbar = prominent (only show si selección active)
- Keyboard nav = productivity feature (parte de shortcuts, implementado después)
- Cursor pagination = scalable (no load all tasks at once)

**Acceptance Criteria:**
- ✅ FilterBar integrado y funcional
- ✅ TaskItems renderizadas
- ✅ Create button funciona (abre modal)
- ✅ Multi-select funciona (checkboxes + select all)
- ✅ Batch actions toolbar visible si hay selección
- ✅ Empty/Loading/Error states funcionales
- ✅ Load more button funciona (cursor pagination)

**Notes:**
- Usar v-for con :key="task.id" para list rendering
- Watch taskStore.tasks para rerender
- Pinia composition con taskStore + uiStore
- Accessibility: labels, ARIA attributes

---

### TASK: APPTODO-P4-API-INTEGRATION - Integración Completa API: Conectar Tasks Componentes ↔ Backend

**Status:** Open  
**Depends on:** APPTODO-P4-TASK-LIST-COMPONENT  
**Description:**
- TaskStore actions:
  - fetchTasks() → GET /api/v1/tasks (con parámetros de filters)
  - createTask() → POST /api/v1/tasks (Idempotency-Key auto)
  - updateTask() → PUT /api/v1/tasks/:id (Idempotency-Key auto)
  - deleteTask() → DELETE /api/v1/tasks/:id (Idempotency-Key auto)
  - restoreTask() → PATCH /api/v1/tasks/:id/restore (Idempotency-Key auto)
  - batchComplete() → POST /api/v1/tasks/batch/complete
  - batchDelete() → POST /api/v1/tasks/batch/delete
  - batchPriority() → POST /api/v1/tasks/batch/priority
  - batchCategory() → POST /api/v1/tasks/batch/category
- CategoryStore (nuevo, simple):
  - fetchCategories() → GET /api/v1/categories
  - createCategory() → POST /api/v1/categories (Idempotency-Key auto)
  - updateCategory() → PUT /api/v1/categories/:id
  - deleteCategory() → DELETE /api/v1/categories/:id
  - assignToTask() → POST /api/v1/tasks/:id/categories (Idempotency-Key auto)
- API client:
  - Usar axios instance (desde task anterior)
  - Request interceptor: Auth header + Idempotency-Key
  - Response interceptor: 401 refresh + retry
  - Error handling: user-friendly messages
- Testing:
  - Mock axios responses (en tests)
  - Test actions (fetch, create, update, delete, batch)
  - Test error scenarios (404, 401, 400, 500)

**Technical Rationale:**
- Centralized API logic en stores (actions)
- Idempotency-Key automático en interceptor
- Error handling centralizado
- Mock axios en tests evita real HTTP calls

**Acceptance Criteria:**
- ✅ fetchTasks obtiene y popula store
- ✅ createTask hace POST, agrega a store
- ✅ updateTask hace PUT, modifica en store
- ✅ deleteTask hace DELETE, marca como eliminada
- ✅ Batch operations funcionan
- ✅ Filtros enviados en query params
- ✅ Error responses manejan gracefully
- ✅ Loading states durante API calls

**Notes:**
- Use Composition API en stores (defineStore)
- Try/catch en actions para error handling
- Logging de API calls (dev console)
- Testing: vitest + vue test utils

---

### TASK: APPTODO-P4-DELETE-CONFIRM-MODAL - Componente: DeleteConfirmModal.vue (Confirmación soft-delete)

**Status:** Open  
**Depends on:** APPTODO-P4-API-INTEGRATION  
**Description:**
- Crear src/components/DeleteConfirmModal.vue
- Props: task: Task
- Emits: @confirm, @cancel
- Estructura (modal):
  - Title: "¿Eliminar tarea?"
  - Message: "Tarea: {task.title}" (preview)
  - Nota: "Soft-deleted (puede restaurarse)"
  - Buttons: Delete (danger color), Cancel
  - Acciones:
    - Delete → emit confirm (taskStore.deleteTask en parent)
    - Cancel → emit cancel (closeModal)
    - Esc key → cancel
- Styling:
  - Modal warning colors (red/orange)
  - Buttons: danger red para delete, neutral para cancel

**Technical Rationale:**
- Confirmación previene accidental deletes
- Soft delete nota educates (puede restore)
- Modal reusable

**Acceptance Criteria:**
- ✅ Modal renderiza con task info
- ✅ Delete button emits confirm
- ✅ Cancel button emits cancel
- ✅ Esc key cierra

**Notes:**
- Usar keyboard event listener (Esc)
- Modal component (reusable base)

---

## EPIC: APPTODO-PHASE5 - Atajos de Teclado (Shortcuts)

**Status:** Open  
**Depends on:** APPTODO-P4-DELETE-CONFIRM-MODAL  
**Description:** Sistema centralizado de atajos de teclado (9 atajos totales, context-aware).

**Rationale:**
Atajos = productivity feature crítica. Implementar centralizado (gesture manager) permite reuse + testing.

---

### TASK: APPTODO-P5-SHORTCUTS-MANAGER - Gestor de Atajos Centralizado

**Status:** Open  
**Depends on:** APPTODO-P4-DELETE-CONFIRM-MODAL  
**Description:**
- Crear src/utils/shortcutsManager.ts
- Estructura:
  - registerShortcut(key: string, handler: () => void, config?: {global: bool, ctrlKey?: bool, shiftKey?: bool, altKey?: bool, metaKey?: bool})
  - unregisterShortcut(key: string)
  - handleKeyDown(event: KeyboardEvent) → match registered shortcuts, call handlers
  - isModalOpen() → check if modal bloques global shortcuts
  - getActiveShortcuts() → list shortcuts (for UI help)
- Shortcuts (9 total):
  1. Ctrl+K (o Cmd+K): Abrir formulario nueva tarea
  2. E: Editar tarea seleccionada
  3. D: Soft delete tarea seleccionada (con confirm)
  4. Shift+D: Restaurar tarea eliminada seleccionada
  5. Space: Marcar como completada/pendiente (toggle status)
  6. 1, 2, 3: Cambiar prioridad a baja, media, alta
  7. Shift+↑/↓: Selección múltiple (nav + shift)
  8. B: Menú batch actions
  9. Escape: Cerrar modal/deseleccionar
- Context-aware:
  - Si modal abierto: solo Escape funciona (global shortcuts deshabilitadas)
  - Si no hay task focusada: E, D, Space, 1-3 no hacen nada (user feedback?)
  - Search input: algunos shortcuts deshabilitados (Escape OK)
- Logging:
  - Log shortcuts presionadas (debug)
  - Detect conflicts con browser/OS (warn user)

**Technical Rationale:**
- Gestor centralizado = reusable en todos los componentes
- isModalOpen() context = previene shortcuts interfering con modals
- Context-aware = atajos no interfieren con typing
- Logging = debugging + feature usage analytics

**Acceptance Criteria:**
- ✅ registerShortcut funciona
- ✅ handleKeyDown matchea y ejecuta handlers
- ✅ Modal open desabilita global shortcuts (except Escape)
- ✅ Shortcuts no interfieren con input fields (search, task form)
- ✅ Logging funciona

**Notes:**
- Usar window.addEventListener('keydown', handleKeyDown)
- Cleanup: removeEventListener on component unmount
- Testing: unit test para cada shortcut

---

### TASK: APPTODO-P5-SHORTCUTS-IMPL - Implementar 9 Atajos en Componentes

**Status:** Open  
**Depends on:** APPTODO-P5-SHORTCUTS-MANAGER  
**Description:**
Implementar cada shortcut en su componente correspondiente:

1. **Ctrl+K**: En TaskList
   - Abre TaskForm modal (modo create)
   - Focus automático en title input

2. **E**: En TaskList (si task focused)
   - Abre TaskForm modal (modo edit)
   - Populate con task data

3. **D**: En TaskList (si task focused)
   - Abre DeleteConfirmModal
   - Requiere confirm (no delete inmediato)

4. **Shift+D**: En TaskList (si task focused + task is deleted)
   - Llama taskStore.restoreTask()
   - Toast success message

5. **Space**: En TaskList (si task focused)
   - Toggle task status (pendiente ↔ en_progreso/completada)
   - Llamar taskStore.updateTask()

6. **1, 2, 3**: En TaskList (si task focused)
   - 1 → priority = baja
   - 2 → priority = media
   - 3 → priority = alta
   - Llamar taskStore.updateTask()

7. **Shift+↑/↓**: En TaskList
   - Navigation: move focusedTask up/down
   - Agregar a selectedTaskIds (Shift+click behavior)

8. **B**: En TaskList (si hay selección)
   - Toggle/show batch actions menu (o dropdown)

9. **Escape**: Global
   - Cerrar modal (si abierto)
   - Limpiar selección (si hay)
   - Sin input focus (si foco en search/form, just clear foco)

**Technical Rationale:**
- Cada shortcut está vinculado a un store action o componente handler
- Context-aware = shortcuts solo funcionan en contexto correcto
- Visual feedback (toast, modal open) = user knows action completed

**Acceptance Criteria:**
- ✅ Todos los 9 atajos funcionan
- ✅ Shortcuts no interfieren con form input
- ✅ Feedback visual para cada acción
- ✅ Atajos documentados para usuario (help modal?)

**Notes:**
- Usar uiStore.focusedTaskId para tracking
- Usar uiStore.selectedTaskIds para batch
- Testing: simulate keydown events

---

### TASK: APPTODO-P5-SHORTCUTS-HELP - UI: Mostrar Atajos Disponibles

**Status:** Open  
**Depends on:** APPTODO-P5-SHORTCUTS-IMPL  
**Description:**
- Crear src/components/ShortcutsHelp.vue (modal)
- Botón "?" o "Help" en header/footer
- Tabla de atajos:
  - Columna 1: Atajo (Ctrl+K, E, D, etc.)
  - Columna 2: Descripción (Abrir nueva tarea, Editar, etc.)
  - Columna 3: Contexto (cuando disponible)
- Filtro: opcionalmente filtrar por contexto
- Keyboard: Escape para cerrar
- Modal: scrollable si muchos atajos

**Technical Rationale:**
- Help modal descubre atajos (no todos los users los saben)
- Reference card para power users

**Acceptance Criteria:**
- ✅ Todos los 9 atajos listados
- ✅ Descripciones claras
- ✅ Modal accesible (button en UI)
- ✅ Escape cierra

**Notes:**
- Usar shortcutsManager.getActiveShortcuts() para poplar tabla

---

## EPIC: APPTODO-PHASE6 - Polish, Testing, y Optimizaciones

**Status:** Open  
**Depends on:** APPTODO-P5-SHORTCUTS-HELP  
**Description:** Styling final, testing completo, performance, accesibilidad, responsiveness.

---

### TASK: APPTODO-P6-STYLING - Estilos y Responsive Design

**Status:** Open  
**Depends on:** APPTODO-P5-SHORTCUTS-HELP  
**Description:**
- Usar Tailwind CSS (o SCSS utilities)
- Color scheme: consistent en toda la app
  - Primary: blue
  - Success: green
  - Danger: red
  - Warning: orange
  - Neutral: gray
- Responsive breakpoints:
  - Mobile: <640px
  - Tablet: 640-1024px
  - Desktop: >1024px
- Components:
  - Header: responsive layout (sidebar colapsable)
  - FilterBar: single column mobile, grid desktop
  - TaskList: single column mobile
  - TaskItem: compact mobile, expanded desktop
  - Modals: full width mobile, centered desktop
- Dark mode: opcional (future), CSS vars prepared
- Accesibilidad:
  - Color contrast ≥4.5:1 (AA standard)
  - Semantic HTML (button, input, labels)
  - ARIA attributes (aria-label, aria-hidden, etc.)
  - Focus outlines (visible on :focus)
- Typography:
  - Font: System fonts o Inter/Roboto
  - Sizes: consistent (h1, h2, body, small)
  - Line height: readable (1.5+ for body)

**Acceptance Criteria:**
- ✅ App responsive (mobile, tablet, desktop)
- ✅ Color scheme consistent
- ✅ WCAG AA compliance (contrast, keyboard nav)
- ✅ Font readable, sizes consistent
- ✅ No horizontal scroll (mobile)

**Notes:**
- TailwindCSS JIT mode para bundle pequeño
- Testing: responsive design en dev tools
- Accessibility testing: axe DevTools

---

### TASK: APPTODO-P6-ANIMATIONS - Animaciones y Transiciones Suaves

**Status:** Open  
**Depends on:** APPTODO-P6-STYLING  
**Description:**
- Vue transitions para:
  - Modal open/close (fade + slide)
  - Task item add/delete (fade + slide)
  - Filter bar toggle (slide)
  - Toast notifications (fade in/out)
  - Loading spinner (rotate)
- CSS animations:
  - Hover effects (button, task item)
  - Focus outlines (smooth transition)
  - Loading states (pulse, spinner)
- Duration: 200-300ms (responsive, no too slow)
- Performance:
  - Use CSS transforms (not layout-heavy)
  - GPU acceleration (transform, opacity)
  - Avoid janky animations (profile en dev tools)

**Acceptance Criteria:**
- ✅ Modals animate smoothly
- ✅ Tasks fade in/out on add/delete
- ✅ Hover effects smooth
- ✅ No layout shift (use transform)
- ✅ 60fps animations (no jank)

**Notes:**
- Use Vue <Transition> component
- CSS @keyframes para custom animations
- Chrome DevTools: Performance tab para profiling

---

### TASK: APPTODO-P6-FORM-VALIDATIONS - Validaciones Avanzadas en Formularios

**Status:** Open  
**Depends on:** APPTODO-P6-ANIMATIONS  
**Description:**
- TaskForm validaciones:
  - Real-time validation (on blur + input)
  - Error messages inline (bajo campo)
  - Visual feedback (red border, error color)
  - Character counters (remaining chars)
  - Password strength meter (en login)
  - Deadline: validar future date (not past)
  - Title: required + non-empty
- Validations library: use VeeValidate o custom
- Error messages:
  - Específicas (not just "invalid")
  - User-friendly (español)
  - Actionable (help user fix)
- Success feedback:
  - Green checkmark (valid field)
  - Enable submit button (all fields valid)

**Acceptance Criteria:**
- ✅ Real-time validation
- ✅ Error messages específicas
- ✅ Submit disabled hasta válido
- ✅ Character counters funcionan
- ✅ Date picker rechaza fechas pasadas

**Notes:**
- VeeValidate @vee-validate/core
- Custom validators para domain rules
- Testing: vitest para validators

---

### TASK: APPTODO-P6-LOADING-STATES - Loading States y Feedback Visual

**Status:** Open  
**Depends on:** APPTODO-P6-FORM-VALIDATIONS  
**Description:**
- Loading indicators:
  - Spinner durante fetchTasks
  - Button disable + spinner durante submit
  - Skeleton loader para TaskItems (future)
- Error states:
  - Error banner (top de view)
  - Retry button
  - Erro messages (específicas)
- Success feedback:
  - Toast notifications (success, info, error)
  - Auto-clear después 5s
  - Manual close button (X)
  - Position: top-right o centered
- Optimistic updates:
  - Update UI inmediatamente
  - Rollback si API fails
  - Toast error si falla
- Empty states:
  - "No hay tareas" cuando list vacío
  - Encouraging message ("Crea una nueva tarea")
  - Illustration (optional)

**Acceptance Criteria:**
- ✅ Loading spinner visible durante fetch
- ✅ Buttons disabled durante submit
- ✅ Toast notifications funcionan
- ✅ Error banner visible
- ✅ Empty state friendly message
- ✅ Optimistic updates + rollback

**Notes:**
- Toast library: vue-toastification
- Spinner: animated SVG o Tailwind
- Testing: test loading states

---

### TASK: APPTODO-P6-ACCESSIBILITY - Accesibilidad (WCAG AA)

**Status:** Open  
**Depends on:** APPTODO-P6-LOADING-STATES  
**Description:**
- Semantic HTML:
  - <button> para acciones, no <div>
  - <label> para inputs
  - <nav> para navigation
  - <main> para content
- ARIA attributes:
  - aria-label para buttons sin texto (iconos)
  - aria-hidden para decorative elements
  - aria-live para dynamic content (toasts)
  - aria-expanded para collapsibles
  - role para non-semantic elements (si needed)
- Keyboard navigation:
  - All interactive elements reachable via Tab
  - Focus visible (outline on :focus)
  - Escape closes modals
  - Enter submits forms
  - Arrow keys navigate lists (ya implementado en shortcuts)
- Screen reader:
  - Form labels associated (id + for)
  - Error messages linked (aria-describedby)
  - Lists have proper markup (ul/li o role="list")
- Color contrast:
  - Text: ≥4.5:1 (normal), ≥3:1 (large 18pt+)
  - Icons: ≥3:1
  - Use color + other cues (not color alone)
- Testing:
  - Axe DevTools browser extension
  - Screen reader (VoiceOver, NVDA)
  - Keyboard-only navigation

**Acceptance Criteria:**
- ✅ Semantic HTML used
- ✅ ARIA attributes correct
- ✅ Keyboard navigation works
- ✅ Focus visible
- ✅ Color contrast meets WCAG AA
- ✅ Axe scan passes
- ✅ Screen reader compatible

**Notes:**
- Test with keyboard only (disable mouse)
- Use browser accessibility inspector
- Document accessibility features

---

### TASK: APPTODO-P6-PERFORMANCE - Performance Optimizations

**Status:** Open  
**Depends on:** APPTODO-P6-ACCESSIBILITY  
**Description:**
- Bundle optimization:
  - Code splitting (lazy load views)
  - Tree shaking (remove unused code)
  - Minification (built-in vite)
  - Gzip compression (server-side)
- Runtime performance:
  - Computed properties (memoize filters)
  - v-show vs v-if (conditional render)
  - Virtual scrolling (large lists, future)
  - Avoid inline styles/functions (computed)
- Network:
  - HTTP/2 server push (assets)
  - Caching headers (static assets)
  - Compression (gzip, brotli)
  - Minify JSON responses
- Memory:
  - Cleanup event listeners (removeEventListener)
  - Cancel pending requests on unmount
  - Avoid memory leaks (circular refs)
- Metrics:
  - Lighthouse score ≥90 (mobile, desktop)
  - FCP (First Contentful Paint) <2s
  - LCP (Largest Contentful Paint) <2.5s
  - CLS (Cumulative Layout Shift) <0.1
- Testing:
  - Chrome DevTools: Lighthouse
  - Bun: build with --minify
  - Monitor: Web Vitals

**Acceptance Criteria:**
- ✅ Lighthouse ≥90
- ✅ FCP <2s
- ✅ Code splitting working
- ✅ No memory leaks (DevTools profiling)
- ✅ Bundle size <500KB (gzipped)

**Notes:**
- Use Bun: bun build src/main.ts --minify
- Check bundle: bun bunx esbuild-visualizer
- Performance timeline in DevTools

---

### TASK: APPTODO-P6-FRONTEND-TESTS - Tests: Frontend Componentes + Stores

**Status:** Open  
**Depends on:** APPTODO-P6-PERFORMANCE  
**Description:**
- Testing framework: Vitest + Vue Test Utils
- Test suites:
  - Components: TaskItem, TaskForm, FilterBar, TaskList (unit tests)
  - Stores: authStore, taskStore, uiStore (unit tests)
  - Integration: TaskList + FilterBar + API calls (integration test)
  - E2E: Login → Create Task → Edit → Delete (future: Cypress)
- Coverage targets:
  - Components: ≥70% coverage
  - Stores: ≥80% coverage
  - Overall: ≥70% coverage
- Test examples:
  - TaskItem: renders props, emits click, toggle select
  - TaskForm: validates input, submits data, cancel works
  - taskStore: fetchTasks populates, createTask adds, updateTask modifies
  - API interceptor: auth header injected, 401 refresh token
  - Shortcuts: Ctrl+K opens modal, E edits task, etc.
- Mocking:
  - Mock axios (no real HTTP calls)
  - Mock Pinia stores en component tests
  - Mock router navigation
- Test utilities:
  - Factories para crear test data (tasks, users)
  - Fixtures para setup/teardown
  - Helpers para assertions

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Coverage ≥70% overall
- ✅ No console errors during tests
- ✅ Tests execute <30s total

**Notes:**
- Use vitest: bun test
- Vue Test Utils docs
- Test: user interactions (not implementation details)

---

### TASK: APPTODO-P6-E2E-TESTS - Tests: E2E (End-to-End)

**Status:** Open  
**Depends on:** APPTODO-P6-FRONTEND-TESTS  
**Description:**
- E2E testing framework: Cypress o Playwright
- Test scenarios:
  1. **Auth Flow:** Register → Login → Logout
  2. **CRUD Tasks:** Create → Read → Update → Delete (soft)
  3. **Filters:** Apply status/priority/deadline filters → tasks filtered
  4. **Batch:** Select multiple → batch complete/delete
  5. **Categories:** Create category → assign to task → view
  6. **Shortcuts:** Ctrl+K opens create → E edits → D deletes → Escape closes
  7. **Responsive:** UI works on mobile/tablet/desktop
- Test setup:
  - Frontend server running (bun run dev)
  - Backend server running (uvicorn app.main:app)
  - Fresh DB (or reset before each test)
  - Database seeding (test user, test tasks)
- Assertions:
  - Element visibility (button clicked, modal opens)
  - URL changes (redirect after login)
  - Data displayed (tasks rendered, filter applied)
  - API calls made (spy on network)
- Maintenance:
  - Selectors stable (not brittle)
  - Retry logic (wait for element)
  - Screenshots on failure (debugging)

**Acceptance Criteria:**
- ✅ All E2E scenarios pass
- ✅ Tests run in <5min total
- ✅ No flaky tests (stable)
- ✅ Screenshots captured on failure

**Notes:**
- Use Cypress: npx cypress open
- Or Playwright: bun exec playwright test
- Tests in tests/e2e/ directory
- CI/CD integration (GitHub Actions)

---

### TASK: APPTODO-P6-DOCUMENTATION - Documentación: README + API Docs + User Guide

**Status:** Open  
**Depends on:** APPTODO-P6-E2E-TESTS  
**Description:**
- README.md:
  - Project overview
  - Tech stack
  - Setup instructions (backend + frontend)
  - Running dev server
  - Running tests
  - Building for production
  - Contributing guidelines
- API Documentation:
  - OpenAPI/Swagger (auto-generated from FastAPI)
  - /docs endpoint
  - /redoc endpoint (alternative UI)
  - Examples for each endpoint
- User Guide:
  - How to create/edit/delete tasks
  - Using filters
  - Shortcuts reference
  - Accessibility features
  - Troubleshooting
- Developer Docs:
  - Architecture overview
  - Store structure (Pinia)
  - API client (axios)
  - Testing setup
  - Deployment
- Code comments:
  - Complex functions documented (docstrings)
  - PLAN.md (this file) linked in README
  - Inline comments for gotchas

**Acceptance Criteria:**
- ✅ README complete + clear
- ✅ API docs auto-generated (Swagger)
- ✅ User guide helpful
- ✅ Code well-commented

**Notes:**
- Use Markdown for docs
- Keep docs in sync with code (link from README)
- Document API versioning

---

### TASK: APPTODO-P6-PRODUCTION-BUILD - Build y Deployment

**Status:** Open  
**Depends on:** APPTODO-P6-DOCUMENTATION  
**Description:**
- Frontend build:
  - bun build src/main.ts --minify (or bun run build)
  - Output: dist/
  - Test build: bun run preview
- Backend deployment:
  - Gunicorn/Uvicorn: production ASGI server
  - Environment variables (.env):
    - DATABASE_URL (SQLite path)
    - SECRET_KEY (JWT secret)
    - DEBUG (false in prod)
    - CORS_ORIGINS (whitelist frontend domain)
  - Docker (optional):
    - Dockerfile for backend
    - Dockerfile for frontend (nginx)
    - docker-compose.yml for local dev
  - Database migrations: alembic upgrade head
- Deployment checklist:
  - [ ] HTTPS enabled
  - [ ] CORS configured (frontend domain)
  - [ ] Rate limiting configured
  - [ ] Logging enabled
  - [ ] Secrets (SECRET_KEY) secure
  - [ ] DB backups automated
  - [ ] Monitoring setup (error tracking)
  - [ ] Health check endpoints working

**Acceptance Criteria:**
- ✅ Frontend builds without errors
- ✅ Backend starts with production config
- ✅ Requests from frontend work (CORS OK)
- ✅ Secrets not committed to repo
- ✅ Health check endpoints respond

**Notes:**
- Use environment variables (not hardcoded)
- Document deployment steps
- Deployment guide: deployment/README.md

---

## Additional Tasks (Bug Fixes, Improvements, Future)

### TASK: APPTODO-CLEANUP - Cleanup: Remover Seed Data, Finalizar Configuraciones

**Status:** Open  
**Depends on:** APPTODO-P6-PRODUCTION-BUILD  
**Description:**
- Backend:
  - Remover seed data de test user (production clean DB)
  - Revisar logging (no sensitive data logged)
  - Revisar error messages (no stack traces a cliente)
  - Validar rate limiting configs
  - Revisar CORS settings
- Frontend:
  - Remover console.logs de desarrollo
  - Revisar API endpoints (no localhost en prod config)
  - Validar environment variables
- Git:
  - .gitignore: .env, venv/, node_modules/, dist/, .DS_Store
  - No secrets en git history (git-secrets)
- Final review:
  - Code style consistent
  - No TODO comments left unaddressed
  - Dependencies pinned (requirements.txt, package.json)

**Acceptance Criteria:**
- ✅ No console.logs en prod build
- ✅ No sensitive data in logs
- ✅ .env not committed
- ✅ Code clean, no debug statements

**Notes:**
- Use .gitignore properly
- Document env var requirements

---

# Summary of Beads

## Overview
- **Total Phases:** 6 + Cleanup
- **Total Tasks:** ~70 beads (granular)
- **Estimated Timeline:** 4-6 weeks (full-time development)
- **Architecture:** Clean layers, testing-first, security-focused

## Key Principles
1. **Security first:** passwords hashed, tokens httpOnly, idempotency, rate limiting
2. **Testing throughout:** unit + integration + E2E
3. **User experience:** responsive, accessible, keyboard shortcuts
4. **Maintainability:** clean code, documented, structured

## Dependency Structure
```
Phase 1 (Backend Base)
  ├─ Setup
  ├─ DB Init
  ├─ Auth (Register → Login → Refresh → Logout → Me)
  ├─ Tasks CRUD (Create → Get → List → Update → Delete)
  └─ Testing (Auth, Tasks, Idempotency, Security)

Phase 2 (Backend Advanced) [depends on Phase 1 Testing]
  ├─ DB: Categories + Events + Idempotency
  ├─ Categories CRUD
  ├─ Task-Category Relations
  ├─ Filters in DB
  ├─ Batch Operations
  ├─ Restore Task
  └─ Event Log

Phase 3 (Frontend Base) [depends on Phase 2]
  ├─ Setup: Vue + Router
  ├─ Router Configuration
  ├─ Auth Store + API Interceptor
  └─ Login View + Dashboard

Phase 4 (Frontend Features) [depends on Phase 3]
  ├─ Task Store + UI Store
  ├─ Components (TaskItem, TaskForm, FilterBar, TaskList)
  ├─ API Integration
  └─ Delete Confirmation Modal

Phase 5 (Shortcuts) [depends on Phase 4]
  ├─ Shortcuts Manager
  ├─ Implement 9 Shortcuts
  └─ Help Modal

Phase 6 (Polish) [depends on Phase 5]
  ├─ Styling + Responsive
  ├─ Animations
  ├─ Validations + Loading States
  ├─ Accessibility
  ├─ Performance
  ├─ Frontend Tests
  ├─ E2E Tests
  ├─ Documentation
  ├─ Build + Deployment
  └─ Cleanup
```

---

# Next Steps

1. Import beads from this markdown file: `bd create BEADS_STRUCTURE.md`
2. Establish phase order (dependencies will enforce)
3. Start with Phase 1: Backend Base
4. QA after each phase completes
5. Iterate based on feedback

All beads include detailed comments for future reference and new team members.
