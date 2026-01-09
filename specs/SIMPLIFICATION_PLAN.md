# Plan de Simplificación: Infraestructura para Desarrollo Local

## Contexto

El proyecto actualmente tiene infraestructura sobredimensionada para una aplicación de TODOs de desarrollo local:
- Pipeline CI/CD con deploy automático a staging/producción
- Docker multi-stage con nginx, SSL/TLS, Prometheus, Grafana
- Servicios de backup automático y logrotate
- Configuración enterprise innecesaria

**Objetivo:** Simplificar a solo lo necesario para desarrollo local, manteniendo la calidad del código.

## ⚠️ REGLA CRÍTICA: Tests y Validación Obligatorios

**NINGUNA issue de este plan se puede cerrar sin completar TODOS los criterios de validación.**

Cada issue tiene una sección "CRITERIOS DE VALIDACIÓN (OBLIGATORIOS)" con checkboxes específicos que deben cumplirse antes de cerrar. Esto incluye:
- Tests automatizados (backend y frontend)
- Validación manual de funcionalidad
- Verificación de que no se rompe nada existente
- Documentación de cambios

**No hay excepciones. La calidad es mandatory.**

---

## 1. Análisis de Componentes Actuales

### ❌ Eliminar Completamente

#### 1.1 Deploy Automático
**Archivos afectados:**
- `.github/workflows/ci-cd.yml` (jobs: `deploy-staging`, `deploy-production`, `e2e-test`)
- `docker-compose.prod.yml` (completo)
- `nginx.conf` (completo)

**Razón:** No hay servidores de staging/producción. Los emails de GitHub vienen de estos jobs fallando.

#### 1.2 Servicios de Producción
**Eliminar de `docker-compose.yml`:**
- Servicio `nginx` (líneas 55-69)
- Servicio `db` (líneas 30-36) - SQLite no necesita container separado
- Configuración de volúmenes SSL (línea 64)
- Perfiles de producción (líneas 68-69)

**Eliminar de `docker-compose.prod.yml`:**
- Servicio `backup` (automático innecesario)
- Servicio `logrotate` (innecesario en desarrollo)
- Servicios `prometheus` y `grafana` (monitoring enterprise)

#### 1.3 Docker Multi-Stage Complejo
**Archivo:** `Dockerfile`
- Multi-stage build optimizado para producción
- Configuración SSL/TLS
- Workers múltiples de uvicorn

**Razón:** Para desarrollo local, no se necesita imagen Docker optimizada. Mejor desarrollo nativo.

### ✅ Mantener (Simplificado)

#### 1.4 CI/CD Básico
**Mantener solo:**
- Tests de backend (pytest, linting)
- Tests de frontend (lint, type-check, unit tests)
- Build de verificación (sin push a registry)

**Eliminar:**
- Push a GitHub Container Registry
- Tests E2E en CI (opcional en local)
- Codecov upload (innecesario para proyecto personal)
- Notificaciones Slack

#### 1.5 Docker Opcional Simple
**Uso:** Solo para quien prefiera Docker en desarrollo local
**Mantener:** `docker-compose.yml` simplificado (solo backend + frontend dev)

---

## 2. Configuración Objetivo

### 2.1 Desarrollo Local (Nativo - Recomendado)

```bash
# Terminal 1: Backend
cd app/backend
uv sync --python 3.12
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd app/frontend
bun install
bun run dev

# Acceso:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Base de datos:** SQLite en `app/backend/data/app.db` (local, sin container)

### 2.2 Docker Opcional (Simplificado)

```yaml
# docker-compose.dev.yml (nuevo, simple)
version: '3.8'

services:
  backend:
    build:
      context: ./app/backend
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./app/backend:/app
      - ./data:/app/data
    environment:
      - DATABASE_URL=sqlite:///./data/app.db
      - DEBUG=true
    command: uvicorn app.main:app --host 0.0.0.0 --reload

  frontend:
    build:
      context: ./app/frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./app/frontend/src:/app/src
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1
    command: bun run dev
```

**Dockerfiles simples:**
```dockerfile
# app/backend/Dockerfile.dev
FROM python:3.12-slim
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv sync
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--reload"]

