# AppTodo Beads Structure Guide

## Overview

El proyecto AppTodo está estructurado en **59 beads** (tareas) organizados en **6 fases de desarrollo** con una cadena clara de dependencias. Esta guía explica la estructura completa.

---

## Structure Summary

### Total: 59 Beads across 6 Phases (UPDATED)

| Phase | Name | Tasks | Purpose |
|-------|------|-------|---------|
| 1 | Backend Base | 18 | Setup, DB*, Auth (register/login/refresh/logout/me), CRUD tasks, Testing |
| 2 | Backend Advanced | 7 | Categories, Filters, Batch ops, Event log |
| 3 | Frontend Base | 6 | Vue setup, Router, Auth store, API client, Login, Dashboard |
| 4 | Frontend Features | 9 | Task store, Category store (NEW), UI store, Components, API integration |
| 5 | Shortcuts | 3 | Manager, 9 shortcuts implementation, Help modal |
| 6 | Polish | 12 | Styling, Animations, Validations, Loading, Accessibility, Performance, Tests, Docs, Build |

**Notes:**
- *DB-INIT now includes idempotency_keys table (moved from Phase 2 for P1 task safety)
- Category store (P4) is NEW and manages categories for TaskForm/FilterBar

---

## Dependency Chain

### Phase 1 Linear Sequence

```
SETUP
  ↓
DB-INIT
  ↓
AUTH-REG
  ↓
AUTH-LOGIN
  ↓
AUTH-REFRESH
  ↓
AUTH-LOGOUT
  ↓
AUTH-ME (also enables TEST-AUTH in parallel)
  ↓
TASKS-CREATE
  ↓
TASKS-GET
  ↓
TASKS-LIST
  ↓
TASKS-UPDATE
  ↓
TASKS-DELETE
  ↓
TEST-TASKS
  ↓
TEST-IDEMPOTENCY
  ↓
TEST-SECURITY
```

### Phase 1 Testing

- **TEST-AUTH** depends on `AUTH-ME`
- **TEST-TASKS** depends on `TASKS-DELETE`
- **TEST-IDEMPOTENCY** depends on `TEST-TASKS`
- **TEST-SECURITY** depends on `TEST-IDEMPOTENCY`

### Phase 2 Linear Sequence

**Depends on:** Phase 1 `TEST-SECURITY`

```
DB-CATEGORIES
  ↓
CATEGORIES-CRUD
  ↓
TASKS-CATEGORIES
  ↓
TASKS-FILTERS-DB
  ↓
TASKS-BATCH
  ↓
TASKS-RESTORE
  ↓
TASK-EVENTS
```

### Phase 3 Linear Sequence

**Depends on:** Phase 2 `TASK-EVENTS`

```
P3-SETUP
  ↓
P3-ROUTER
  ↓
P3-AUTH-STORE
  ↓
P3-API-INTERCEPTOR
  ↓
P3-LOGIN-VIEW
  ↓
P3-DASHBOARD-STRUCTURE
```

### Phase 4 Linear Sequence

**Depends on:** Phase 3 `DASHBOARD-STRUCTURE`

```
P4-TASK-STORE
  ↓
P4-CATEGORY-STORE (NEW - manages categories for forms/filters)
  ↓
P4-UI-STORE
  ↓
P4-TASK-ITEM
  ↓
P4-TASK-FORM
  ↓
P4-FILTER-BAR
  ↓
P4-TASK-LIST
  ↓
P4-API-INTEGRATION
  ↓
P4-DELETE-CONFIRM
```

### Phase 5 Linear Sequence

**Depends on:** Phase 4 `DELETE-CONFIRM`

```
P5-SHORTCUTS-MANAGER
  ↓
P5-SHORTCUTS-IMPL
  ↓
P5-SHORTCUTS-HELP
```

### Phase 6 Linear Sequence

**Depends on:** Phase 5 `SHORTCUTS-HELP`

```
P6-STYLING
  ↓
P6-ANIMATIONS
  ↓
P6-FORM-VALIDATIONS
  ↓
P6-LOADING-STATES
  ↓
P6-ACCESSIBILITY
  ↓
P6-PERFORMANCE
  ↓
P6-FRONTEND-TESTS
  ↓
P6-E2E-TESTS
  ↓
P6-DOCUMENTATION
  ↓
P6-PRODUCTION-BUILD
  ↓
CLEANUP
```

---

## Key Design Decisions

### 1. Linear Dependencies

Cada fase tiene una cadena lineal de dependencias. Esto asegura:
- Claridad sobre el orden de implementación
- Fácil identificación de trabajo listo (ready)
- Progreso visible (cerrar beads destaqueta avance)

### 2. Phase Boundaries

Las fases están claramente separadas:
- **Phase 1:** Backend core + testing
- **Phase 2:** Backend advanced features
- **Phase 3:** Frontend foundation
- **Phase 4:** Frontend features
- **Phase 5:** Advanced UX (shortcuts)
- **Phase 6:** Quality (polish, tests, docs)

### 3. Testing Strategy

- Tests se hacen DESPUÉS de implementación base (Phase 1)
- Cada fase puede tener sus propios tests (Phase 4, 6)
- E2E tests al final (Phase 6)
- Coverage targets:
  - Backend: ≥75% (Phase 1 tests)
  - Frontend: ≥70% (Phase 6 tests)

