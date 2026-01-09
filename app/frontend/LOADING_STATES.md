# Loading States & Feedback Visual - apptodo-61

## Overview

Comprehensive loading states and visual feedback system with multiple components and utilities for managing async operations.

## Components

### LoadingSpinner.vue

Reusable spinner component with customizable size, label, and layout options.

```vue
<LoadingSpinner 
  size="medium"
  label="Loading..."
  centered
  overlay
/>
```

**Props:**
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `label`: String - Optional label below spinner
- `centered`: Boolean - Center vertically and fill height (default: false)
- `overlay`: Boolean - Full-screen overlay with dark background (default: false)

### SkeletonScreen.vue

Placeholder loading screens for different content types.

```vue
<SkeletonScreen 
  variant="card"
  count="3"
  animated
/>
```

**Props:**
- `variant`: 'text' | 'card' | 'list-item' | 'full' (default: 'text')
- `count`: Number - Number of skeleton lines (default: 3)
- `animated`: Boolean - Pulsing animation (default: true)

### ProgressBar.vue

Linear progress indicator with optional label and color variants.

```vue
<ProgressBar 
  :value="75"
  :max="100"
  size="medium"
  color="primary"
  showLabel
  animated
/>
```

**Props:**
- `value`: Number - Current progress value
- `max`: Number - Maximum progress value (default: 100)
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `color`: 'primary' | 'success' | 'warning' | 'danger' | 'info' (default: 'primary')
- `showLabel`: Boolean - Show percentage label (default: false)
- `animated`: Boolean - Glow animation (default: true)

### Toast.vue

Toast notification component with auto-dismiss and type variants.

```vue
<Toast
  type="success"
  title="Success"
  message="Operation completed"
  duration="3000"
  closeable
  @close="handleClose"
/>
```

**Props:**
- `type`: 'success' | 'error' | 'warning' | 'info' (default: 'info')
- `title`: String - Optional title
- `message`: String - Required message
- `duration`: Number | null - Auto-dismiss in ms (null = persistent)
- `closeable`: Boolean - Show close button (default: true)

**Events:**
- `close` - Emitted when toast is dismissed

## Composables

### useLoading(options?)

Manage loading state with optional progress tracking.

```typescript
const { 
  isLoading,
  progress,
  start,
  end,
  setProgress,
  reset
} = useLoading({ 
  delay: 300,
  onStart: () => console.log('Started'),
  onEnd: () => console.log('Finished')
})

// Start loading
start()

// Update progress manually
setProgress(50)

// End loading
end()

// Reset state
reset()
```

**Options:**
- `delay`: Number - Delay before showing loading (default: 0)
- `onStart`: Function - Callback when loading starts
- `onEnd`: Function - Callback when loading ends

**Returns:**
- `isLoading`: Ref<Boolean> - Loading state
- `progress`: Ref<Number> - Progress 0-100
- `start()` - Start loading
- `end()` - End loading  
- `setProgress(value)` - Update progress
- `reset()` - Reset to initial state

### useToast()

Global toast notification manager.

```typescript
const {
  toasts,
  addToast,
  removeToast,
  success,
  error,
  warning,
  info,
  clear
} = useToast()

// Quick methods
success('Operation completed', 'Success')
error('Failed to load', 'Error')
warning('Please confirm', 'Warning')
info('New update available', 'Info')

// Manual control
const id = addToast('Custom message', {
  type: 'info',
  duration: 5000,
  closeable: true
})

removeToast(id)

// Clear all
clear()
```

**Methods:**
- `addToast(message, options?)` - Add toast
- `removeToast(id)` - Remove by ID
- `success(message, title?)` - Success toast (3s)
- `error(message, title?)` - Error toast (5s)
- `warning(message, title?)` - Warning toast (3s)
- `info(message, title?)` - Info toast (3s)
- `clear()` - Remove all

## Utilities

### loading.ts

Utility functions for async operations with loading management.

```typescript
import { 
  delay,
  withLoading,
  simulateProgress,
  batchWithProgress
} from '@/utils/loading'

// Simple delay
await delay(1000)

// Wrap async function with min duration
const result = await withLoading(async () => {
  return await fetchData()
}, 500)

// Simulate progress
for await (const progress of simulateProgress(3000, 10)) {
  console.log(progress) // 0-100
}

// Batch operations with progress
const results = await batchWithProgress(
  tasks,
  (current, total) => {
    console.log(`${current}/${total}`)
  }
)
```

