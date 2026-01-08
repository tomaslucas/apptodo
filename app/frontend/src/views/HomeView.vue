<template>
  <div class="home">
    <h1>Welcome to AppTodo</h1>
    <p>Organize your tasks efficiently</p>
    <div class="actions">
      <router-link to="/login" class="btn btn-primary">Login</router-link>
      <router-link to="/register" class="btn btn-secondary">Register</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

if (authStore.isAuthenticated) {
  router.push('/dashboard')
}
</script>

<style scoped>
.home {
  text-align: center;
  padding: 4rem 2rem;
}

.home h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #333;
}

.home p {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #2196F3;
  color: white;
}

.btn-secondary:hover {
  background-color: #0b7dda;
}
</style>
