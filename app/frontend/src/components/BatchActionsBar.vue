<template>
  <Transition name="slide-down">
    <div v-if="selectedCount > 0" class="batch-actions-bar">
      <div class="batch-info">
        <span class="selected-count">{{ selectedCount }} selected</span>
      </div>

      <div class="batch-actions">
        <button
          @click="completeSelected"
          class="btn-batch btn-batch-complete"
          :disabled="isLoading"
          title="Mark selected tasks as completed"
        >
          ✓ Complete
        </button>

        <button
          @click="updatePriority"
          class="btn-batch btn-batch-priority"
          :disabled="isLoading"
          title="Update priority for selected tasks"
        >
          ⚡ Priority
        </button>

        <button
          @click="updateStatus"
          class="btn-batch btn-batch-status"
          :disabled="isLoading"
          title="Update status for selected tasks"
        >
          📋 Status
        </button>

        <button
          @click="deleteSelected"
          class="btn-batch btn-batch-delete"
          :disabled="isLoading"
          title="Delete selected tasks"
        >
          🗑️ Delete
        </button>

        <button
          @click="clearSelection"
          class="btn-batch btn-batch-clear"
          :disabled="isLoading"
          title="Clear selection"
        >
          ✕ Clear
        </button>
      </div>
    </div>
  </Transition>

  <!-- Priority Modal -->
  <div v-if="showPriorityModal" class="modal-overlay" @click.self="showPriorityModal = false">
    <div class="modal-content">
      <h3>Update Priority</h3>
      <div class="priority-options">
        <button
          v-for="priority in ['low', 'medium', 'high']"
          :key="priority"
          @click="setPriority(priority)"
          :class="['priority-btn', `priority-${priority}`]"
        >
          {{ formatLabel(priority) }}
        </button>
      </div>
    </div>
  </div>

  <!-- Status Modal -->
  <div v-if="showStatusModal" class="modal-overlay" @click.self="showStatusModal = false">
    <div class="modal-content">
      <h3>Update Status</h3>
      <div class="status-options">
        <button
          v-for="status in ['pending', 'in_progress', 'completed']"
          :key="status"
          @click="setStatus(status)"
          :class="['status-btn', `status-${status}`]"
        >
          {{ formatLabel(status) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskStore } from '../stores/task'
import { useUIStore } from '../stores/ui'

const taskStore = useTaskStore()
const uiStore = useUIStore()

const showPriorityModal = ref(false)
const showStatusModal = ref(false)

const selectedCount = computed(() => taskStore.getSelectedCount)
const isLoading = computed(() => taskStore.isLoading)

const formatLabel = (text: string): string => {
  return text
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const completeSelected = async () => {
  const success = await taskStore.batchComplete()
  if (success) {
    uiStore.addToast(`Completed ${selectedCount.value} tasks`, 'success')
  } else {
    uiStore.addToast('Failed to complete tasks', 'error')
  }
}

const deleteSelected = async () => {
  if (confirm(`Delete ${selectedCount.value} tasks? This cannot be undone.`)) {
    const success = await taskStore.batchDelete()
    if (success) {
      uiStore.addToast(`Deleted ${selectedCount.value} tasks`, 'success')
    } else {
      uiStore.addToast('Failed to delete tasks', 'error')
    }
  }
}

const updatePriority = () => {
  showPriorityModal.value = true
}

const setPriority = async (priority: string) => {
  showPriorityModal.value = false
  const success = await taskStore.batchUpdate({ priority })
  if (success) {
    uiStore.addToast(`Updated priority for ${selectedCount.value} tasks`, 'success')
  } else {
    uiStore.addToast('Failed to update priority', 'error')
  }
}

const updateStatus = () => {
  showStatusModal.value = true
}

const setStatus = async (status: string) => {
  showStatusModal.value = false
  const success = await taskStore.batchUpdate({ status })
  if (success) {
    uiStore.addToast(`Updated status for ${selectedCount.value} tasks`, 'success')
  } else {
    uiStore.addToast('Failed to update status', 'error')
  }
}

const clearSelection = () => {
  taskStore.deselectAll()
}
</script>

<style scoped>
.batch-actions-bar {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  z-index: 100;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selected-count {
  font-weight: 600;
  font-size: 1rem;
}

.batch-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-batch {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  white-space: nowrap;
}

.btn-batch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-batch-complete {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-batch-complete:hover:not(:disabled) {
  background-color: #4caf50;
  transform: translateY(-2px);
}

.btn-batch-priority {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-batch-priority:hover:not(:disabled) {
  background-color: #ff9800;
  transform: translateY(-2px);
}

.btn-batch-status {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-batch-status:hover:not(:disabled) {
  background-color: #2196f3;
  transform: translateY(-2px);
}

.btn-batch-delete {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-batch-delete:hover:not(:disabled) {
  background-color: #f44336;
  transform: translateY(-2px);
}

.btn-batch-clear {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-batch-clear:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  min-width: 300px;
}

.modal-content h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.priority-options,
.status-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.priority-btn,
.status-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e0e0e0;
  background: white;
  color: #333;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.priority-btn:hover,
.status-btn:hover {
  border-color: #667eea;
  background-color: #f0f4ff;
}

.priority-low {
  color: #2e7d32;
  border-color: #a5d6a7;
}

.priority-medium {
  color: #e65100;
  border-color: #ffcc80;
}

.priority-high {
  color: #c62828;
  border-color: #ef9a9a;
}

.status-pending {
  color: #1565c0;
  border-color: #90caf9;
}

.status-in_progress {
  color: #6a1b9a;
  border-color: #ce93d8;
}

.status-completed {
  color: #2e7d32;
  border-color: #a5d6a7;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

@media (max-width: 768px) {
  .batch-actions-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .batch-actions {
    justify-content: stretch;
  }

  .btn-batch {
    flex: 1;
  }
}
</style>
