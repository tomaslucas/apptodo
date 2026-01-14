# AppTodo Frontend

Frontend Vue 3 + TypeScript para la aplicación de gestión de tareas.

## Setup

### Prerequisites

- Node.js 18+
- Bun (opcional, puede usar npm o yarn)

### Installation

```bash
# Instalar dependencias
bun install
# o: npm install

# Configurar variables de entorno
cp .env.example .env
```

### Development

```bash
bun run dev
# o: npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Build

```bash
bun run build
# o: npm run build
```

### Type Check

```bash
bun run type-check
# o: npm run type-check
```

## Estructura

```
src/
├── api/                    # API client
├── assets/                 # Imágenes, estilos
├── components/             # Componentes Vue reutilizables
├── router/                 # Vue Router configuración
├── stores/                 # Pinia stores
├── views/                  # Vistas/páginas
├── App.vue                 # Componente raíz
└── main.ts                 # Punto de entrada
```

## Development

- API proxy configurado en `vite.config.ts` para `/api` → `http://localhost:8000`
- TypeScript strict mode habilitado
- Absolute imports con `@/*` alias
