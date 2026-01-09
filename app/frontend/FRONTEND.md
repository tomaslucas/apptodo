# Frontend Documentation - AppTodo

Comprehensive guide to the Vue 3 + TypeScript frontend application.

## 📁 Directory Structure

```
src/
├── components/           # Reusable Vue components
│   ├── __tests__/       # Component unit tests
│   ├── App.vue          # Root component
│   ├── TaskList.vue     # Main task listing
│   ├── TaskForm.vue     # Task creation/edit
│   ├── TaskItem.vue     # Individual task item
│   ├── FilterBar.vue    # Filtering interface
│   ├── DeleteConfirmModal.vue
│   ├── ShortcutsHelp.vue
│   ├── Toast.vue
│   ├── LoadingSpinner.vue
│   ├── ProgressBar.vue
│   └── SkeletonScreen.vue
│
├── views/               # Page-level components
│   ├── Dashboard.vue
│   └── NotFound.vue
│
├── stores/              # Pinia state management
│   ├── __tests__/
│   ├── task.ts         # Task store
│   ├── auth.ts         # Auth store
│   ├── ui.ts           # UI state store
│   └── category.ts     # Category store
│
├── router/              # Vue Router configuration
│   └── index.ts        # Routes definition
│
├── composables/         # Reusable composition functions
│   ├── useFormValidation.ts
│   ├── useLoading.ts
│   ├── usePerformance.ts
│   ├── useA11y.ts
│   ├── useToast.ts
│   └── __tests__/
│
├── utils/               # Utility functions
│   ├── shortcuts.ts     # Keyboard shortcuts manager
│   ├── transitions.ts   # Vue transition configs
│   ├── formValidation.ts
│   ├── performance.ts
│   ├── accessibility.ts
│   └── __tests__/
│
├── api/                 # API client
│   ├── client.ts        # Axios instance
│   ├── tasks.ts         # Task endpoints
│   ├── auth.ts          # Auth endpoints
│   └── categories.ts    # Category endpoints
│
├── styles/              # Tailwind CSS styles
│   └── index.css        # Global styles & directives
│
├── assets/              # Static assets
│   └── logo.svg
│
├── App.vue              # Root component
└── main.ts              # Application entry

```

## 🎯 Core Components

### App.vue
Root component that manages:
- Navigation bar
- Router view
- Global layout
- Toast notifications

```vue
<template>
  <div id="app">
    <nav><!-- Navigation --></nav>
    <main>
      <router-view />
    </main>
    <Toast />
  </div>
</template>
```

### TaskList.vue
Main task management component with:
- Task listing
- Filtering interface
- Keyboard shortcuts
- Sorting/pagination

**Key Props:** None (uses store)

**Key Methods:**
- `createTask()` - Create new task
- `editTask(id)` - Edit task
- `deleteTask(id)` - Delete task
- `completeTask(id)` - Mark complete
- `applyFilters()` - Apply filters

### TaskForm.vue
Form component for creating/editing tasks.

**Props:**
```typescript
{
  task?: Task              // For editing
  onSubmit: Function       // Submit callback
  onCancel: Function       // Cancel callback
}
```

**Form Fields:**
- Title (required, max 255 chars)
- Description (optional, max 1000 chars)
- Priority (low, medium, high)
- Category (optional)
- Deadline (optional)

**Validation:**
- Real-time field validation
- Error message display
- Required field checks
- Character length limits

### TaskItem.vue
Individual task display component.

**Props:**
```typescript
{
  task: Task              // Task object
  selected?: boolean      // Selection state
}
```

**Events:**
- `@edit` - Edit task
- `@delete` - Delete task
- `@complete` - Complete task
- `@select` - Toggle selection

**Features:**
- Task display with formatting
- Action buttons (edit, delete, complete)
- Priority badge
- Status indicator
- Checkbox selection

### FilterBar.vue
Advanced filtering interface.

**Props:**
```typescript
{
  filters: FilterOptions
}
```

**Features:**
- Status filter
- Priority filter
- Search input
- Category filter
- Clear filters button
- Active filter indicators

### ShortcutsHelp.vue
Modal displaying keyboard shortcuts.

