# E2E Testing Specification (apptodo-47)

## Overview

Este documento especifica los requerimientos para implementar E2E (End-to-End) testing en AppTodo usando **Playwright**.

## Herramientas Recomendadas

### Opción 1: Claude Code + `/chrome` (PRIORITARIA si disponible)
- **Uso:** Ejecutar tests desde Claude Code con acceso directo a navegador Chrome
- **Ventajas:**
  - Debugging visual en tiempo real
  - Interacción directa con elementos
  - Mejor para capturar screenshots/videos de fallos
- **Fallback:** Si `/chrome` no funciona, usar MCP Playwright

### Opción 2: MCP Playwright (Fallback recomendado)
- **Instalación:** `bun add -D @playwright/test`
- **Framework:** Playwright Test
- **Navegadores soportados:** Chromium, Firefox, WebKit
- **Config:** `playwright.config.ts`

## Setup Inicial

```bash
# 1. Instalar dependencias de testing
cd app/frontend
bun add -D @playwright/test @playwright/inspector

# 2. Inicializar Playwright
bun exec playwright install

# 3. Crear directorio de tests
mkdir -p tests/e2e

# 4. Crear archivo de configuración
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173', // Adjust based on frontend dev port
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev', // Adjust to 'bun run dev'
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
EOF
```

## Test Cases Requeridos

### 1. Autenticación (auth.spec.ts)

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('Register new user', async ({ page }) => {
    // Navegar a registro
    await page.goto('/register');
    
    // Llenar formulario
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[name="username"]', 'newuser123');
    await page.fill('input[type="password"]', 'SecurePass123!');
    
    // Enviar
    await page.click('button[type="submit"]');
    
    // Verificar redirección a login
    await expect(page).toHaveURL('/login');
  });

  test('Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Verificar redirección a dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=My Tasks')).toBeVisible();
  });

  test('Login fails with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');
    
    // Verificar mensaje de error
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('Token refresh on session expiry', async ({ page }) => {
    // Login
    await page.goto('/login');
    await loginUser(page, 'test@example.com', 'SecurePass123!');
    
    // Simular expiración de access token
    await page.evaluate(() => {
      sessionStorage.removeItem('access_token');
    });
    
    // Hacer request - debería usar refresh token
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('Logout clears session', async ({ page }) => {
    await loginAndNavigate(page);
    
    // Click logout
    await page.click('[data-testid="logout-btn"]');
    
    // Verificar redirección y limpieza de tokens
    await expect(page).toHaveURL('/login');
    const token = await page.evaluate(() => sessionStorage.getItem('access_token'));
    expect(token).toBeNull();
  });
});

// Helper functions
async function loginUser(page, email, password) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

async function loginAndNavigate(page) {
  await page.goto('/login');
  await loginUser(page, 'test@example.com', 'SecurePass123!');
}
```

### 2. Gestión de Tareas (tasks.spec.ts)

```typescript
// tests/e2e/tasks.spec.ts
test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('Create new task', async ({ page }) => {
    // Click crear tarea
    await page.click('[data-testid="new-task-btn"]');
    
    // Llenar formulario
    await page.fill('input[placeholder="Task title"]', 'Buy groceries');
    await page.fill('textarea', 'Milk, eggs, bread');
    await page.selectOption('select[name="priority"]', 'alta');
    
    // Enviar
    await page.click('button:has-text("Create")');
    
    // Verificar que aparece en lista
    await expect(page.locator('text=Buy groceries')).toBeVisible();
  });

  test('Edit task', async ({ page }) => {
    await createTaskViaUI(page, 'Original task');
    
    // Click en tarea para editar
    await page.click('text=Original task');
    await page.fill('input[placeholder="Task title"]', 'Updated task');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=Updated task')).toBeVisible();
  });

  test('Delete task', async ({ page }) => {
    await createTaskViaUI(page, 'Task to delete');
    
    // Click delete
    await page.hover('text=Task to delete');
    await page.click('[data-testid="delete-btn"]');
    
    // Confirmar
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator('text=Task to delete')).not.toBeVisible();
  });

  test('Mark task as complete', async ({ page }) => {
    await createTaskViaUI(page, 'Task to complete');
    
    // Click checkbox
    await page.click('input[type="checkbox"][aria-label*="Task to complete"]');
    
    // Verificar que está completada
    const taskItem = page.locator('text=Task to complete').first();
    await expect(taskItem).toHaveClass(/completed/);
  });

  test('Filter tasks by status', async ({ page }) => {
    await createTaskViaUI(page, 'Pending task');
    
    // Filter by completed
    await page.selectOption('select[name="status-filter"]', 'completada');
    
    // Verificar que no aparecen tareas pendientes
    await expect(page.locator('text=Pending task')).not.toBeVisible();
  });

  test('Filter tasks by priority', async ({ page }) => {
    await createTaskViaUI(page, 'High priority task', 'alta');
    await createTaskViaUI(page, 'Low priority task', 'baja');
    
    // Filter by high priority
    await page.selectOption('select[name="priority-filter"]', 'alta');
    
    await expect(page.locator('text=High priority task')).toBeVisible();
    await expect(page.locator('text=Low priority task')).not.toBeVisible();
  });
});