# app/frontend/Dockerfile.dev
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
CMD ["bun", "run", "dev", "--host"]
```

### 2.3 CI/CD Simplificado

```yaml
# .github/workflows/ci.yml (renombrado y simplificado)
name: CI Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    name: Backend Tests
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'

      - name: Install UV
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Install dependencies
        working-directory: app/backend
        run: uv sync

      - name: Run linting
        working-directory: app/backend
        run: |
          source .venv/bin/activate
          flake8 app/
          black --check app/
          isort --check-only app/

      - name: Run tests
        working-directory: app/backend
        run: |
          source .venv/bin/activate
          pytest --cov=app

  frontend-test:
    runs-on: ubuntu-latest
    name: Frontend Tests
    steps:
      - uses: actions/checkout@v4

      - name: Set up Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        working-directory: app/frontend
        run: bun install

      - name: Run linting
        working-directory: app/frontend
        run: bun run lint

      - name: Run type check
        working-directory: app/frontend
        run: bun run type-check

      - name: Run unit tests
        working-directory: app/frontend
        run: bun run test -- --run
```

---

## 3. Plan de Ejecución

### Fase 1: Limpieza de Archivos

#### Issue 1: Eliminar configuración Docker de producción
**Archivos a eliminar:**
- `docker-compose.prod.yml`
- `nginx.conf`
- `Dockerfile` (multi-stage complejo)
- Carpeta `ssl/` (si existe)
- Carpeta `monitoring/` (si existe)

**Archivos a crear:**
- `app/backend/Dockerfile.dev` (simple)
- `app/frontend/Dockerfile.dev` (simple)
- `docker-compose.dev.yml` (opcional)

#### Issue 2: Simplificar docker-compose.yml
**Cambios:**
- Eliminar servicio `nginx`
- Eliminar servicio `db` (SQLite no necesita container)
- Simplificar servicio `backend` (eliminar healthcheck complejo)
- Mantener solo `backend` y `frontend` para desarrollo

#### Issue 3: Simplificar CI/CD
**Cambios en `.github/workflows/ci-cd.yml`:**
- Renombrar a `ci.yml`
- Eliminar jobs: `build`, `e2e-test`, `deploy-staging`, `deploy-production`
- Mantener solo: `backend-test`, `frontend-test`
- Eliminar upload a Codecov
- Simplificar pasos (quitar complejidad innecesaria)

### Fase 2: Documentación

#### Issue 4: Actualizar README.md principal
**Contenido:**
```markdown
# AppTodo - Aplicación de Tareas

Aplicación web de gestión de tareas con autenticación, filtros dinámicos y atajos de teclado.

## Stack Técnico
- **Frontend:** Vue 3 + TypeScript + Bun
- **Backend:** FastAPI + Python 3.12 + SQLite
- **Gestión:** UV (Python) + Bun (Node.js)

## Setup Rápido

### Opción 1: Desarrollo Nativo (Recomendado)

1. **Backend:**
   ```bash
   cd app/backend
   uv sync --python 3.12
   source .venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Frontend:**
   ```bash
   cd app/frontend
   bun install
   bun run dev
   ```

3. **Acceso:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Opción 2: Docker (Opcional)

```bash
docker-compose -f docker-compose.dev.yml up
```

## Tests

### Backend
```bash
cd app/backend
source .venv/bin/activate
pytest --cov=app
```

### Frontend
```bash
cd app/frontend
bun run test
bun run lint
```

## Documentación

- [PLAN.md](specs/PLAN.md) - Arquitectura completa
- [SIMPLIFICATION_PLAN.md](specs/SIMPLIFICATION_PLAN.md) - Configuración de desarrollo

## CI/CD

El pipeline ejecuta automáticamente:
- Tests de backend (pytest, linting)
- Tests de frontend (vitest, type-check, linting)

**No hay deploy automático** - Esta es una aplicación de desarrollo local.
```

#### Issue 5: Crear guía de migración
**Archivo:** `specs/MIGRATION_FROM_DOCKER.md`
```markdown
# Migración de Docker a Desarrollo Nativo

Si anteriormente usabas Docker y quieres migrar a desarrollo nativo:

1. **Detener containers:**
   ```bash
   docker-compose down
   docker system prune -a
   ```

2. **Migrar base de datos:**
   ```bash
   # Copiar SQLite desde container (si existe)
   docker cp apptodo-backend:/app/data/app.db ./app/backend/data/
   ```

3. **Setup nativo:**
   ```bash
   # Backend
   cd app/backend
   uv sync --python 3.12

   # Frontend
   cd app/frontend
   bun install
   ```

4. **Ejecutar:**
   ```bash
   # Terminal 1
   cd app/backend && source .venv/bin/activate && uvicorn app.main:app --reload

   # Terminal 2
   cd app/frontend && bun run dev
   ```
```

### Fase 3: Testing y Validación

#### Issue 6: Validar setup nativo
- Probar instalación desde cero
- Verificar que todos los tests pasen
- Documentar problemas encontrados

#### Issue 7: Validar CI/CD simplificado
- Hacer push a rama de prueba
- Verificar que pipeline pase sin errores
- Confirmar que no hay emails de fallos

