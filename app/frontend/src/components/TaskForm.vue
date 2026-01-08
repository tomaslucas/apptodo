<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEditMode ? 'Edit Task' : 'Create New Task' }}</h2>
        <button @click="closeModal" class="btn-close">✕</button>
      </div>

      <form @submit.prevent="submitForm" class="task-form">
        <div class="form-group">
          <label for="title">Task Title *</label>
          <input v-model="formData.title" type="text" id="title" placeholder="Enter task title" required />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            v-model="formData.description"
            id="description"
            placeholder="Enter task description (optional)"
            rows="4"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="priority">Priority</label>
            <select v-model="formData.priority" id="priority" name="priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div class="form-group">
            <label for="deadline">Deadline</label>
            <input v-model="formData.deadline" type="date" id="deadline" />
          </div>
        </div>

        <div class="form-group">
          <label for="categories">Categories</label>
          <div class="categories-select">
            <div v-for="category in categoryStore.categories" :key="category.id" class="category-checkbox">
              <input
                type="checkbox"
                :id="`category-${category.id}`"
                :value="category.id"
                v-model="formData.categories"
              />
              <label :for="`category-${category.id}`">{{ category.name }}</label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="status">Status</label>
          <select v-model="formData.status" id="status">
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="form-actions">
          <button type="submit" class="btn-submit" :disabled="isLoading">
            {{ isLoading ? 'Saving...' : 'Save Task' }}
          </button>
          <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTaskStore, type Task } from '../stores/task'
import { useCategoryStore } from '../stores/category'
import { useUIStore } from '../stores/ui'

const props = defineProps<{
  modalId?: string
}>()

const taskStore = useTaskStore()
const categoryStore = useCategoryStore()
const uiStore = useUIStore()

const isEditMode = ref(false)
const currentTaskId = ref<string | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const formData = ref({
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  deadline: '',
  categories: [] as string[],
  status: 'pending' as 'pending' | 'in_progress' | 'completed',
})

const isOpen = computed(() => {
  if (props.modalId) {
    const modal = uiStore.modals[props.modalId]
    return modal?.isOpen ?? false
  }
  return false
})

const closeModal = () => {
  if (props.modalId) {
    uiStore.closeModal(props.modalId)
  }
  resetForm()
}

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    categories: [],
    status: 'pending',
  }
  isEditMode.value = false
  currentTaskId.value = null
  error.value = null
}

const submitForm = async () => {
  if (!formData.value.title.trim()) {
    error.value = 'Task title is required'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    if (isEditMode.value && currentTaskId.value) {
      // Update existing task
      await taskStore.updateTask(currentTaskId.value, {
        title: formData.value.title,
        description: formData.value.description,
        priority: formData.value.priority,
        deadline: formData.value.deadline,
        categories: formData.value.categories,
        status: formData.value.status,
      } as Partial<Task>)
      uiStore.addToast('Task updated successfully', 'success')
    } else {
      // Create new task
      await taskStore.createTask({
        title: formData.value.title,
        description: formData.value.description,
        priority: formData.value.priority,
        deadline: formData.value.deadline,
        categories: formData.value.categories,
        status: formData.value.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Omit<Task, 'id'>)
      uiStore.addToast('Task created successfully', 'success')
    }

    closeModal()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred while saving the task'
  } finally {
    isLoading.value = false
  }
}

// Watch for modal data changes to populate edit form
watch(
  () => uiStore.modals[props.modalId || '']?.data,
  async (data) => {
    if (data && data.task) {
      isEditMode.value = true
      currentTaskId.value = data.task.id
      formData.value = {
        title: data.task.title,
        description: data.task.description || '',
        priority: data.task.priority,
        deadline: data.task.deadline || '',
        categories: data.task.categories || [],
        status: data.task.status,
      }
    } else if (data && data.taskId) {
      // If only taskId is provided, fetch the task
      const task = taskStore.tasks.find((t) => t.id === data.taskId)
      if (task) {
        isEditMode.value = true
        currentTaskId.value = task.id
        formData.value = {
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          deadline: task.deadline || '',
          categories: task.categories || [],
          status: task.status,
        }
      }
    } else {
      resetForm()
    }
  },
  { deep: true }
)

onMounted(async () => {
  // Load categories if not already loaded
  if (!categoryStore.hasCategoriesLoaded()) {
    await categoryStore.fetchCategories()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: #f5f5f5;
  color: #333;
}

.task-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.95rem;
}

.form-group input[type='text'],
.form-group input[type='date'],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group input[type='text']:focus,
.form-group input[type='date']:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.categories-select {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.category-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-checkbox input[type='checkbox'] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.category-checkbox label {
  margin: 0;
  cursor: pointer;
  font-weight: normal;
  font-size: 0.9rem;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background-color: #5568d3;
}

.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background-color: #efefef;
  border-color: #999;
}

@media (max-width: 600px) {
  .modal-content {
    width: 95%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .categories-select {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn-submit,
  .btn-cancel {
    width: 100%;
  }
}
</style>
