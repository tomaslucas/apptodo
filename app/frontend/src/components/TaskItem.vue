<template>
  <div :class="['task-item', `priority-border-${task.priority}`, { completed: task.status === 'completada', selected: isSelected }]">
    <div class="task-selection-column">
      <input
        type="checkbox"
        class="task-select-checkbox"
        :checked="isSelected"
        data-testid="task-select-checkbox"
        title="Seleccionar para acciones en lote"
        @change="toggleSelection"
      >
    </div>

    <div class="task-main-content">
      <div class="task-item-header">
        <h3 class="task-title">
          {{ task.title }}
        </h3>
        <div class="task-header-actions">
          <span :class="['status-badge', `status-${task.status}`]">{{ getStatusIcon(task.status) }}</span>
          <button
            class="btn-icon btn-edit"
            title="Edit task"
            @click="editTask"
          >
            ✏️
          </button>
          <button
            class="btn-icon btn-delete"
            data-testid="delete-btn"
            title="Delete task"
            @click="deleteTask"
          >
            🗑️
          </button>
        </div>
      </div>

      <p
        v-if="task.description"
        class="task-description"
      >
        {{ task.description }}
      </p>

      <div class="task-item-meta">
        <div class="categories">
          <span
            v-for="categoryId in task.categories || []"
            :key="categoryId"
            class="category-badge"
          >
            📁 {{ getCategoryName(categoryId) }}
          </span>
        </div>

        <div
          v-if="task.deadline"
          class="task-deadline"
        >
          <span class="deadline-label">📅 {{ formatDeadline(task.deadline) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore, type Task } from '../stores/task'
import { useCategoryStore } from '../stores/category'
import { useUIStore } from '../stores/ui'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  edit: [taskId: string]
  delete: [taskId: string]
  updateStatus: [taskId: string, status: string]
}>()

const taskStore = useTaskStore()
const categoryStore = useCategoryStore()
const uiStore = useUIStore()

const isSelected = computed(() => taskStore.isTaskSelected(props.task.id))

const toggleSelection = () => {
  taskStore.toggleTaskSelection(props.task.id)
}

const getStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    pendiente: '⏳',
    en_progreso: '🔵',
    completada: '✅',
  }
  return icons[status] || ''
}

const formatDeadline = (deadline: string): string => {
  const date = new Date(deadline)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  } else {
    return date.toLocaleDateString()
  }
}

const getCategoryName = (categoryId: string): string => {
  const category = categoryStore.getCategory(categoryId)
  return category?.name || 'Unknown'
}



const editTask = () => {
  emit('edit', props.task.id)
  uiStore.openModal('task-form', 'Edit Task', { taskId: props.task.id, task: props.task })
}

const deleteTask = () => {
  if (confirm('Are you sure you want to delete this task?')) {
    taskStore.deleteTask(props.task.id)
    emit('delete', props.task.id)
    uiStore.addToast('Task deleted', 'info')
  }
}


</script>

<style scoped>
.task-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.task-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e0;
}

.task-item.completed {
  background-color: #f8fafc;
  opacity: 0.75;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #718096;
}

.task-item.selected {
  background-color: #ebf4ff;
  border-color: #667eea;
  box-shadow: 0 0 0 1px #667eea;
}

/* Priority left border for task cards */
.priority-border-baja {
  border-left: 4px solid #22c55e;
}

.priority-border-media {
  border-left: 4px solid #f59e0b;
}

.priority-border-alta {
  border-left: 4px solid #ef4444;
}

.task-selection-column {
  display: flex;
  align-items: center;
  padding-top: 0.1rem;
}

.task-select-checkbox {
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: #667eea;
  border-radius: 4px;
}

.task-main-content {
  flex: 1;
  min-width: 0;
}

.task-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.task-title {
  margin: 0;
  font-size: 1rem;
  color: #1a202c;
  font-weight: 600;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.status-pendiente {
  background-color: #fef3c7;
}

.status-en_progreso {
  background-color: #dbeafe;
}

.status-completada {
  background-color: #d1fae5;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
}

.btn-icon:hover {
  background-color: #f7fafc;
  border-color: #cbd5e0;
}

.btn-delete:hover {
  background-color: #fef2f2;
  border-color: #fca5a5;
}

.task-description {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-item-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
  flex-wrap: wrap;
}

.categories {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.category-badge {
  display: inline-block;
  background-color: #f3f4f6;
  color: #374151;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.task-deadline {
  white-space: nowrap;
}

.deadline-label {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #374151;
}

@media (max-width: 640px) {
  .task-item-header {
    flex-wrap: wrap;
  }
  
  .task-title {
    flex-basis: 100%;
    order: 1;
  }
  
  .task-header-actions {
    order: 2;
    margin-top: 0.5rem;
  }
}
</style>