## Usage Patterns

### Loading a List

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLoading } from '@/composables/useLoading'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const { isLoading, start, end } = useLoading({ delay: 300 })
const { error, success } = useToast()
const tasks = ref([])

onMounted(async () => {
  start()
  try {
    const response = await fetch('/api/tasks')
    tasks.value = await response.json()
    success('Tasks loaded')
  } catch (err) {
    error('Failed to load tasks')
  } finally {
    end()
  }
})
</script>

<template>
  <LoadingSpinner v-if="isLoading" label="Loading..." />
  <ul v-else>
    <li v-for="task in tasks" :key="task.id">
      {{ task.title }}
    </li>
  </ul>
</template>
```

### Form Submission with Progress

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useLoading } from '@/composables/useLoading'
import { useToast } from '@/composables/useToast'
import ProgressBar from '@/components/ProgressBar.vue'

const { isLoading, progress, start, end, setProgress } = useLoading()
const { success, error } = useToast()
const formData = ref({})

const submitForm = async () => {
  start()
  try {
    // Simulate upload steps
    setProgress(33)
    await delay(500)
    
    setProgress(66)
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(formData.value)
    })
    
    if (!response.ok) throw new Error('Submit failed')
    
    setProgress(100)
    success('Form submitted successfully')
  } catch (err) {
    error('Failed to submit form')
  } finally {
    end()
  }
}
</script>

<template>
  <form @submit.prevent="submitForm">
    <ProgressBar v-if="isLoading" :value="progress" show-label />
    <button type="submit" :disabled="isLoading">
      {{ isLoading ? 'Submitting...' : 'Submit' }}
    </button>
  </form>
</template>
```

### Skeleton Screens for Content

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SkeletonScreen from '@/components/SkeletonScreen.vue'

const isLoading = ref(true)
const items = ref([])

onMounted(async () => {
  await delay(1500)
  items.value = generateItems(10)
  isLoading.value = false
})
</script>

<template>
  <div class="list">
    <SkeletonScreen v-if="isLoading" variant="list-item" count="3" />
    <div v-for="item in items" :key="item.id" class="item">
      {{ item.name }}
    </div>
  </div>
</template>
```

## Integration with App.vue

The global toast system is integrated into App.vue:

```vue
<template>
  <div id="app">
    <!-- Toasts rendered globally -->
    <div v-for="toast in toasts" :key="toast.id">
      <Toast
        :type="toast.type"
        :title="toast.title"
        :message="toast.message"
        :duration="toast.duration"
        :closeable="toast.closeable"
        @close="removeToast(toast.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()
</script>
```

## Test Coverage

- **useLoading.test.ts** - 11 tests for loading state management
- **useToast.test.ts** - 11 tests for toast notifications
- **LoadingSpinner.test.ts** - 5 validation tests
- **Toast.test.ts** - 8 validation tests
- **LoadingStates.integration.test.ts** - 3 integration tests

Run all tests:
```bash
bun test
```

## Files Created

### Components
- `src/components/LoadingSpinner.vue`
- `src/components/SkeletonScreen.vue`
- `src/components/ProgressBar.vue`
- `src/components/Toast.vue`

### Composables
- `src/composables/useLoading.ts`
- `src/composables/useToast.ts`

### Utilities
- `src/utils/loading.ts`

### Tests
- `src/components/__tests__/LoadingSpinner.test.ts`
- `src/components/__tests__/Toast.test.ts`
- `src/components/__tests__/LoadingStates.integration.test.ts`
- `src/composables/__tests__/useLoading.test.ts`
- `src/composables/__tests__/useToast.test.ts`

## Performance Considerations

- **Lazy Progress Updates**: Progress simulation uses 500ms intervals to avoid excessive re-renders
- **Toast Cleanup**: Auto-dismiss prevents memory leaks from accumulated notifications
- **Skeleton Animations**: CSS-based pulse animation for 60fps smoothness
- **Component Reusability**: All components accept reactive props for dynamic control

## Accessibility

- Toast notifications support focus management
- Loading spinners include ARIA labels
- Keyboard-closeable toasts (optional)
- Sufficient color contrast ratios
- Progress bars use semantic HTML

## Browser Support

All components use modern CSS and Vue 3 features:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- No IE11 support
