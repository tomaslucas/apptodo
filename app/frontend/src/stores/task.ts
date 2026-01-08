import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/client'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  deadline?: string
  categories?: string[]
  created_at: string
  updated_at: string
}

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref({
    status: null as string | null,
    priority: null as string | null,
    category_id: null as string | null,
    search: null as string | null,
    completed: null as boolean | null,
  })

  const filteredTasks = computed(() => {
    return tasks.value.filter((task) => {
      if (filters.value.status && task.status !== filters.value.status) return false
      if (filters.value.priority && task.priority !== filters.value.priority) return false
      if (filters.value.category_id && task.category_id !== filters.value.category_id) return false
      if (filters.value.completed !== null && (task.status === 'completed') !== filters.value.completed)
        return false
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        if (!task.title.toLowerCase().includes(search) && !task.description?.toLowerCase().includes(search))
          return false
      }
      return true
    })
  })

  const fetchTasks = async () => {
    isLoading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters.value.status) params.append('status', filters.value.status)
      if (filters.value.priority) params.append('priority', filters.value.priority)
      if (filters.value.category_id) params.append('category_id', filters.value.category_id)
      if (filters.value.search) params.append('search', filters.value.search)
      if (filters.value.completed !== null) params.append('completed', String(filters.value.completed))

      const url = `/api/v1/tasks${params.toString() ? '?' + params.toString() : ''}`
      const response = await apiClient.get(url)
      tasks.value = response.data.data || response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tasks'
    } finally {
      isLoading.value = false
    }
  }

  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiClient.post('/api/v1/tasks', taskData)
      const newTask = response.data.data || response.data
      tasks.value.push(newTask)
      return newTask
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create task'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiClient.patch(`/api/v1/tasks/${taskId}`, updates)
      const updatedTask = response.data.data || response.data
      const index = tasks.value.findIndex((t) => t.id === taskId)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }
      return updatedTask
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update task'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const deleteTask = async (taskId: string) => {
    isLoading.value = true
    error.value = null
    try {
      await apiClient.delete(`/api/v1/tasks/${taskId}`)
      tasks.value = tasks.value.filter((t) => t.id !== taskId)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete task'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const setFilter = (filterKey: string, value: any) => {
    filters.value[filterKey as keyof typeof filters.value] = value
  }

  const clearFilters = () => {
    filters.value = {
      status: null,
      priority: null,
      category_id: null,
      search: null,
      completed: null,
    }
  }

  return {
    tasks,
    filteredTasks,
    isLoading,
    error,
    filters,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    setFilter,
    clearFilters,
  }
})
