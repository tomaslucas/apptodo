<template>
  <Transition name="fade">
    <div v-if="isOpen" class="shortcuts-help-overlay" @click="closeModal">
      <Transition name="scale" appear>
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
   @apply fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.shortcuts-help-modal {
   @apply bg-white rounded-xl shadow-large max-w-2xl w-11/12 flex flex-col overflow-hidden;
   max-height: 80vh;
}

.modal-header {
  @apply flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0;
}

.modal-header h2 {
  @apply m-0 text-2xl text-gray-900 font-semibold;
}

.btn-close {
  @apply bg-none border-none text-3xl text-gray-400 cursor-pointer p-0;
  @apply w-10 h-10 flex items-center justify-center transition-colors hover:text-gray-900;
}

.modal-content {
  @apply overflow-y-auto flex-1 px-6 py-6;
}

.shortcuts-list {
  @apply grid gap-4 mb-8;
}

.shortcut-item {
  @apply flex items-center gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100;
  @apply transition-all hover:bg-gray-100 hover:border-gray-200 hover:shadow-soft;
}

.shortcut-keys {
  @apply flex gap-2 flex-shrink-0 min-w-max;
}

.key-badge {
  @apply inline-flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded;
  @apply text-xs font-semibold text-gray-900 font-mono shadow-soft;
}

.key-badge.special-key {
  @apply bg-gray-100 text-gray-700 border-gray-400;
}

.shortcut-description {
  @apply flex-1 text-gray-700 text-sm leading-relaxed;
}

.shortcuts-info {
  @apply bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4;
}

.info-text {
  @apply my-2 text-blue-900 text-sm leading-relaxed;
}

.info-text strong {
  @apply font-semibold;
}

.info-text .key-badge {
  @apply inline-flex px-2 py-1 text-xs mx-1;
}

.modal-footer {
  @apply px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0;
}

.btn-close-modal {
  @apply px-6 py-2 bg-blue-600 text-white border-none rounded font-semibold cursor-pointer;
  @apply transition-colors hover:bg-blue-700 text-base;
}

/* Scrollbar styling */
.modal-content::-webkit-scrollbar {
  @apply w-2;
}

.modal-content::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}

@media (max-width: 640px) {
   .shortcuts-help-modal {
     @apply w-11/12;
     max-height: 83.33vh;
   }

  .shortcut-item {
    @apply flex-col items-start gap-3;
  }

  .shortcut-keys {
    @apply min-w-auto flex-wrap;
  }

  .modal-header {
    @apply px-4 py-3;
  }

  .modal-content {
    @apply px-4 py-4;
  }

  .modal-footer {
    @apply px-4 py-3;
  }
}
</style>
