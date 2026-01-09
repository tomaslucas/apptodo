<template>
  <div class="task-list-container">
    <FilterBar />

    <BatchActionsBar />

    <div class="task-list-header">
      <h2>{{ taskStore.filteredTasks.length }} Tasks</h2>
      <button @click="createNewTask" class="btn-create-task" data-testid="new-task-btn">
        + New Task
      </button>
    </div>

    <TaskForm modalId="task-form" />

    <div v-if="taskStore.isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading tasks...</p>
    </div>

    <div v-else-if="taskStore.filteredTasks.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No tasks found</h3>
      <p v-if="hasActiveFilters">Try adjusting your filters</p>
      <p v-else>Create your first task to get started</p>
      <button v-if="!hasActiveFilters" @click="createNewTask" class="btn-create-empty">
        Create Task
      </button>
    </div>

    <Transition-group
      v-else
      name="slide-up"
      tag="div"
      class="tasks-grid"
    >
      <TaskItem
        v-for="(task, index) in taskStore.filteredTasks"
        :key="task.id"
        :task="task"
        :class="{ 'task-focused': focusedTaskIndex === index }"
        :data-task-focus-index="index"
        @edit="editTask"
        @delete="onTaskDeleted"
        @updateStatus="onTaskStatusUpdated"
      />
    </Transition-group>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useTaskStore } from '../stores/task'
import { useCategoryStore } from '../stores/category'
import { useUIStore } from '../stores/ui'
import { useShortcuts } from '../utils/shortcutsManager'
import FilterBar from './FilterBar.vue'
import TaskItem from './TaskItem.vue'
import TaskForm from './TaskForm.vue'
import BatchActionsBar from './BatchActionsBar.vue'

const taskStore = useTaskStore()
const categoryStore = useCategoryStore()
const uiStore = useUIStore()
const { register, unregister, start, stop } = useShortcuts()

// Track focused task index for keyboard navigation
const focusedTaskIndex = ref<number | null>(null)

const hasActiveFilters = computed(() => {
  return (
    taskStore.filters.status ||
    taskStore.filters.priority ||
    taskStore.filters.category_id ||
    taskStore.filters.search
  )
})

const createNewTask = () => {
  uiStore.openModal('task-form', 'Create New Task', {})
}

const editTask = (taskId: string) => {
  const task = taskStore.tasks.find((t) => t.id === taskId)
  if (task) {
    uiStore.openModal('task-form', 'Edit Task', { task })
  }
}

const onTaskDeleted = (taskId: string) => {
  // Additional logic for task deletion if needed
}

const onTaskStatusUpdated = (taskId: string, newStatus: string) => {
  // Additional logic for status update if needed
}

const focusNextTask = () => {
  if (taskStore.filteredTasks.length === 0) return
  
  if (focusedTaskIndex.value === null) {
    focusedTaskIndex.value = 0
  } else if (focusedTaskIndex.value < taskStore.filteredTasks.length - 1) {
    focusedTaskIndex.value++
  }
  // Scroll to focused task
  scrollToFocusedTask()
}

const focusPreviousTask = () => {
  if (taskStore.filteredTasks.length === 0) return
  
  if (focusedTaskIndex.value === null) {
    focusedTaskIndex.value = taskStore.filteredTasks.length - 1
  } else if (focusedTaskIndex.value > 0) {
    focusedTaskIndex.value--
  }
  // Scroll to focused task
  scrollToFocusedTask()
}

const openFocusedTask = () => {
  if (focusedTaskIndex.value !== null && taskStore.filteredTasks[focusedTaskIndex.value]) {
    editTask(taskStore.filteredTasks[focusedTaskIndex.value].id)
  }
}

const deleteFocusedTask = async () => {
  if (focusedTaskIndex.value !== null && taskStore.filteredTasks[focusedTaskIndex.value]) {
    const taskId = taskStore.filteredTasks[focusedTaskIndex.value].id
    if (confirm('Are you sure you want to delete this task?')) {
      await taskStore.deleteTask(taskId)
      onTaskDeleted(taskId)
      uiStore.addToast('Task deleted', 'info')
      // Adjust focused index
      if (focusedTaskIndex.value >= taskStore.filteredTasks.length) {
        focusedTaskIndex.value = taskStore.filteredTasks.length - 1
      }
    }
  }
}