---

## 4. Beneficios de la Simplificación

### Desarrollo
- ✅ Menos overhead (no Docker en desarrollo)
- ✅ Hot-reload más rápido
- ✅ Debugging más simple
- ✅ Menos recursos de sistema

### CI/CD
- ✅ Builds más rápidos (2-3 min vs 10-15 min)
- ✅ Sin fallos de deploy
- ✅ Sin emails de error
- ✅ Feedback inmediato de tests

### Mantenibilidad
- ✅ Menos archivos de configuración
- ✅ Menos complejidad para entender
- ✅ Enfoque en código, no en infraestructura
- ✅ Más fácil para colaboradores

---

## 5. Qué NO se Pierde

### Funcionalidades Mantenidas
- ✅ Todas las features de la app (auth, tasks, filters, etc.)
- ✅ Tests unitarios y de integración
- ✅ Linting y type-checking
- ✅ Validación automática en CI
- ✅ Arquitectura limpia (capas, stores, etc.)

### Opcionales Disponibles
- ✅ Docker disponible para quien lo prefiera (`docker-compose.dev.yml`)
- ✅ Tests E2E con Playwright (en local, no CI)
- ✅ Posibilidad de agregar deploy futuro si se necesita

---

## 6. Roadmap de Issues (Beads)

### Prioridad P1 (Crítico)
1. `apptodo-77` - Investigar y solucionar fallos en CI/CD pipeline (ya creada)
2. `apptodo-XX` - Eliminar jobs de deploy de CI/CD
3. `apptodo-XX` - Simplificar docker-compose.yml

### Prioridad P2 (Alta)
4. `apptodo-XX` - Eliminar archivos Docker de producción
5. `apptodo-XX` - Crear Dockerfiles dev simples (opcional)
6. `apptodo-XX` - Actualizar README.md principal

### Prioridad P3 (Media)
7. `apptodo-XX` - Crear guía de migración
8. `apptodo-XX` - Validar setup nativo
9. `apptodo-XX` - Documentar cambios en CHANGELOG

---

## 7. Checklist de Completitud

**IMPORTANTE:** Cada checkbox requiere que la issue correspondiente haya completado TODOS sus criterios de validación obligatorios.

- [ ] CI/CD simplificado (solo tests, sin deploy) - **apptodo-78** validado
- [ ] Docker opcional y simple (no obligatorio) - **apptodo-79, apptodo-81** validados
- [ ] Nginx eliminado - **apptodo-80** validado
- [ ] Prometheus/Grafana eliminados - **apptodo-80** validado
- [ ] Backup/logrotate eliminados - **apptodo-80** validado
- [ ] README actualizado - **apptodo-82** validado
- [ ] Documentación de desarrollo local - **apptodo-82** validado
- [ ] Guía de migración creada - **apptodo-83** validado
- [ ] Tests pasan en CI - **apptodo-78, apptodo-84** validados
- [ ] No más emails de GitHub por fallos - **apptodo-77, apptodo-78** validados
- [ ] Setup nativo funciona desde cero - **apptodo-84** validado completo

---

## 8. Decisiones de Diseño

### ¿Por qué eliminar Docker por defecto?
Para una app de desarrollo local, Docker agrega overhead innecesario:
- Tiempo de build/rebuild
- Recursos de sistema (CPU, RAM)
- Complejidad de debugging
- Hot-reload más lento

**Pero:** Se mantiene como opción para quienes lo prefieran.

### ¿Por qué eliminar CI/CD de deploy?
No hay servidores remotos configurados. Los jobs fallan constantemente enviando emails.
Es mejor tener CI simple y funcional que CI complejo y roto.

### ¿Por qué mantener tests en CI?
Validación automática de calidad es valiosa. Tests rápidos (2-3 min) no son overhead.

### ¿Se pierde algo importante?
**No.** Todo lo eliminado es infraestructura, no funcionalidad. La aplicación mantiene todas sus capacidades.

---

## Resumen Ejecutivo

**Antes:** Infraestructura enterprise con deploy automático, monitoring, backups, multi-stage Docker.
**Después:** Desarrollo local simple con tests automáticos en CI.

**Tiempo para setup:**
- Antes: ~15-20 min (Docker build completo)
- Después: ~3-5 min (uv sync + bun install)

**Complejidad:**
- Antes: 8 archivos de configuración Docker/CI
- Después: 2 archivos (CI simple + docker-compose.dev.yml opcional)

**Mantenibilidad:**
- Antes: Difícil entender, muchos componentes
- Después: Simple, directo, enfocado en código
