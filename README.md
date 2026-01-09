# AppTodo - Full-Stack Task Management Application

A modern, feature-rich task management application built with Vue 3, TypeScript, Tailwind CSS on the frontend and FastAPI, SQLAlchemy on the backend. Designed with accessibility, performance, and user experience as core principles.

## 🌟 Features

### Task Management
- **Create, Read, Update, Delete** tasks with full audit logging
- **Advanced Filtering** by status, priority, category, and deadline
- **Batch Operations** for bulk actions on multiple tasks
- **Search Functionality** with full-text search support
- **Category Management** for organizing tasks
- **Event Log** tracking all changes with audit trail

### Keyboard Shortcuts
- `Cmd+K` / `Ctrl+K` - Create new task
- `Cmd+/` / `Ctrl+/` - Show keyboard shortcuts help
- `Cmd+Shift+C` / `Ctrl+Shift+C` - Clear all filters
- `Escape` - Close open modal
- `Cmd+F` / `Ctrl+F` - Focus search
- `J` - Navigate to next task
- `K` - Navigate to previous task
- `Enter` - Open/edit focused task
- `D` - Delete focused task

### User Experience
- **Responsive Design** mobile-first approach with Tailwind CSS
- **Dark Mode Support** with automatic system preference detection
- **Smooth Animations** using Vue transitions and custom animations
- **Loading States** with skeleton screens and progress indicators
- **Toast Notifications** for success/error/info/warning messages
- **Modal System** for confirmations and forms

### Accessibility (WCAG AA)
- Semantic HTML with proper ARIA roles and labels
- Keyboard navigation throughout the application
- Focus indicators and visible focus states
- Proper heading hierarchy
- Color contrast compliance
- Screen reader support

### Developer Experience
- **Component Testing** with Vitest + Vue Test Utils
- **E2E Testing** with Playwright for cross-browser validation
- **Unit Tests** for stores and utilities
- **TypeScript** for type safety
- **ESLint** for code quality
- **API Documentation** with clear endpoint descriptions

## 📋 Project Structure

```
apptodo/
├── app/
│   ├── backend/                 # FastAPI backend
│   │   ├── main.py             # Application entry
│   │   ├── routers/            # API endpoints
│   │   ├── services/           # Business logic
│   │   ├── repositories/       # Data access
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── tests/              # Backend tests
│   │
│   └── frontend/                # Vue 3 SPA
│       ├── src/
│       │   ├── components/      # Vue components
│       │   ├── views/           # Page views
│       │   ├── stores/          # Pinia stores
│       │   ├── router/          # Vue Router
│       │   ├── utils/           # Utility functions
│       │   ├── composables/     # Vue composables
│       │   ├── styles/          # Tailwind CSS
│       │   └── api/             # API client
│       ├── e2e/                 # Playwright E2E tests
│       └── src/__tests__/       # Unit tests
│
├── specs/                        # API specifications
├── AGENTS.md                     # Development workflow
└── SESSION_STATUS.md             # Current session summary

```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ / Bun 1.0+
- Python 3.12+
- UV (Python package manager)
- SQLite 3

### Backend Setup

```bash
# Navigate to backend
cd app/backend

# Install dependencies with UV
uv sync --python 3.12

# Activate virtual environment
source .venv/bin/activate

# Run migrations (if needed)
python -m alembic upgrade head

# Start development server
python -m uvicorn main:app --reload
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend
cd app/frontend

# Install dependencies
bun install

# Start development server
bun run dev

# Run unit tests
bun run test

# Run E2E tests
bun run test:e2e
```

Frontend will be available at `http://localhost:5173`

## 🏗️ Architecture

### Frontend Architecture

```
Vue 3 Components
    ↓
Pinia Stores (State Management)
    ↓
API Client (Axios)
    ↓
Backend API (FastAPI)
```

**Key Components:**
- **App.vue** - Root component with navigation
- **TaskList.vue** - Main task listing with filters
- **TaskForm.vue** - Task creation/editing
- **FilterBar.vue** - Advanced filtering interface
- **ShortcutsHelp.vue** - Keyboard shortcuts modal
- **Toast.vue** - Notification system

**Stores:**
- **task.ts** - Task CRUD and filtering
- **auth.ts** - Authentication and user session
- **ui.ts** - UI state (modals, toasts, sidebar)
- **category.ts** - Category management

### Backend Architecture

```
HTTP Request
    ↓
FastAPI Router
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
SQLAlchemy ORM
    ↓
SQLite Database
```

**Key Endpoints:**
- `GET /api/v1/tasks` - List tasks with advanced filtering
- `POST /api/v1/tasks` - Create task
- `PUT /api/v1/tasks/{id}` - Update task
- `DELETE /api/v1/tasks/{id}` - Delete task
- `POST /api/v1/tasks/batch/complete` - Batch complete
- `POST /api/v1/tasks/batch/delete` - Batch delete
- `GET /api/v1/tasks/{id}/events` - Task audit log

## 🧪 Testing

### Unit Tests (Frontend)

```bash
cd app/frontend

# Run all tests
bun run test

# Run tests in watch mode
bun run test -- --watch

# Run with UI
bun run test:ui

# Test specific file
bun run test -- TaskForm.test.ts
```

