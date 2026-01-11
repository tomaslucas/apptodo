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
        <div class="task-checkbox-title">
          <input
            type="checkbox"
            class="task-completion-checkbox"
            :checked="task.status === 'completada'"
            data-testid="task-checkbox"
            title="Mark as completed"
            @change="toggleComplete"
          >
          <div class="task-title-section">
            <h3 class="task-title">
              {{ task.title }}
            </h3>
            <p
              v-if="task.description"
              class="task-description"
            >
              {{ task.description }}
            </p>
          </div>
        </div>
        <div class="task-badges">
          <span :class="['priority-badge', `priority-${task.priority}`]">{{ formatLabel(task.priority) }}</span>
          <span :class="['status-badge', `status-${task.status}`]">{{ getStatusIcon(task.status) }} {{ formatLabel(task.status) }}</span>
        </div>
      </div>

      <div class="task-item-meta">
        <div class="categories">
          <span
            v-for="categoryId in task.categories || []"
            :key="categoryId"
            class="category-badge"
          >
            {{ getCategoryName(categoryId) }}
          </span>
        </div>

        <div
          v-if="task.deadline"
          class="task-deadline"
        >
          <span class="deadline-label">📅 {{ formatDeadline(task.deadline) }}</span>
        </div>
      </div>

      <div
        v-if="showActions"
        class="task-item-actions"
      >
        <button
          class="btn-action btn-edit"
          title="Edit task"
          @click="editTask"
        >
          ✏️ Edit
        </button>
        <button
          class="btn-action btn-delete"
          data-testid="delete-btn"
          title="Delete task"
          @click="deleteTask"
        >
          🗑️ Delete
        </button>
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

const showActions = computed(() => {
  return true // Always show actions for now, can be toggled on hover
})

const toggleSelection = () => {
  taskStore.toggleTaskSelection(props.task.id)
}

const formatLabel = (text: string): string => {
  return text
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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

const toggleComplete = async () => {
  const newStatus = props.task.status === 'completada' ? 'pendiente' : 'completada'
  // Use patch in the store which now works with backend
  await taskStore.updateTask(props.task.id, { status: newStatus })
  emit('updateStatus', props.task.id, newStatus)
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
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
  display: flex;
  gap: 1rem;
}

.task-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e0;
}

.task-item.completed {
  background-color: #f8fafc;
  opacity: 0.8;
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

.task-selection-column {
  display: flex;
  align-items: flex-start;
  padding-top: 0.25rem;
  border-right: 1px solid #edf2f7;
  padding-right: 1rem;
}

.task-select-checkbox {
  cursor: pointer;
  width: 20px;
  height: 20px;
  accent-color: #667eea;
  border-radius: 4px;
}

.task-main-content {
  flex: 1;
}

.task-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.task-checkbox-title {
  display: flex;
  gap: 0.75rem;
  flex: 1;
}

.task-completion-checkbox {
  margin-top: 0.25rem;
  cursor: pointer;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  accent-color: #48bb78;
}

.task-title-section {
  flex: 1;
}

.task-title {
  margin: 0;
  font-size: 1.1rem;
  color: #2d3748;
  font-weight: 600;
}

.task-description {
  margin: 0.25rem 0 0 0;
  font-size: 0.95rem;
  color: #4a5568;
  line-height: 1.5;
}

.task-badges {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.priority-badge,
.status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  white-space: nowrap;
}

.priority-low {
  background-color: #f0fff4;
  color: #2f855a;
  border: 1px solid #c6f6d5;
}

.priority-medium {
  background-color: #fffaf0;
  color: #c05621;
  border: 1px solid #feebc8;
}

.priority-high {
  background-color: #fff5f5;
  color: #c53030;
  border: 1px solid #fed7d7;
}

/* Priority left border for task cards */
.priority-border-baja {
  border-left: 4px solid #48bb78;
}

.priority-border-media {
  border-left: 4px solid #ecc94b;
}

.priority-border-alta {
  border-left: 4px solid #f56565;
}

.status-pending {
  background-color: #ebf8ff;
  color: #2b6cb0;
  border: 1px solid #bee3f8;
}

.status-in_progress {
  background-color: #faf5ff;
  color: #6b46c1;
  border: 1px solid #e9d8fd;
}

.status-completed {
  background-color: #f0fff4;
  color: #2f855a;
  border: 1px solid #c6f6d5;
}

.task-item-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #718096;
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
  background-color: #edf2f7;
  color: #4a5568;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.btn-add-category {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.5rem;
  border: 1px dashed #cbd5e0;
  border-radius: 4px;
  background: transparent;
  color: #718096;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-add-category:hover {
  background-color: #f7fafc;
  border-color: #a0aec0;
  color: #4a5568;
}

.plus-icon {
  font-weight: bold;
  font-size: 1.1rem;
  line-height: 1;
}

.task-deadline {
  white-space: nowrap;
}

.deadline-label {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #f7fafc;
  border: 1px solid #edf2f7;
  border-radius: 4px;
  font-size: 0.85rem;
}

.task-item-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  border-top: 1px solid #edf2f7;
  padding-top: 0.75rem;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #4a5568;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-action:hover {
  background-color: #f7fafc;
  border-color: #cbd5e0;
}

.btn-delete:hover {
  background-color: #fff5f5;
  border-color: #feb2b2;
  color: #c53030;
}

@media (max-width: 768px) {
  .task-item-header {
    flex-direction: column;
  }

  .task-badges {
    width: 100%;
    justify-content: flex-start;
  }

  .task-item-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
