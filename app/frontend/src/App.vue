<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="logo">AppTodo</router-link>
        <ul class="nav-menu">
          <li v-if="!isAuthenticated">
            <router-link to="/login">Login</router-link>
          </li>
          <li v-if="!isAuthenticated">
            <router-link to="/register">Register</router-link>
          </li>
          <li v-if="isAuthenticated">
            <router-link to="/dashboard">Dashboard</router-link>
          </li>
          <li v-if="isAuthenticated">
            <button @click="toggleShortcutsHelp" class="shortcuts-btn" title="Show shortcuts (Cmd+?)">
              ⌨️
            </button>
          </li>
          <li v-if="isAuthenticated">
            <button @click="logout" class="logout-btn">Logout</button>
          </li>
        </ul>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
    <ShortcutsHelp />
    <div v-for="toast in toasts" :key="toast.id">
      <Toast
        :type="toast.type"
        :title="toast.title"
        :message="toast.message"
        :duration="toast.duration"
        :closeable="toast.closeable"
        @close="removeToast(toast.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useUIStore } from './stores/ui'
import { useShortcuts } from './utils/shortcutsManager'
import { useToast } from './composables/useToast'
import ShortcutsHelp from './components/ShortcutsHelp.vue'
import Toast from './components/Toast.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()
const { register, unregister, start, stop } = useShortcuts()
const { toasts, removeToast } = useToast()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const toggleShortcutsHelp = () => {
  if (uiStore.modals['shortcuts-help']?.isOpen) {
    uiStore.closeModal('shortcuts-help')
  } else {
    uiStore.openModal('shortcuts-help', 'Keyboard Shortcuts', {})
  }
}

onMounted(() => {
  // Register the shortcuts help modal
  uiStore.registerModal('shortcuts-help', 'custom', false, 'Keyboard Shortcuts', {})

  // Register shortcut to open shortcuts help: Cmd+? or Ctrl+?
  register({
    id: 'app-show-help',
    keys: ['Meta', '/'],
    description: 'Show keyboard shortcuts',
    handler: async () => toggleShortcutsHelp(),
    enabled: true,
  })

  // Fallback for Ctrl+? on non-Mac
  register({
    id: 'app-show-help-ctrl',
    keys: ['Control', '/'],
    description: 'Show keyboard shortcuts (Windows/Linux)',
    handler: async () => toggleShortcutsHelp(),
    enabled: true,
  })

  start()
})

onUnmounted(() => {
  unregister('app-show-help')
  unregister('app-show-help-ctrl')
  stop()
})
</script>

<style scoped>
.navbar {
  @apply bg-gray-800 shadow-md;
}

.nav-container {
  @apply max-w-6xl mx-auto px-4 sm:px-6 lg:px-8;
  @apply flex justify-between items-center py-4;
}

.logo {
  @apply text-white text-2xl font-bold no-underline;
}

.nav-menu {
  @apply flex list-none gap-4 sm:gap-8 m-0 p-0 items-center;
}

.nav-menu a {
  @apply text-white no-underline transition-colors duration-300 hover:text-green-400;
}

.shortcuts-btn {
  @apply bg-transparent text-white border-none px-3 sm:px-4 py-2 rounded cursor-pointer text-lg;
  @apply transition-colors duration-300 hover:bg-white hover:bg-opacity-10;
}

.logout-btn {
  @apply bg-green-600 text-white border-none px-3 sm:px-4 py-2 rounded cursor-pointer font-medium;
  @apply transition-colors duration-300 hover:bg-green-700;
}

.main-content {
  @apply max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style>