**Props:**
```typescript
{
  isOpen: boolean
}
```

**Displays:**
- All available shortcuts
- Descriptions
- Platform-specific shortcuts (Cmd vs Ctrl)
- Grouped by category

### DeleteConfirmModal.vue
Confirmation modal for destructive actions.

**Props:**
```typescript
{
  isOpen: boolean
  title: string
  message: string
  itemCount?: number
}
```

**Events:**
- `@confirm` - User confirmed
- `@cancel` - User cancelled

## 🏪 Pinia Stores

### Task Store (task.ts)

**State:**
```typescript
tasks: Task[]                  // All tasks
loading: boolean              // Loading state
error: string | null          // Error message
filters: FilterOptions        // Active filters
selectedTasks: string[]       // Selected task IDs
currentPage: number           // Pagination
pageSize: number              // Items per page
```

**Actions:**
- `addTask(task)` - Add new task
- `updateTask(task)` - Update task
- `deleteTask(id)` - Delete task
- `completeTask(id)` - Mark complete
- `setTasks(tasks)` - Set tasks array
- `clearTasks()` - Clear all
- `setFilters(filters)` - Update filters
- `searchTasks(query)` - Search
- `sortTasks(field, order)` - Sort

**Getters:**
- `filteredTasks` - Filtered tasks
- `sortedTasks` - Sorted tasks
- `taskCount` - Total tasks
- `completedCount` - Completed tasks
- `pendingCount` - Pending tasks
- `taskProgress` - Progress percentage

### Auth Store (auth.ts)

**State:**
```typescript
user: User | null             // Current user
token: string | null          // Auth token
loading: boolean              // Loading state
error: string | null          // Error message
isAuthenticated: boolean      // Auth state
```

**Actions:**
- `login(email, password)` - Login
- `logout()` - Logout
- `setUser(user)` - Set user
- `setToken(token)` - Set token
- `setError(error)` - Set error
- `clearError()` - Clear error

**Getters:**
- `isAuthenticated` - User logged in
- `userEmail` - User email
- `username` - Username
- `userId` - User ID

### UI Store (ui.ts)

**State:**
```typescript
toasts: Toast[]               // Toast notifications
modals: Record<string, Modal> // Open modals
isSidebarOpen: boolean        // Sidebar state
commandPaletteOpen: boolean   // Command palette state
```

**Actions:**
- `addToast(message, type, duration)` - Add toast
- `removeToast(id)` - Remove toast
- `clearToasts()` - Clear all
- `openModal(id)` - Open modal
- `closeModal(id)` - Close modal
- `toggleModal(id)` - Toggle modal
- `toggleSidebar()` - Toggle sidebar

**Getters:**
- `activeModals` - Open modals
- `hasNotifications` - Has unread

### Category Store (category.ts)

**State:**
```typescript
categories: Category[]        // All categories
loading: boolean              // Loading state
error: string | null          // Error message
selectedCategory: string | null
```

**Actions:**
- `addCategory(category)` - Add
- `updateCategory(category)` - Update
- `deleteCategory(id)` - Delete
- `setCategories(categories)` - Set all

## 🎮 Composables

### useFormValidation
Form validation composable.

```typescript
const { 
  errors,
  validate,
  clearErrors,
  isValid
} = useFormValidation()
```

### useLoading
Loading state management.

```typescript
const { 
  isLoading,
  startLoading,
  finishLoading,
  withLoading
} = useLoading()
```

### usePerformance
Performance monitoring.

```typescript
const { 
  measureSync,
  measureAsync,
  cacheWithLRU,
  createMemoized,
  createDebounced,
  createThrottled
} = usePerformance()
```

### useToast
Toast notification composable.

```typescript
const { 
  showToast,
  showSuccess,
  showError,
  showWarning,
  showInfo
} = useToast()
```

### useA11y
Accessibility utilities.

```typescript
const { 
  announceToScreenReader,
  manageFocus,
  trapFocus,
  getAriaLabel
} = useA11y()
```

## 🎨 Styling

### Tailwind Configuration