### 4. Self-Documenting Beads

Cada bead contiene:
- **Descripción clara** de qué se implementa
- **Acceptance criteria** (cómo sé que está listo)
- **Dependencias** (qué necesito antes)
- **Notas técnicas** (contexto, gotchas)

---

## Using the Beads

### View Ready Work

```bash
bd ready
```

Muestra qué beads están listos para trabajar (sin bloqueadores).

### Start Work

```bash
bd update <ID> --status in_progress
```

Marca un bead como "en progreso".

### View Details

```bash
bd show <ID>
```

Ver descripción completa, dependencias, notas.

### View Dependency Graph

```bash
bd graph <ID>
```

Visualizar árbol de dependencias (para ver qué viene después).

### Close Work

```bash
bd close <ID>
```

Marca un bead como completado. Las dependencias se desbloquean automáticamente.

---

## File Structure Prepared by Beads

Este es el resultado esperado al completar todos los beads:

```
/app/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── config.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── tasks.py
│   │   │   ├── categories.py
│   │   │   └── events.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── task_service.py
│   │   │   └── category_service.py
│   │   ├── repositories/
│   │   │   ├── user_repository.py
│   │   │   ├── task_repository.py
│   │   │   └── category_repository.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── task.py
│   │   │   └── category.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── task.py
│   │   │   └── category.py
│   │   └── tests/
│   │       ├── test_auth.py
│   │       ├── test_tasks.py
│   │       └── test_security.py
│   ├── db/
│   │   └── migrations/
│   ├── requirements.txt
│   └── pytest.ini
│
└── frontend/
    ├── src/
    │   ├── main.ts
    │   ├── App.vue
    │   ├── components/
    │   │   ├── TaskItem.vue
    │   │   ├── TaskForm.vue
    │   │   ├── FilterBar.vue
    │   │   ├── TaskList.vue
    │   │   ├── DeleteConfirmModal.vue
    │   │   ├── Header.vue
    │   │   └── ShortcutsHelp.vue
    │   ├── views/
    │   │   ├── LoginView.vue
    │   │   └── DashboardView.vue
    │   ├── stores/
    │   │   ├── authStore.ts
    │   │   ├── taskStore.ts
    │   │   └── uiStore.ts
    │   ├── api/
    │   │   └── client.ts
    │   ├── router/
    │   │   └── index.ts
    │   ├── utils/
    │   │   └── shortcutsManager.ts
    │   ├── types/
    │   │   ├── models.ts
    │   │   └── api.ts
    │   ├── styles/
    │   │   └── main.scss
    │   └── tests/
    │       ├── components/
    │       ├── stores/
    │       └── e2e/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── vitest.config.ts
```

---

## Metrics & Milestones

### Phase Completion Indicators

| Phase | Completion Criteria | Estimated Time |
|-------|-------------------|-----------------|
| 1 | All tests passing (auth + tasks + security) | 1 week |
| 2 | Categories, filters, batch, events working | 1 week |
| 3 | Frontend base compiling + login working | 3-4 days |
| 4 | Full task CRUD in UI, filters, batch UI | 1 week |
| 5 | All 9 shortcuts working, help modal | 2-3 days |
| 6 | Styling, tests, docs, production build | 1 week |
| **Total** | **Complete app ready for production** | **4-6 weeks** |

### Quality Gates

- **Backend:** ≥75% test coverage (Phase 1 testing)
- **Frontend:** ≥70% test coverage (Phase 6 tests)
- **Lighthouse:** ≥90 score (Phase 6 performance)
- **Accessibility:** WCAG AA compliance (Phase 6)
- **Performance:** FCP <2s, LCP <2.5s, CLS <0.1 (Phase 6)

---

## Development Tips

### Parallel Work

Aunque hay dependencias lineales, ciertos beads pueden hacerse en paralelo:
- Multiple backend endpoints (Phase 1) pueden trabajarse en paralelo por diferentes developers
- Testing (Phase 1) puede empezarse mientras se están haciendo endpoints
- Frontend components (Phase 4) pueden trabajarse en paralelo

### Testing During Development

Cada bead tiene AC (acceptance criteria). Usar estos para validar completitud:

```bash
# Ver AC de un bead
bd show <ID> | grep -A 20 "Acceptance"
```

### Committing Work

Al cerrar un bead:

```bash
git commit -m "impl: APPTODO-P1-SETUP - setup FastAPI project

- Creates /app/backend structure
- Installs dependencies
- Configures logging

Closes: test-beads-3an"
```

Referencia el bead ID en el commit para tracking.

---

## Document References

- **PLAN.md** - Project vision, architecture, features
- **BEADS.md** - This file, structured as markdown for `bd create --file`
- **BEADS_STRUCTURE.md** - Expanded version with detailed comments
- **AGENTS.md** - Quick commands and environment setup

---

## Next Steps

1. Run `bd ready` to see what's available to work on
2. Pick the first task (APPTODO-P1-SETUP)
3. Update status: `bd update test-beads-3an --status in_progress`
4. Complete work per AC (acceptance criteria)
5. Close: `bd close test-beads-3an`
6. Next ready task automatically appears
7. Repeat until `CLEANUP` is complete

Happy building! 🚀