async function createTaskViaUI(page, title, priority = 'media') {
  await page.click('[data-testid="new-task-btn"]');
  await page.fill('input[placeholder="Task title"]', title);
  await page.selectOption('select[name="priority"]', priority);
  await page.click('button:has-text("Create")');
  await page.waitForSelector(`text=${title}`);
}
```

### 3. Categorías (categories.spec.ts)

```typescript
// tests/e2e/categories.spec.ts
test.describe('Categories', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('Assign category to task', async ({ page }) => {
    await createTaskViaUI(page, 'Task with category');
    
    // Open task editor
    await page.click('text=Task with category');
    
    // Add category
    await page.click('[data-testid="add-category-btn"]');
    await page.fill('input[placeholder="Search categories"]', 'Work');
    await page.click('text=Work');
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify category badge
    await expect(page.locator('text=Work')).toBeVisible();
  });

  test('Remove category from task', async ({ page }) => {
    // Crear tarea con categoría
    await createTaskWithCategory(page, 'Task', 'Work');
    
    // Open editor
    await page.click('text=Task');
    
    // Remove category
    await page.click('[data-testid="remove-category-btn"]');
    
    // Verify category removed
    await expect(page.locator('text=Work')).not.toBeVisible();
  });

  test('Filter tasks by category', async ({ page }) => {
    await createTaskWithCategory(page, 'Work task', 'Work');
    await createTaskWithCategory(page, 'Personal task', 'Personal');
    
    // Filter by category
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Work');
    
    await expect(page.locator('text=Work task')).toBeVisible();
    await expect(page.locator('text=Personal task')).not.toBeVisible();
  });
});

async function createTaskWithCategory(page, title, category) {
  await createTaskViaUI(page, title);
  await page.click('text=' + title);
  await page.click('[data-testid="add-category-btn"]');
  await page.click(`text=${category}`);
  await page.click('button:has-text("Save")');
}
```

### 4. Atajos de Teclado (shortcuts.spec.ts)

```typescript
// tests/e2e/shortcuts.spec.ts
test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('Cmd+K opens command palette', async ({ page }) => {
    await page.keyboard.press('Meta+K');
    
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();
  });

  test('Cmd+N creates new task', async ({ page }) => {
    await page.keyboard.press('Meta+N');
    
    // Task creation modal should open
    await expect(page.locator('text=New Task')).toBeVisible();
  });

  test('Escape closes modals', async ({ page }) => {
    await page.click('[data-testid="new-task-btn"]');
    await page.keyboard.press('Escape');
    
    await expect(page.locator('[data-testid="new-task-modal"]')).not.toBeVisible();
  });
});
```

## Ejecución de Tests

```bash
# Ejecutar todos los E2E tests
bun exec playwright test

# Ejecutar tests específicos
bun exec playwright test tests/e2e/auth.spec.ts

# Modo UI (recomendado para debugging)
bun exec playwright test --ui

# Debug mode interactivo
bun exec playwright test --debug

# Ejecutar contra navegador específico
bun exec playwright test --project=chromium

# Generar reporte HTML
bun exec playwright test --reporter=html
# Abrir: playwright-report/index.html
```

## CI/CD Integration

Agregar a `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: cd app/frontend && bun install
      
      - name: Install Playwright browsers
        run: cd app/frontend && bun exec playwright install
      
      - name: Start backend
        run: |
          cd app/backend
          uv sync
          python -m uvicorn app.main:app --port 8000 &
      
      - name: Run E2E tests
        run: cd app/frontend && bun exec playwright test
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: app/frontend/playwright-report/
```

## Criterios de Aceptación

- ✅ Todos los tests pasan localmente
- ✅ Coverage E2E ≥ 80% de flujos user-facing
- ✅ Tests ejecutan en CI/CD
- ✅ Screenshots/videos de fallos guardados
- ✅ Documentación de cómo correr tests en README
- ✅ Test data fixtures para setup consistente
