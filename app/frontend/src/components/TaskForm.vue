<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEditMode ? 'Edit Task' : 'Create New Task' }}</h2>
        <button @click="closeModal" class="btn-close">✕</button>
      </div>

      <form @submit.prevent="submitForm" class="task-form">
        <!-- Title Field -->
        <div class="form-group" :class="{ 'has-error': getTitleError && fieldStates.value.title.isTouched }">
          <label for="title">
            Task Title
            <span class="required">*</span>
          </label>
          <input
            v-model="formData.title"
            type="text"
            id="title"
            placeholder="Enter task title"
            @blur="handleFieldBlur('title')"
            @change="handleFieldChange('title', formData.title)"
            :class="{ 'input-error': getTitleError && fieldStates.value.title.isTouched }"
          />
          <div v-if="getTitleError && fieldStates.value.title.isTouched" class="field-error">
            {{ getTitleError }}
          </div>
          <div v-if="!getTitleError && formData.title.length > 0" class="field-hint">
            {{ formData.title.length }} / 255 characters
          </div>
        </div>

        <!-- Description Field -->
        <div class="form-group" :class="{ 'has-error': getDescriptionError && fieldStates.value.description.isTouched }">
          <label for="description">Description</label>
          <textarea
            v-model="formData.description"
            id="description"
            placeholder="Enter task description (optional)"
            rows="4"
            @blur="handleFieldBlur('description')"
            @change="handleFieldChange('description', formData.description)"
            :class="{ 'input-error': getDescriptionError && fieldStates.value.description.isTouched }"
          ></textarea>
          <div v-if="getDescriptionError && fieldStates.value.description.isTouched" class="field-error">
            {{ getDescriptionError }}
          </div>
          <div v-if="!getDescriptionError && formData.description.length > 0" class="field-hint">
            {{ formData.description.length }} / 2000 characters
          </div>
        </div>

        <!-- Priority & Deadline Row -->
        <div class="form-row">
          <!-- Priority Field -->
          <div class="form-group" :class="{ 'has-error': getPriorityError }">
            <label for="priority">
              Priority
              <span class="required">*</span>
            </label>
            <select
              v-model="formData.priority"
              id="priority"
              @blur="handleFieldBlur('priority')"
              @change="handleFieldChange('priority', formData.priority)"
              :class="{ 'input-error': getPriorityError }"
            >
              <option value="">-- Select Priority --</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div v-if="getPriorityError && fieldStates.value.priority.isTouched" class="field-error">
              {{ getPriorityError }}
            </div>
          </div>

          <!-- Deadline Field -->
          <div class="form-group" :class="{ 'has-error': getDeadlineError && fieldStates.value.deadline.isTouched }">
            <label for="deadline">Deadline</label>
            <input
              v-model="formData.deadline"
              type="date"
              id="deadline"
              @blur="handleFieldBlur('deadline')"
              @change="handleFieldChange('deadline', formData.deadline)"
              :class="{ 'input-error': getDeadlineError && fieldStates.value.deadline.isTouched }"
            />
            <div v-if="getDeadlineError && fieldStates.value.deadline.isTouched" class="field-error">
              {{ getDeadlineError }}
            </div>
          </div>
        </div>

        <!-- Categories Field -->
        <div class="form-group" :class="{ 'has-error': getCategoriesError }">
          <label>
            Categories
            <span class="hint">(optional, max 10)</span>
          </label>
          <div class="categories-select">
            <div
              v-for="category in categoryStore.categories"
              :key="category.id"
              class="category-checkbox"
            >
              <input
                type="checkbox"
                :id="`category-${category.id}`"
                :value="category.id"
                v-model="formData.categories"
                @change="handleFieldChange('categories', formData.categories)"
              />
              <label :for="`category-${category.id}`">{{ category.name }}</label>
            </div>
          </div>
          <div v-if="getCategoriesError && fieldStates.value.categories.isTouched" class="field-error">
            {{ getCategoriesError }}
          </div>
          <div v-if="formData.categories.length > 0" class="field-hint">
            {{ formData.categories.length }} category(ies) selected
          </div>
        </div>

        <!-- Status Field -->
        <div class="form-group" :class="{ 'has-error': getStatusError }">
          <label for="status">
            Status
            <span class="required">*</span>
          </label>
          <select
            v-model="formData.status"
            id="status"
            @blur="handleFieldBlur('status')"
            @change="handleFieldChange('status', formData.status)"
            :class="{ 'input-error': getStatusError }"
          >
            <option value="">-- Select Status --</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <div v-if="getStatusError && fieldStates.value.status.isTouched" class="field-error">
            {{ getStatusError }}
          </div>
        </div>

        <!-- API Error -->
        <div v-if="apiError" class="error-message alert-error">
          <strong>Error:</strong> {{ apiError }}
        </div>

        <!-- Validation Summary -->
        <div v-if="hasValidationErrors && anyFieldTouched" class="validation-summary">
          <strong>Please fix the following issues:</strong>
          <ul>
            <li v-for="(error, idx) in validationErrorsList" :key="idx">{{ error }}</li>
          </ul>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="submit"
            class="btn-submit"
            :disabled="isLoading || (hasValidationErrors && anyFieldTouched)"
            :title="hasValidationErrors && anyFieldTouched ? 'Please fix validation errors' : ''"
          >
            {{ isLoading ? 'Saving...' : 'Save Task' }}
          </button>
          <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTaskStore, type Task } from '../stores/task'
