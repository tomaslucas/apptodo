<template>
  <div :class="['task-item', { completed: task.status === 'completed' }]">
    <div class="task-item-header">
      <div class="task-checkbox-title">
        <input
          type="checkbox"
          class="task-checkbox"
          :checked="task.status === 'completed'"
          @change="toggleComplete"
          data-testid="task-checkbox"
        />
        <div class="task-title-section">
          <h3 class="task-title">{{ task.title }}</h3>
          <p v-if="task.description" class="task-description">{{ task.description }}</p>
        </div>
      </div>
      <div class="task-badges">
        <span :class="['priority-badge', `priority-${task.priority}`]">{{ formatLabel(task.priority) }}</span>
        <span :class="['status-badge', `status-${task.status}`]">{{ formatLabel(task.status) }}</span>
      </div>
    </div>

    <div class="task-item-meta">
      <div class="categories">
        <span v-for="categoryId in task.categories || []" :key="categoryId" class="category-badge">
          {{ getCategoryName(categoryId) }}
        </span>
        <button v-if="showActions" @click="openCategoryModal" class="btn-add-category" title="Add category">
          +
        </button>
      </div>

      <div class="task-deadline" v-if="task.deadline">
        <span class="deadline-label">{{ formatDeadline(task.deadline) }}</span>
      </div>
    </div>

    <div v-if="showActions" class="task-item-actions">
      <button @click="editTask" class="btn-action btn-edit" title="Edit task">
        ✏️
      </button>
      <button @click="deleteTask" class="btn-action btn-delete" data-testid="delete-btn" title="Delete task">
        🗑️
      </button>
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

const showActions = computed(() => {
  return true // Always show actions for now, can be toggled on hover
})

const formatLabel = (text: string): string => {
  return text
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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
  const newStatus = props.task.status === 'completed' ? 'pending' : 'completed'
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

const openCategoryModal = () => {
  uiStore.openModal('category', 'Add Category', { taskId: props.task.id })
}
</script>

<style scoped>
.task-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
}

.task-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #d0d0d0;
}

.task-item.completed {
  background-color: #f5f5f5;
  opacity: 0.7;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #999;
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

.task-checkbox {
  margin-top: 0.25rem;
  cursor: pointer;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.task-title-section {
  flex: 1;
}

.task-title {
  margin: 0;
  font-size: 1.05rem;
  color: #333;
  font-weight: 500;
}

.task-description {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}

.task-badges {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.priority-badge,
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.priority-low {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.priority-medium {
  background-color: #fff3e0;
  color: #e65100;
}

.priority-high {
  background-color: #ffebee;
  color: #c62828;
}

.status-pending {
  background-color: #e3f2fd;
  color: #1565c0;
}

.status-in_progress {
  background-color: #f3e5f5;
  color: #6a1b9a;
}

.status-completed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.task-item-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: #666;
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
  background-color: #e0e0e0;
  color: #333;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
}

.btn-add-category {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-add-category:hover {
  background-color: #f5f5f5;
  border-color: #999;
}

.task-deadline {
  white-space: nowrap;
}

.deadline-label {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 0.85rem;
}

.task-item-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-action {
  padding: 0.4rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-action:hover {
  background-color: #f5f5f5;
  border-color: #999;
}

.btn-delete:hover {
  background-color: #ffebee;
  border-color: #c62828;
}

@media (max-width: 768px) {
  .task-item-header {
    flex-direction: column;
  }

  .task-badges {
    width: 100%;
    justify-content: space-between;
  }

  .task-item-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
