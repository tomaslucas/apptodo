# AppTodo - E2E Testing Guide with Playwright

Guía completa para ejecutar y entender las pruebas end-to-end de AppTodo usando Playwright.

---

## 📋 Tabla de Contenidos

1. [Configuración](#configuración)
2. [Ejecutar Tests](#ejecutar-tests)
3. [Estructura de Tests](#estructura-de-tests)
4. [Resultados y Reportes](#resultados-y-reportes)
5. [Troubleshooting](#troubleshooting)

---

## Configuración

### Requisitos Previos

```bash
Node.js 18+
npm o bun
Python 3.12 (backend)
UV (gestor de paquetes Python)
```

### Instalación de Dependencias

**Frontend:**
```bash
cd app/frontend
npm install
npx playwright install chromium  # Solo necesario una vez
```

**Backend:**
```bash
cd app/backend
uv sync --python 3.12
source .venv/bin/activate
```

### Variables de Entorno

Crear `.env` en `app/backend/`:
```env
DATABASE_URL=sqlite:///./test.db
JWT_SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
```

---

## Ejecutar Tests

### Iniciar Servidores (Terminal 1 - Backend)

```bash
cd app/backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Output esperado:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

### Iniciar Frontend Dev Server (Terminal 2 - Frontend)

```bash
cd app/frontend
npm run dev
```

**Output esperado:**
```
  VITE v5.4.21  ready in 907 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Ejecutar Tests (Terminal 3)

#### Opción 1: Correr Suite Completa

```bash
cd app/frontend
npm run test:e2e
```

#### Opción 2: Correr Solo Chromium

```bash
cd app/frontend
npx playwright test --project=chromium
```

#### Opción 3: Correr Test Específico

```bash
cd app/frontend
npx playwright test fixed-flow.spec.ts --project=chromium
```

#### Opción 4: Modo Headless (sin interfaz gráfica)

```bash
cd app/frontend
npx playwright test --project=chromium --reporter=html
```

#### Opción 5: Modo Debug Interactivo

```bash
cd app/frontend
npx playwright test --project=chromium --debug
```

---

## Estructura de Tests

### Ubicación de Tests

```
app/frontend/e2e/
├── fixed-flow.spec.ts       # Suite principal (8 tests)
├── tasks.spec.ts            # Tests de gestión de tareas
├── auth.spec.ts             # Tests de autenticación
├── shortcuts.spec.ts        # Tests de atajos de teclado
├── ui.spec.ts               # Tests de UI
├── performance.spec.ts      # Tests de rendimiento
├── accessibility.spec.ts    # Tests de accesibilidad
└── debug.spec.ts            # Tests de debug
```

### Test Suite Principal: `fixed-flow.spec.ts`

**8 Tests Incluidos:**

1. **Home page navigation**
   - Verifica que la home page carga correctamente
   - Valida URL y estructura HTML

2. **Navigate directly to login page**
   - Acceso directo a `/login`
   - Verifica presencia de formulario

3. **Login with valid credentials**
   - Completa formulario de login
   - Verifica redirección a dashboard

4. **Dashboard loads after authentication**
   - Verifica que el dashboard carga post-login
   - Comprueba presencia de navbar

5. **Keyboard shortcut Cmd+K opens create form**
   - Presiona Meta+K (Mac) o Ctrl+K (Windows)
   - Verifica que se abre formulario de crear tarea

6. **Keyboard shortcut Cmd+/ shows help**
   - Presiona Meta+Slash para mostrar ayuda
   - Verifica que se abre modal con atajos

7. **Create task with Cmd+K then fill form**
   - Usa shortcut para abrir formulario
   - Completa y envía formulario
   - Verifica que tarea se crea

8. **Logout functionality**
   - Hace click en botón logout
   - Verifica redirección a login

---

## Resultados y Reportes

### Ver Reporte HTML

Después de ejecutar tests:

```bash
cd app/frontend
npx playwright show-report
```

Esto abre automáticamente el reporte en navegador (puerto 9223).

### Screenshots Capturados

Ubicación: `app/frontend/screenshots/`

Estructura de nombres:
- `01-home.png` - Home page
- `02-login-redirect.png` - Redirección a login
- `07-login-page.png` - Formulario login
- `14-shortcut-cmd-k.png` - Shortcut activo
- etc.

### Videos de Fallos

Ubicación: `app/frontend/test-results/`

Estructura:
```
test-results/
├── fixed-flow-AppTodo---Compl-d150d-gate-directly-to-login-page-chromium/
│   ├── test-failed-1.png      # Screenshot del fallo
│   ├── video.webm             # Video del test fallido
│   └── error-context.md       # Contexto del error
└── ...otros tests...
```

---

## Troubleshooting

### Problema: "Test timeout of 30000ms exceeded"

**Síntoma:** Tests tardan mucho o expiran  
**Solución:**

```typescript
// Aumentar timeout global
test.setTimeout(60000)

// O para un test específico
test('my test', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle', { timeout: 15000 })
})
```

### Problema: "Locator not found"

**Síntoma:** `Error: locator.click: No element matches the selector`  
**Solución:**

```typescript
// Esperar a que el elemento esté disponible
await page.waitForSelector('form')
const form = page.locator('form')

// O usar un timeout
const element = await page.locator('form').or(page.locator('div[role="dialog"]'))
```

### Problema: "Page is not ready"

**Síntoma:** Página carga pero no está lista  
**Solución:**

```typescript
// Esperar a que la red esté inactiva
await page.waitForLoadState('networkidle')

// O esperar a un elemento específico
await page.locator('.login-form').waitFor()
```

### Problema: Tailwind CSS errors durante compilation

**Síntoma:** 
```
Cannot apply unknown utility class `px-4`
```

**Solución:** Esto ya fue arreglado. Si vuelve a ocurrir:
1. Verificar que Tailwind v3 está instalado (no v4)
2. Revisar `postcss.config.js`
3. Eliminar `node_modules` y reinstalar: `npm install`

### Problema: Los servidores no inician

**Solución paso a paso:**

1. **Verificar puertos ocupados:**
   ```bash
   # Backend (8000)
   lsof -i :8000
   
   # Frontend (5173)
   lsof -i :5173
   ```

2. **Matar procesos existentes:**
   ```bash
   pkill -f "vite|uvicorn|node|python"
   ```

3. **Reiniciar servidores:**
   ```bash
   # Terminal 1 - Backend
   cd app/backend && source .venv/bin/activate && python -m uvicorn app.main:app --reload
   
   # Terminal 2 - Frontend
   cd app/frontend && npm run dev
   
   # Terminal 3 - Tests
   cd app/frontend && npx playwright test
   ```

---

## Configuración Personalizada

### Modificar Configuración de Playwright

Archivo: `app/frontend/playwright.config.ts`

```typescript
export default defineConfig({
  // Cambiar navegadores
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // Cambiar timeout global
  timeout: 30000, // 30 segundos

  // Cambiar esperado de "npm run dev"
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },

  // Cambiar reportero
  reporter: 'html', // o 'list', 'json', 'junit'
})
```

### Crear Custom Test

Crear archivo `app/frontend/e2e/custom.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('My Custom Tests', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/')
    
    // Tu lógica aquí
    const heading = page.getByRole('heading', { name: /welcome/i })
    await expect(heading).toBeVisible()
  })
})
```

Ejecutar:
```bash
npx playwright test custom.spec.ts
```

---

## Best Practices

### ✅ DO's

- ✅ Esperar a que la página esté lista: `await page.waitForLoadState('networkidle')`
- ✅ Usar `getByRole` en lugar de `locator` cuando sea posible
- ✅ Agrupar tests relacionados con `test.describe()`
- ✅ Usar `beforeEach` para setup común
- ✅ Capturar screenshots en puntos clave

### ❌ DON'Ts

- ❌ No asumir que elementos están presentes sin verificar
- ❌ No usar timeouts demasiado cortos (<5000ms)
- ❌ No hacer múltiples assertions en un solo test
- ❌ No usar `sleep()` - usar `waitFor()` en su lugar
- ❌ No ignorar errores de compilación

---

## Reportes Generados

Después de ejecutar tests, se generan:

```
app/frontend/
├── playwright-report/          # Reporte HTML
│   └── index.html              # Abre este archivo
├── test-results/               # Resultados detallados
│   ├── test-file-browser/
│   ├── screenshots/
│   └── videos/
└── .auth/                      # Datos de autenticación si lo necesitas
```

Ver reporte:
```bash
npx playwright show-report
```

---

## Automatización en CI/CD

Los tests se pueden integrar en GitHub Actions. Ver `.github/workflows/` para configuración.

```yaml
- name: Run Playwright tests
  run: npm run test:e2e
  
- name: Upload Playwright Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

---

## Referencias

- [Documentación oficial de Playwright](https://playwright.dev)
- [Guía de selectores](https://playwright.dev/docs/locators)
- [Configuración de Playwright](https://playwright.dev/docs/test-configuration)
- [Best practices](https://playwright.dev/docs/best-practices)

---

**Última actualización:** 9 de Enero, 2026  
**Versión de Playwright:** 1.57.0  
**Navegadores soportados:** Chromium, Firefox, Safari (WebKit)