import { useCategoryStore } from '../stores/category'
import { useUIStore } from '../stores/ui'
import { useFormValidation } from '../composables/useFormValidation'
import { taskValidationRules } from '../utils/formValidation'

const props = defineProps<{
  modalId?: string
}>()

const taskStore = useTaskStore()
const categoryStore = useCategoryStore()
const uiStore = useUIStore()

const isEditMode = ref(false)
const currentTaskId = ref<string | null>(null)
const isLoading = ref(false)
const apiError = ref<string | null>(null)

const initialFormData = {
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  deadline: '',
  categories: [] as string[],
  status: 'pending' as 'pending' | 'in_progress' | 'completed',
}

// Initialize form validation composable
const {
  formData,
  fieldStates,
  errorMap,
  isValid,
  isDirty,
  errors: validationErrorsList,
  validateAllFields,
  handleFieldChange,
  handleFieldBlur,
  resetForm: resetValidation,
  setFormData,
} = useFormValidation({
  initialValues: initialFormData,
  validationRules: taskValidationRules,
  debounceDelay: 300,
  validateOnChange: true,
  validateOnBlur: true,
})

const isOpen = computed(() => {
  if (props.modalId) {
    const modal = uiStore.modals[props.modalId]
    return modal?.isOpen ?? false
  }
  return false
})

// Computed error getters for each field
const getTitleError = computed(() => errorMap.value.title || null)
const getDescriptionError = computed(() => errorMap.value.description || null)
const getPriorityError = computed(() => errorMap.value.priority || null)
const getDeadlineError = computed(() => errorMap.value.deadline || null)
const getCategoriesError = computed(() => errorMap.value.categories || null)
const getStatusError = computed(() => errorMap.value.status || null)

// Check if any field has been touched
const anyFieldTouched = computed(() => Object.values(fieldStates.value).some((state) => state.isTouched))

// Check if form has validation errors
const hasValidationErrors = computed(() => Object.keys(errorMap.value).length > 0)

const closeModal = () => {
  if (props.modalId) {
    uiStore.closeModal(props.modalId)
  }
  resetForm()
}

const resetForm = () => {
  setFormData(initialFormData)
  resetValidation()
  isEditMode.value = false
  currentTaskId.value = null
  apiError.value = null
}

const submitForm = async () => {
  // Touch all fields for validation display
  Object.values(fieldStates.value).forEach((state) => {
    state.isTouched = true
  })

  // Validate all fields
  const isFormValid = await validateAllFields()

  if (!isFormValid) {
    apiError.value = 'Please fix all validation errors before submitting'
    return
  }

  isLoading.value = true
  apiError.value = null

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
    apiError.value = err instanceof Error ? err.message : 'An error occurred while saving the task'
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
      setFormData({
        title: data.task.title,
        description: data.task.description || '',
        priority: data.task.priority,
        deadline: data.task.deadline || '',
        categories: data.task.categories || [],
        status: data.task.status,
      })
    } else if (data && data.taskId) {
      // If only taskId is provided, fetch the task
      const task = taskStore.tasks.find((t) => t.id === data.taskId)
      if (task) {
        isEditMode.value = true
        currentTaskId.value = task.id
        setFormData({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          deadline: task.deadline || '',
          categories: task.categories || [],
          status: task.status,
        })
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

onUnmounted(() => {
  // Cleanup is handled by composable
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
  transition: background-color 0.2s ease;
}

.form-group.has-error {
  background-color: #fff5f5;
  padding: 0.75rem;
  border-radius: 4px;
  margin-left: -0.75rem;
  margin-right: -0.75rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.95rem;
}

.required {
  color: #e53e3e;
  margin-left: 0.25rem;
}

.hint {
  color: #999;
  font-size: 0.85rem;
  font-weight: normal;
  margin-left: 0.5rem;
}

.form-group input[type='text'],
.form-group input[type='date'],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input[type='text']:focus,
.form-group input[type='date']:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input.input-error,
.form-group textarea.input-error,
.form-group select.input-error {
  border-color: #e53e3e;
  background-color: #fef5f5;
}

.form-group input.input-error:focus,
.form-group textarea.input-error:focus,
.form-group select.input-error:focus {
  border-color: #e53e3e;
  box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
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
  accent-color: #667eea;
}

.category-checkbox label {
  margin: 0;
  cursor: pointer;
  font-weight: normal;
  font-size: 0.9rem;
}

/* Field validation feedback */
.field-error {
  color: #e53e3e;
  font-size: 0.85rem;
  margin-top: 0.35rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  animation: slideDown 0.2s ease-out;
}

.field-error::before {
  content: '⚠';
  font-weight: bold;
}

.field-hint {
  color: #999;
  font-size: 0.85rem;
  margin-top: 0.35rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* API Error */
.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  border-left: 4px solid #c62828;
}

.error-message.alert-error {
  background-color: #fff5f5;
  color: #e53e3e;
  border-color: #e53e3e;
}

/* Validation Summary */
.validation-summary {
  background-color: #fef5f5;
  color: #e53e3e;
  border: 1px solid #fc8181;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.validation-summary strong {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.validation-summary ul {
  margin: 0;
  padding-left: 1.5rem;
  list-style-type: disc;
}

.validation-summary li {
  margin-bottom: 0.35rem;
  line-height: 1.4;
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
  opacity: 0.6;
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

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
