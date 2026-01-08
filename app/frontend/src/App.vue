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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useUIStore } from './stores/ui'
import { useShortcuts } from './utils/shortcutsManager'
import ShortcutsHelp from './components/ShortcutsHelp.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()
const { register, unregister, start, stop } = useShortcuts()

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
  background-color: #333;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 2rem;
  margin: 0;
  padding: 0;
}

.nav-menu a {
  color: white;
  text-decoration: none;
  transition: color 0.3s;
}

.nav-menu a:hover {
  color: #4CAF50;
}

.shortcuts-btn {
  background-color: transparent;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.3s;
}

.shortcuts-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.logout-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #45a049;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
