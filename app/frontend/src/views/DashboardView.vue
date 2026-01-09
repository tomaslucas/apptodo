<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p v-if="authStore.user">Welcome, {{ authStore.user.name }}</p>
    </div>
    <div class="dashboard-content">
      <TaskList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import TaskList from '../components/TaskList.vue'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  padding: 2rem;
  margin: -2rem -2rem 2rem -2rem;
}

.dashboard-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.dashboard-header p {
  margin: 0;
  opacity: 0.95;
  font-size: 1.1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.dashboard-content {
  width: 100%;
}
</style>
