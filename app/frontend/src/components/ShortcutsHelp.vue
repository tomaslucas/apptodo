<template>
  <div v-if="isOpen" class="shortcuts-help-overlay" @click="closeModal">
    <div class="shortcuts-help-modal" @click.stop>
      <div class="modal-header">
        <h2>Keyboard Shortcuts</h2>
        <button class="btn-close" @click="closeModal" title="Close (Esc)">×</button>
      </div>

      <div class="modal-content">
        <div class="shortcuts-list">
          <div v-for="(shortcut, index) in sortedShortcuts" :key="index" class="shortcut-item">
            <div class="shortcut-keys">
              <span
                v-for="(key, keyIndex) in shortcut.keys"
                :key="keyIndex"
                :class="['key-badge', { 'special-key': isSpecialKey(key) }]"
              >
                {{ formatKeyName(key) }}
              </span>
            </div>
            <div class="shortcut-description">{{ shortcut.description }}</div>
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
        <button class="btn-close-modal" @click="closeModal">Close</button>
      </div>
    </div>
  </div>
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
  z-index: 1000;
}

.shortcuts-help-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #333;
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
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.shortcut-item:hover {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.shortcut-keys {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  min-width: 120px;
}

.key-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.75rem;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #333;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.key-badge.special-key {
  background-color: #f0f0f0;
  color: #666;
  border-color: #ccc;
}

.shortcut-description {
  flex: 1;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.shortcuts-info {
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.info-text {
  margin: 0.5rem 0;
  color: #1565c0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.info-text strong {
  font-weight: 600;
}

.info-text .key-badge {
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  margin: 0 0.25rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.btn-close-modal {
  padding: 0.75rem 1.5rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.95rem;
}

.btn-close-modal:hover {
  background-color: #5568d3;
}

/* Scrollbar styling */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #999;
}

@media (max-width: 600px) {
  .shortcuts-help-modal {
    max-height: 90vh;
    width: 95%;
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
