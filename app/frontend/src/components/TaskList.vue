<template>
  <div class="task-list-container">
    <FilterBar />

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

    <div v-else class="tasks-grid">
      <TaskItem
        v-for="task in taskStore.filteredTasks"
        :key="task.id"
        :task="task"
        @edit="editTask"
        @delete="onTaskDeleted"
        @updateStatus="onTaskStatusUpdated"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/task'
import { useCategoryStore } from '../stores/category'
import { useUIStore } from '../stores/ui'
import FilterBar from './FilterBar.vue'
import TaskItem from './TaskItem.vue'
import TaskForm from './TaskForm.vue'

const taskStore = useTaskStore()
const categoryStore = useCategoryStore()
const uiStore = useUIStore()

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

onMounted(async () => {
  // Load tasks on component mount
  await taskStore.fetchTasks()

  // Load categories if not already loaded
  if (!categoryStore.hasCategoriesLoaded()) {
    await categoryStore.fetchCategories()
  }

  // Register the task form modal
  uiStore.registerModal('task-form', 'task-form', false, '', {})
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
