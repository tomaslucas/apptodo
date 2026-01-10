<template>
  <div
    v-if="isOpen"
    class="modal-overlay"
    @click.self="closeModal"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2>Add Category to Task</h2>
        <button
          class="btn-close"
          @click="closeModal"
        >
          ✕
        </button>
      </div>

      <div class="category-form">
        <div class="form-group">
          <label>Create New Category</label>
          <div class="category-input-wrapper">
            <input
              v-model="newCategoryName"
              type="text"
              placeholder="Type category name"
              class="category-input"
              @keydown.enter.prevent="createNewCategory"
            >
            <button
              type="button"
              class="btn-add-category"
              :disabled="!newCategoryName.trim()"
              @click="createNewCategory"
            >
              +
            </button>
          </div>
        </div>

        <div class="divider">
          OR Select Existing
        </div>

        <div class="existing-categories">
          <div
            v-if="categoryStore.isLoading"
            class="loading"
          >
            Loading...
          </div>
          <div
            v-else-if="availableCategories.length === 0"
            class="empty"
          >
            No other categories available.
          </div>
          <div
            v-else
            class="category-list"
          >
            <button
              v-for="category in availableCategories"
              :key="category.id"
              class="category-chip"
              @click="selectCategory(category.id)"
            >
              {{ category.name }}
            </button>
          </div>
        </div>

        <div
          v-if="error"
          class="error-message"
        >
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCategoryStore } from '../stores/category'
import { useTaskStore } from '../stores/task'
import { useUIStore } from '../stores/ui'

const props = defineProps<{
  modalId?: string
}>()

const categoryStore = useCategoryStore()
const taskStore = useTaskStore()
const uiStore = useUIStore()

const newCategoryName = ref('')
const error = ref<string | null>(null)
const taskId = ref<string | null>(null)

const isOpen = computed(() => {
  if (props.modalId) {
    const modal = uiStore.modals[props.modalId]
    return modal?.isOpen ?? false
  }
  return false
})

const currentTask = computed(() => {
  if (!taskId.value) return null
  return taskStore.tasks.find(t => t.id === taskId.value)
})

const availableCategories = computed(() => {
  if (!currentTask.value) return categoryStore.categories
  const currentCategoryIds = currentTask.value.categories || []
  return categoryStore.categories.filter(c => !currentCategoryIds.includes(c.id))
})

watch(
  () => uiStore.modals[props.modalId || '']?.data,
  (data) => {
    if (data && data.taskId) {
      taskId.value = data.taskId
      error.value = null
      newCategoryName.value = ''
    }
  },
  { deep: true, immediate: true }
)

const closeModal = () => {
  if (props.modalId) {
    uiStore.closeModal(props.modalId)
  }
}

const createNewCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name) return

  // Check if already exists in store
  const existing = categoryStore.categories.find(c => c.name.toLowerCase() === name.toLowerCase())
  if (existing) {
    await selectCategory(existing.id)
    return
  }

  try {
    const category = await categoryStore.createCategory({ name })
    if (category) {
      await selectCategory(category.id)
      newCategoryName.value = ''
    }
  } catch (e) {
    error.value = 'Failed to create category'
  }
}

const selectCategory = async (categoryId: string) => {
  if (!taskId.value) return

  // Fetch current task to get existing categories
  const task = taskStore.tasks.find(t => t.id === taskId.value)
  if (!task) return

  // We need to send ALL categories to the update endpoint because of how the backend syncs
  // Alternatively, we can use the dedicated add category endpoint
  // Backend has: POST /api/v1/tasks/{task_id}/categories
  
  // Let's use the specific endpoint if possible, but the store might not expose it directly.
  // The store has updateTask.
  // The backend update_task replaces all categories if category_ids is provided.
  
  const currentIds = task.categories ? [...task.categories] : []
  // Avoid duplicates
  if (!currentIds.includes(categoryId) && !currentIds.find(id => String(id) === String(categoryId))) {
    currentIds.push(categoryId)
  }

  // Use updateTask to sync
  const updatedTask = await taskStore.updateTask(taskId.value, {
    category_ids: currentIds.map(id => parseInt(String(id), 10))
  })

  if (updatedTask) {
    uiStore.addToast('Category added', 'success')
    closeModal()
  } else {
    error.value = 'Failed to add category to task'
  }
}
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
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a1a1a;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
}

.category-form {
  padding: 1.5rem;
}

.category-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.category-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-add-category {
  padding: 0 1rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.25rem;
  cursor: pointer;
}

.btn-add-category:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  color: #999;
  font-size: 0.9rem;
  position: relative;
}

.divider::before,
.divider::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background-color: #e0e0e0;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-chip {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.category-chip:hover {
  background-color: #e3f2fd;
  border-color: #90caf9;
  color: #1565c0;
}

.error-message {
  margin-top: 1rem;
  color: #e53e3e;
  font-size: 0.9rem;
  text-align: center;
}

.loading, .empty {
  text-align: center;
  color: #999;
  font-style: italic;
}
</style>
