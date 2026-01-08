<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p v-if="authStore.user">Welcome, {{ authStore.user.name }}</p>
    </div>
    <div class="dashboard-content">
      <div class="sidebar">
        <h3>Filters</h3>
        <div class="filter-group">
          <label for="status-filter">Status</label>
          <select
            id="status-filter"
            :value="taskStore.filters.status || ''"
            @change="(e) => taskStore.setFilter('status', e.target.value || null)"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="priority-filter">Priority</label>
          <select
            id="priority-filter"
            :value="taskStore.filters.priority || ''"
            @change="(e) => taskStore.setFilter('priority', e.target.value || null)"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="search">Search</label>
          <input
            id="search"
            :value="taskStore.filters.search || ''"
            type="text"
            placeholder="Search tasks..."
            @input="(e) => taskStore.setFilter('search', e.target.value || null)"
          />
        </div>

        <button @click="taskStore.clearFilters" class="btn-clear">Clear Filters</button>
      </div>

      <div class="main-area">
        <div class="action-bar">
          <button @click="showCreateForm = !showCreateForm" class="btn-create">
            {{ showCreateForm ? 'Cancel' : 'New Task' }}
          </button>
        </div>

        <div v-if="showCreateForm" class="create-task-form">
          <h3>Create New Task</h3>
          <!-- Form will be implemented in a separate component -->
        </div>

        <div v-if="taskStore.isLoading" class="loading">Loading tasks...</div>
        <div v-else-if="taskStore.filteredTasks.length === 0" class="no-tasks">No tasks found</div>
        <div v-else class="tasks-list">
          <div v-for="task in taskStore.filteredTasks" :key="task.id" class="task-card">
            <div class="task-header">
              <h3>{{ task.title }}</h3>
              <span :class="['priority-badge', `priority-${task.priority}`]">{{ task.priority }}</span>
            </div>
            <p v-if="task.description" class="task-description">{{ task.description }}</p>
            <div class="task-footer">
              <span :class="['status-badge', `status-${task.status}`]">{{ task.status }}</span>
              <span v-if="task.deadline" class="deadline">
                Deadline: {{ new Date(task.deadline).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useTaskStore } from '../stores/task'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const taskStore = useTaskStore()
const router = useRouter()
const showCreateForm = ref(false)

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  await taskStore.fetchTasks()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  margin: -2rem -2rem 2rem -2rem;
}

.dashboard-header h1 {
  margin: 0 0 0.5rem 0;
}

.dashboard-header p {
  margin: 0;
  opacity: 0.9;
}

.dashboard-content {
  display: flex;
  gap: 2rem;
}

.sidebar {
  width: 250px;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.sidebar h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.btn-clear {
  width: 100%;
  padding: 0.75rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1rem;
}

.btn-clear:hover {
  background-color: #da190b;
}

.main-area {
  flex: 1;
}

.action-bar {
  margin-bottom: 2rem;
}

.btn-create {
  padding: 0.75rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.btn-create:hover {
  background-color: #45a049;
}

.create-task-form {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.no-tasks {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.tasks-list {
  display: grid;
  gap: 1rem;
}

.task-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
}

.task-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.task-header h3 {
  margin: 0;
  color: #333;
}

.task-description {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.task-footer {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.priority-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.priority-low {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.priority-medium {
  background-color: #fff3e0;
  color: #e65100;
}

.priority-high {
  background-color: #ffebee;
  color: #c62828;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-pending {
  background-color: #e3f2fd;
  color: #1565c0;
}

.status-in_progress {
  background-color: #f3e5f5;
  color: #6a1b9a;
}

.status-completed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.deadline {
  font-size: 0.9rem;
  color: #999;
}

@media (max-width: 768px) {
  .dashboard-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }
}
</style>
