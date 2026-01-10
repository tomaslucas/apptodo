# Guía de Migración de Docker a Setup Nativo

Esta guía explica cómo migrar el desarrollo de AppTodo de un entorno basado en Docker a un entorno nativo utilizando **UV** (Python) y **Bun** (Frontend).

## Beneficios del Setup Nativo

1. **Rendimiento**: Ejecución más rápida de tests y compilación.
2. **Depuración**: Integración directa con las herramientas de depuración de tu IDE (VS Code, Cursor, etc.).
3. **Simplicidad**: Menos capas de abstracción y problemas de permisos de archivos.
4. **Eficiencia**: Menor consumo de recursos (CPU/RAM) comparado con Docker Desktop.

---

## 1. Requisitos Previos

### Backend (Python/UV)
Instala **UV**, el gestor de paquetes de Python extremadamente rápido:

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Frontend (Node.js/Bun)
Instala **Bun**, el entorno de ejecución de JavaScript "todo en uno":

```bash
# macOS / Linux / WSL
curl -fsSL https://bun.sh/install | bash
```

---

## 2. Migración del Backend

El backend utiliza FastAPI y SQLite.

1.  **Entrar al directorio del backend**:
    ```bash
    cd app/backend
    ```

2.  **Sincronizar dependencias**:
    UV gestionará automáticamente la versión de Python (3.12) y creará un entorno virtual:
    ```bash
    uv sync --python 3.12 --extra dev
    ```

3.  **Configurar variables de entorno**:
    Si tenías configuraciones específicas en Docker, pásalas a tu `.env` local:
    ```bash
    cp .env.example .env
    # Asegúrate de que DATABASE_URL=sqlite:///./app.db para desarrollo local
    ```

4.  **Ejecutar el backend**:
    ```bash
    uv run uvicorn app.main:app --reload --port 8000
    ```

---

## 3. Migración del Frontend

El frontend es una aplicación Vue 3 con Vite.

1.  **Entrar al directorio del frontend**:
    ```bash
    cd app/frontend
    ```

2.  **Instalar dependencias**:
    ```bash
    bun install
    ```

3.  **Configurar variables de entorno**:
    ```bash
    cp .env.example .env
    ```

4.  **Ejecutar el frontend**:
    ```bash
    bun run dev
    ```

---

## 4. Diferencias Clave

| Característica | Docker | Nativo |
| :--- | :--- | :--- |
| **Acceso API** | `http://localhost:8000` | `http://localhost:8000` |
| **Acceso App** | `http://localhost:5173` | `http://localhost:5173` |
| **Persistencia** | Volumen en `./data` | Archivo local `./app/backend/app.db` |
| **Logs** | `docker compose logs` | Salida directa en terminal |
| **Comando Run** | `docker compose up` | `uv run...` / `bun run...` |

---

## 5. Troubleshooting (Solución de Problemas)

### Conflicto de Puertos
Si recibes un error de "Address already in use", asegúrate de detener los contenedores de Docker antes de iniciar el setup nativo:
```bash
docker compose down
```

### Base de Datos
Si deseas conservar los datos de tu contenedor Docker, copia el archivo de base de datos del volumen:
```bash
cp data/app.db app/backend/app.db
```

### Variables de Entorno
Recuerda que en el setup nativo, el frontend utiliza `http://localhost:8000` para comunicarse con el backend (gestionado por el proxy de Vite en `vite.config.ts`).