const scrollToFocusedTask = () => {
  setTimeout(() => {
    const element = document.querySelector(`[data-task-focus-index="${focusedTaskIndex.value}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, 0)
}

const focusSearchInput = () => {
  const searchInput = document.querySelector('#search-filter') as HTMLInputElement
  if (searchInput) {
    searchInput.focus()
  }
}

const registerShortcuts = () => {
  // Shortcut 1: Cmd+K / Ctrl+K - Create new task
  register({
    id: 'task-list-create-new',
    keys: ['Meta', 'K'],
    description: 'Create new task',
    handler: async () => createNewTask(),
    enabled: true,
  })

  // Fallback for Ctrl+K on non-Mac
  register({
    id: 'task-list-create-new-ctrl',
    keys: ['Control', 'K'],
    description: 'Create new task (Windows/Linux)',
    handler: async () => createNewTask(),
    enabled: true,
  })

  // Shortcut 2: Cmd+/ / Ctrl+/ - Show all shortcuts
  register({
    id: 'task-list-show-shortcuts',
    keys: ['Meta', '/'],
    description: 'Show available shortcuts',
    handler: async () => {
      uiStore.addToast('Shortcuts: Cmd+K (new), Cmd+F (search), Cmd+Shift+C (clear), J/K (nav), Enter (edit), D (delete), Esc (close)', 'info')
    },
    enabled: true,
  })

  // Shortcut 3: Cmd+Shift+C / Ctrl+Shift+C - Clear all filters
  register({
    id: 'task-list-clear-filters-meta',
    keys: ['Meta', 'Shift', 'C'],
    description: 'Clear all filters',
    handler: async () => taskStore.clearFilters(),
    enabled: true,
  })

  register({
    id: 'task-list-clear-filters-ctrl',
    keys: ['Control', 'Shift', 'C'],
    description: 'Clear all filters (Windows/Linux)',
    handler: async () => taskStore.clearFilters(),
    enabled: true,
  })

  // Shortcut 4: Escape - Close modals
  register({
    id: 'task-list-close-modal',
    keys: ['Escape'],
    description: 'Close open modal',
    handler: async () => {
      if (uiStore.getActiveModal()) {
        uiStore.closeModal()
      }
    },
    enabled: true,
  })

  // Shortcut 5: Cmd+F / Ctrl+F - Focus search input
  register({
    id: 'task-list-focus-search-meta',
    keys: ['Meta', 'F'],
    description: 'Focus search input',
    handler: async () => focusSearchInput(),
    enabled: true,
  })

  register({
    id: 'task-list-focus-search-ctrl',
    keys: ['Control', 'F'],
    description: 'Focus search input (Windows/Linux)',
    handler: async () => focusSearchInput(),
    enabled: true,
  })

  // Shortcut 6: J - Move to next task
  register({
    id: 'task-list-next-task',
    keys: ['J'],
    description: 'Move to next task',
    handler: async () => focusNextTask(),
    enabled: true,
  })

  // Shortcut 7: K - Move to previous task
  register({
    id: 'task-list-prev-task',
    keys: ['K'],
    description: 'Move to previous task',
    handler: async () => focusPreviousTask(),
    enabled: true,
  })

  // Shortcut 8: Enter - Open focused task
  register({
    id: 'task-list-open-task',
    keys: ['Enter'],
    description: 'Open focused task',
    handler: async () => openFocusedTask(),
    enabled: true,
  })

  // Shortcut 9: D - Delete focused task
  register({
    id: 'task-list-delete-task',
    keys: ['D'],
    description: 'Delete focused task',
    handler: async () => deleteFocusedTask(),
    enabled: true,
  })
}

const unregisterShortcuts = () => {
  unregister('task-list-create-new')
  unregister('task-list-create-new-ctrl')
  unregister('task-list-show-shortcuts')
  unregister('task-list-clear-filters-meta')
  unregister('task-list-clear-filters-ctrl')
  unregister('task-list-close-modal')
  unregister('task-list-focus-search-meta')
  unregister('task-list-focus-search-ctrl')
  unregister('task-list-next-task')
  unregister('task-list-prev-task')
  unregister('task-list-open-task')
  unregister('task-list-delete-task')
}

onMounted(async () => {
  // Load tasks on component mount
  await taskStore.fetchTasks()

  // Load categories if not already loaded
  if (!categoryStore.hasCategoriesLoaded()) {
    await categoryStore.fetchCategories()
  }

  // Register the task form modal
  uiStore.registerModal('task-form', 'task-form', false, '', {})

  // Register and start shortcuts
  registerShortcuts()
  start()
})

onUnmounted(() => {
  // Unregister shortcuts when component is unmounted
  unregisterShortcuts()
  stop()
})
</script>

<style scoped>
.task-list-container {
  width: 100%;
}

.task-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.task-list-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.btn-create-task {
  padding: 0.75rem 1.5rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.95rem;
  white-space: nowrap;
}

.btn-create-task:hover {
  background-color: #45a049;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #999;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 1.3rem;
}

.empty-state p {
  margin: 0 0 1rem 0;
  color: #999;
}

.btn-create-empty {
  padding: 0.75rem 2rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.95rem;
}

.btn-create-empty:hover {
  background-color: #5568d3;
}

.tasks-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

.task-focused {
  border: 2px solid #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

@media (max-width: 768px) {
  .task-list-header {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-create-task {
    width: 100%;
  }
}
</style>