```typescript
// tailwind.config.js
export default {
  theme: {
    colors: {
      primary: '#0081CF',
      secondary: '#6366F1',
      danger: '#EF4444',
      warning: '#F59E0B',
      info: '#0081CF',
      success: '#10B981'
    },
    spacing: {
      // Tailwind defaults plus custom
    },
    fontSize: {
      // Tailwind defaults plus custom
    }
  }
}
```

### Global Styles

```css
/* src/styles/index.css */

/* Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Button utilities */
.btn {
  @apply px-4 py-2 rounded font-medium transition;
}

.btn-primary {
  @apply bg-primary text-white hover:bg-primary-dark;
}

/* Card utilities */
.card {
  @apply bg-white rounded-lg shadow p-4;
}
```

## 🎬 Transitions & Animations

### Vue Transitions

```vue
<Transition name="fade">
  <component :is="dynamicComponent" />
</Transition>

<TransitionGroup name="slide-up">
  <div v-for="item in items" :key="item.id">{{ item }}</div>
</TransitionGroup>
```

### Custom Animations

```css
/* Keyframe animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

## ⌨️ Keyboard Shortcuts

Registered shortcuts in `utils/shortcuts.ts`:

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl+K | Create new task |
| Cmd/Ctrl+/ | Show shortcuts help |
| Cmd/Ctrl+Shift+C | Clear all filters |
| Escape | Close modal |
| Cmd/Ctrl+F | Focus search |
| J | Next task |
| K | Previous task |
| Enter | Open/edit task |
| D | Delete task |

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Specific file
npm test -- TaskForm.test.ts

# Coverage report
npm test -- --coverage
```

**Test Structure:**
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from './MyComponent.vue'

describe('MyComponent', () => {
  it('should render', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.exists()).toBe(true)
  })
})
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

## 📦 API Integration

### API Client Setup

```typescript
// api/client.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### API Methods

```typescript
// api/tasks.ts
export async function getTasks(filters?: FilterOptions) {
  const response = await apiClient.get('/tasks', { params: filters })
  return response.data
}

export async function createTask(data: CreateTaskInput) {
  const response = await apiClient.post('/tasks', data)
  return response.data
}

export async function updateTask(id: string, data: UpdateTaskInput) {
  const response = await apiClient.put(`/tasks/${id}`, data)
  return response.data
}

export async function deleteTask(id: string) {
  await apiClient.delete(`/tasks/${id}`)
}
```

## 🔐 Security

### Input Validation

```typescript
// Validate before sending
function validateTaskInput(task: TaskInput) {
  if (!task.title) throw new Error('Title required')
  if (task.title.length > 255) throw new Error('Title too long')
  if (task.description?.length > 1000) throw new Error('Description too long')
  return true
}
```

### XSS Protection

Vue 3 automatically escapes template expressions:
```vue
<!-- Safe - escaped -->
<div>{{ userInput }}</div>

<!-- Only use v-html for trusted content -->
<div v-html="trustedContent"></div>
```

## ♿ Accessibility

### ARIA Attributes

```vue
<button aria-label="Close dialog">×</button>
<form aria-labelledby="form-title">
  <h2 id="form-title">Create Task</h2>
  <input aria-required="true" />
</form>
<div role="alert">Error message</div>
```

### Semantic HTML

```vue
<!-- Good -->
<button>Click me</button>
<nav><a href="/">Home</a></nav>
<main>Content</main>
<footer>Footer</footer>

<!-- Avoid -->
<div @click="doSomething">Click me</div>
```

## 📊 Performance Tips

### Code Splitting

```typescript
// Dynamic imports for route components
const Dashboard = defineAsyncComponent(
  () => import('./views/Dashboard.vue')
)
```

### Lazy Loading

```vue
<img v-lazy="imageUrl" />
```

### Computed Properties

```typescript
// Cached computed values
const filteredTasks = computed(() => {
  return tasks.value.filter(t => t.status === 'pending')
})
```

## 🚀 Deployment

### Build

```bash
npm run build
```

Generates optimized production build in `dist/`

### Environment Variables

```bash
# .env.production
VITE_API_URL=https://api.example.com/api/v1
VITE_ENV=production
```

## 📚 Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Pinia Store](https://pinia.vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Playwright Testing](https://playwright.dev/docs/intro)

---

**Last Updated:** January 2026
