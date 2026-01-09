<template>
  <div
    v-if="isOpen"
    class="modal-overlay"
    @click.self="closeModal"
  >
    <div class="modal-content">
      <div class="modal-header">
        <div class="warning-icon">
          ⚠️
        </div>
        <h2>{{ title }}</h2>
      </div>

      <div class="modal-body">
        <p>{{ message }}</p>
        <div
          v-if="details"
          class="details"
        >
          <strong>Details:</strong>
          <p>{{ details }}</p>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn-cancel"
          @click="closeModal"
        >
          Cancel
        </button>
        <button
          class="btn-delete"
          :disabled="isDeleting"
          @click="confirmDelete"
        >
          {{ isDeleting ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { ref } from 'vue'
import { useUIStore } from '../stores/ui'

const props = defineProps<{
  modalId?: string
}>()

const uiStore = useUIStore()
const isDeleting = ref(false)

const isOpen = computed(() => {
  if (props.modalId) {
    const modal = uiStore.modals[props.modalId]
    return modal?.isOpen ?? false
  }
  return false
})

const title = computed(() => {
  if (props.modalId) {
    const modal = uiStore.modals[props.modalId]
    return modal?.title ?? 'Delete Item?'
  }
  return 'Delete Item?'
})

const message = computed(() => {
  if (props.modalId) {
    const modal = uiStore.modals[props.modalId]
    return modal?.data?.message ?? 'This action cannot be undone.'
  }
  return 'This action cannot be undone.'
})

const details = computed(() => {
  if (props.modalId) {
    const modal = uiStore.modals[props.modalId]
    return modal?.data?.details ?? null
  }
  return null
})

const closeModal = () => {
  if (props.modalId) {
    uiStore.closeModal(props.modalId)
  }
}

const confirmDelete = async () => {
  if (props.modalId) {
    const modal = uiStore.modals[props.modalId]
    if (modal?.data?.onConfirm) {
      isDeleting.value = true
      try {
        await modal.data.onConfirm()
      } catch (error) {
        console.error('Delete error:', error)
      } finally {
        isDeleting.value = false
      }
    }
  }
  closeModal()
}

// Register modal on mount
import { onMounted } from 'vue'
onMounted(() => {
  if (props.modalId) {
    uiStore.registerModal(props.modalId, 'confirm', false, 'Delete Item?', {})
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
  z-index: 1001;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1.5rem 1.5rem;
  background-color: #fff3e0;
  border-bottom: 1px solid #e0e0e0;
}

.warning-icon {
  font-size: 3rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #e65100;
  text-align: center;
}

.modal-body {
  padding: 1.5rem;
  color: #333;
}

.modal-body p {
  margin: 0 0 1rem 0;
  line-height: 1.5;
  color: #666;
}

.details {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  border-left: 3px solid #e65100;
}

.details strong {
  color: #333;
}

.details p {
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
  color: #666;
  word-break: break-word;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background-color: #f9f9f9;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel,
.btn-delete {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-cancel {
  background-color: #e0e0e0;
  color: #333;
}

.btn-cancel:hover {
  background-color: #d0d0d0;
}

.btn-delete {
  background-color: #f44336;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background-color: #da190b;
}

.btn-delete:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