**Test Coverage:**
- 13+ component test suites
- 4 store test suites
- 8+ utility test files
- 100+ test specs total

### E2E Tests (Playwright)

```bash
# Run E2E tests
bun run test:e2e

# Run in UI mode
bun run test:e2e:ui

# Run in debug mode
bun run test:e2e:debug

# Run specific test file
bun run test:e2e -- auth.spec.ts
```

**E2E Test Suites:**
- Authentication flows
- Task CRUD operations
- Keyboard shortcut handling
- UI responsiveness
- Accessibility (WCAG AA)
- Performance metrics

### Backend Tests

```bash
cd app/backend

# Run tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_tasks.py
```

## 📚 API Documentation

### Authentication
All API requests require authentication via bearer token in Authorization header:
```
Authorization: Bearer <token>
```

### Task Endpoints

#### List Tasks with Filters
```
GET /api/v1/tasks?status=pending&priority=high&search=urgent&limit=20&offset=0
```

**Query Parameters:**
- `status`: Filter by status (pending, completed)
- `priority`: Filter by priority (low, medium, high)
- `category_id`: Filter by single category
- `categories`: Filter by multiple categories (comma-separated)
- `deadline_from`: Filter by start deadline
- `deadline_to`: Filter by end deadline
- `search`: Full-text search
- `completed`: Boolean filter
- `limit`: Pagination limit (default: 20)
- `offset`: Pagination offset (default: 0)

#### Create Task
```
POST /api/v1/tasks
Content-Type: application/json

{
  "title": "Task Title",
  "description": "Optional description",
  "priority": "medium",
  "deadline": "2026-01-15T00:00:00Z"
}
```

#### Update Task
```
PUT /api/v1/tasks/{task_id}
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "completed",
  "priority": "high"
}
```

#### Batch Operations
```
POST /api/v1/tasks/batch/complete
Content-Type: application/json

{
  "task_ids": ["1", "2", "3"]
}
```

#### Task Events/Audit Log
```
GET /api/v1/tasks/{task_id}/events?limit=50&offset=0
```

## 🎨 Styling & Theming

The application uses **Tailwind CSS v4** with custom configuration:

```javascript
// tailwind.config.js
{
  theme: {
    colors: {
      primary: '#0081CF',
      secondary: '#6366F1',
      danger: '#EF4444',
      warning: '#F59E0B',
      info: '#0081CF',
      success: '#10B981'
    }
  }
}
```

### CSS Classes

**Buttons:**
```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-danger">Danger Button</button>
```

**Cards:**
```html
<div class="card">
  <h2 class="card-title">Title</h2>
  <p class="card-text">Content</p>
</div>
```

**Responsive Grid:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Content -->
</div>
```

## ♿ Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Enter to activate buttons
- Space to toggle checkboxes
- Arrow keys for list navigation
- Escape to close modals

### Screen Reader Support
- Semantic HTML structure
- Proper heading hierarchy (h1, h2, h3)
- ARIA labels and roles
- Alt text for images
- Form labels associated with inputs

### Visual Accessibility
- High contrast colors (WCAG AA)
- Focus indicators on all interactive elements
- Text resizing support
- Color-independent information
- Clear error messages

## 📊 Performance Optimizations

### Frontend
- Code splitting with dynamic imports
- Image lazy loading
- CSS minification
- JavaScript compression
- Caching strategies
- Debounced search input
- Virtual scrolling for large lists

### Backend
- Database connection pooling
- Query optimization with indexes
- Pagination for large datasets
- Response compression (gzip)
- Caching headers
- Async operations with FastAPI

### Metrics
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Page Load Time**: < 5s

## 🔐 Security

### Frontend
- XSS protection via Vue's built-in escaping
- CSRF token handling
- Secure cookie handling
- Input validation and sanitization

### Backend
- JWT/Bearer token authentication
- Password hashing (bcrypt)
- SQL injection prevention (parameterized queries)
- CORS configuration
- Rate limiting
- Input validation (Pydantic)

## 📝 Development Workflow

### Beads Task Tracking
```bash
# Check available work
bd ready

# View task details
bd show apptodo-123

# Claim work
bd update apptodo-123 --status in_progress

# Complete work
bd close apptodo-123

# Sync with git
bd sync
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/task-name

# Commit changes
git commit -m "apptodo-XXX: Description"

# Push to remote
git push origin feature/task-name

# Create pull request
# Merge after review
```

## 📞 Support & Contributing

### Reporting Issues
1. Check existing issues
2. Provide reproduction steps
3. Include browser/environment info
4. Attach error logs if applicable

### Code Style
- ESLint configuration in `.eslintrc`
- TypeScript strict mode enabled
- Prettier for code formatting
- Vue single-file component conventions

### Testing Before Submit
```bash
# Run all tests
bun run test
bun run test:e2e

# Run linter
bun run lint

# Type check
bun run type-check
```

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

Built with:
- [Vue 3](https://vuejs.org/) - Progressive JavaScript framework
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [SQLAlchemy](https://www.sqlalchemy.org/) - Python SQL toolkit
- [Playwright](https://playwright.dev/) - Browser automation
- [Vitest](https://vitest.dev/) - Unit test framework

---

**Last Updated:** January 2026

For detailed development notes, see [SESSION_STATUS.md](SESSION_STATUS.md) and [AGENTS.md](AGENTS.md)
