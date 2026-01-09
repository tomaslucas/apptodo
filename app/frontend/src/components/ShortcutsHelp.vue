<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="shortcuts-help-overlay"
      @click="closeModal"
    >
      <Transition
        name="scale"
        appear
      >
        <div
          class="shortcuts-help-modal"
          @click.stop
        >
          <div class="modal-header">
            <h2>Keyboard Shortcuts</h2>
            <button
              class="btn-close"
              title="Close (Esc)"
              @click="closeModal"
            >
              ×
            </button>
          </div>

          <div class="modal-content">
            <div class="shortcuts-list">
              <div
                v-for="(shortcut, index) in sortedShortcuts"
                :key="index"
                class="shortcut-item"
              >
                <div class="shortcut-keys">
                  <span
                    v-for="(key, keyIndex) in shortcut.keys"
                    :key="keyIndex"
                    :class="['key-badge', { 'special-key': isSpecialKey(key) }]"
                  >
                    {{ formatKeyName(key) }}
                  </span>
                </div>
                <div class="shortcut-description">
                  {{ shortcut.description }}
                </div>
              </div>
            </div>

            <div class="shortcuts-info">
              <p class="info-text">
                <strong>Tip:</strong> Press <span class="key-badge">Cmd</span> (Mac) or
                <span class="key-badge">Ctrl</span> (Windows/Linux) combined with other keys.
              </p>
              <p class="info-text">
                Use <span class="key-badge">J</span> and <span class="key-badge">K</span> to navigate through tasks.
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="btn-close-modal"
              @click="closeModal"
            >
              Close
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '../stores/ui'
import { useShortcuts, type Shortcut } from '../utils/shortcutsManager'

const uiStore = useUIStore()
const { getAll } = useShortcuts()

const isOpen = computed(() => {
  return uiStore.modals['shortcuts-help']?.isOpen || false
})

// Get all registered shortcuts and organize them
const sortedShortcuts = computed(() => {
  const allShortcuts = getAll()
  
  // Filter and sort to show unique shortcuts (hide ctrl variants if meta exists)
  const mainShortcuts = allShortcuts.filter((s) => {
    // Show only the main version, not the -ctrl variant
    if (s.id.endsWith('-ctrl')) {
      const metaVersion = allShortcuts.find((sh) => sh.id === s.id.replace('-ctrl', '-meta'))
      if (metaVersion) return false // Skip if meta version exists
    }
    return true
  })

  // Sort by keys length (single keys last), then by description
  return mainShortcuts.sort((a, b) => {
    if (a.keys.length !== b.keys.length) {
      return a.keys.length - b.keys.length
    }
    return a.description.localeCompare(b.description)
  })
})

const formatKeyName = (key: string): string => {
  const keyMap: Record<string, string> = {
    'Meta': process.platform === 'darwin' ? '⌘' : 'Win',
    'Control': 'Ctrl',
    'Shift': 'Shift',
    'Alt': 'Alt',
    'Enter': '↵',
    'Escape': 'Esc',
    'Backspace': '⌫',
    'Delete': 'Del',
    'Tab': '↹',
    'Space': '␣',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
  }

  return keyMap[key] || key
}

const isSpecialKey = (key: string): boolean => {
  const specialKeys = ['Meta', 'Control', 'Shift', 'Alt', 'Enter', 'Escape']
  return specialKeys.includes(key)
}

const closeModal = () => {
  uiStore.closeModal('shortcuts-help')
}
</script>

<style scoped>
.shortcuts-help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.shortcuts-help-modal {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 42rem;
  width: 91.666667%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 80vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.875rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
}

.btn-close:hover {
  color: #111827;
}

.modal-content {
  overflow-y: auto;
  flex: 1;
  padding: 1.5rem;
}

.shortcuts-list {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #f3f4f6;
  transition: all 0.3s;
}

.shortcut-item:hover {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.shortcut-keys {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  white-space: nowrap;
  flex-wrap: wrap;
}

.key-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #111827;
  font-family: 'Monaco', 'Courier New', monospace;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.key-badge.special-key {
  background-color: #f3f4f6;
  color: #4b5563;
  border-color: #9ca3af;
}

.shortcut-description {
  flex: 1;
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.5;
}

.shortcuts-info {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.info-text {
  margin: 0.5rem 0;
  color: #1e3a8a;
  font-size: 0.875rem;
  line-height: 1.5;
}

.info-text strong {
  font-weight: 600;
}

.info-text .key-badge {
  display: inline-flex;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  margin: 0 0.25rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.btn-close-modal {
  padding: 0.5rem 1.5rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.btn-close-modal:hover {
  background-color: #1d4ed8;
}

/* Scrollbar styling */
.modal-content::-webkit-scrollbar {
  width: 0.5rem;
}

.modal-content::-webkit-scrollbar-track {
  background-color: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 0.25rem;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

@media (max-width: 640px) {
  .shortcuts-help-modal {
    width: 91.666667%;
    max-height: 83.33vh;
  }

  .shortcut-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .shortcut-keys {
    min-width: auto;
    flex-wrap: wrap;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-content {
    padding: 1rem;
  }

  .modal-footer {
    padding: 1rem;
  }
}
</style>
