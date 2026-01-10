import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/client'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'pendiente' | 'en_progreso' | 'completada'
  priority: 'baja' | 'media' | 'alta'
  deadline?: string
  categories?: string[]
  created_at: string
  updated_at: string
}

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const selectedTaskIds = ref<Set<string>>(new Set())
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
      if (filters.value.category_id && !task.categories?.includes(filters.value.category_id)) return false
      if (filters.value.completed !== null && (task.status === 'completada') !== filters.value.completed)
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
      const responseData = response.data.data || response.data
      tasks.value = responseData.tasks || responseData
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
      const responseData = response.data.data || response.data
      const newTask = responseData.task || responseData
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
      const responseData = response.data.data || response.data
      const updatedTask = responseData.task || responseData
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
    // @ts-ignore
    filters.value[filterKey as keyof typeof filters.value] = value as any
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

  const toggleTaskSelection = (taskId: string) => {
    if (selectedTaskIds.value.has(taskId)) {
      selectedTaskIds.value.delete(taskId)
    } else {
      selectedTaskIds.value.add(taskId)
    }
  }

  const selectAll = () => {
    filteredTasks.value.forEach((task) => selectedTaskIds.value.add(task.id))
  }

  const deselectAll = () => {
    selectedTaskIds.value.clear()
  }

  const isTaskSelected = (taskId: string) => {
    return selectedTaskIds.value.has(taskId)
  }

  const getSelectedCount = computed(() => selectedTaskIds.value.size)

  const batchComplete = async () => {
    if (selectedTaskIds.value.size === 0) return false
    isLoading.value = true
    error.value = null
    try {
      const taskIdStrings = Array.from(selectedTaskIds.value)
      const taskIds = taskIdStrings.map((id) => parseInt(id, 10))
      const response = await apiClient.post('/api/v1/tasks/batch/complete', { task_ids: taskIds })
      
      // Update tasks in store
      taskIdStrings.forEach((taskId) => {
        const index = tasks.value.findIndex((t) => t.id === taskId)
        if (index !== -1) {
          tasks.value[index].status = 'completada'
        }
      })
      
      selectedTaskIds.value.clear()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to complete tasks'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const batchDelete = async () => {
    if (selectedTaskIds.value.size === 0) return false
    isLoading.value = true
    error.value = null
    try {
      const taskIdStrings = Array.from(selectedTaskIds.value)
      const taskIds = taskIdStrings.map((id) => parseInt(id, 10))
      await apiClient.post('/api/v1/tasks/batch/delete', { task_ids: taskIds })
      
      // Remove tasks from store
      tasks.value = tasks.value.filter((t) => !taskIdStrings.includes(t.id))
      selectedTaskIds.value.clear()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete tasks'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const batchRestore = async () => {
    if (selectedTaskIds.value.size === 0) return false
    isLoading.value = true
    error.value = null
    try {
      const taskIds = Array.from(selectedTaskIds.value).map((id) => parseInt(id, 10))
      const response = await apiClient.post('/api/v1/tasks/batch/restore', { task_ids: taskIds })
      
      // Refetch tasks to get the restored ones
      await fetchTasks()
      selectedTaskIds.value.clear()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restore tasks'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const batchUpdate = async (updates: { status?: string; priority?: string }) => {
    if (selectedTaskIds.value.size === 0) return false
    isLoading.value = true
    error.value = null
    try {
      const taskIdStrings = Array.from(selectedTaskIds.value)
      const taskIds = taskIdStrings.map((id) => parseInt(id, 10))
      await apiClient.patch('/api/v1/tasks/batch/update', { task_ids: taskIds, ...updates })
      
      // Update tasks in store
      taskIdStrings.forEach((taskId) => {
        const index = tasks.value.findIndex((t) => t.id === taskId)
        if (index !== -1) {
          if (updates.status) tasks.value[index].status = updates.status as any
          if (updates.priority) tasks.value[index].priority = updates.priority as any
        }
      })
      
      selectedTaskIds.value.clear()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update tasks'
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    tasks,
    filteredTasks,
    isLoading,
    error,
    filters,
    selectedTaskIds,
    getSelectedCount,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    setFilter,
    clearFilters,
    toggleTaskSelection,
    selectAll,
    deselectAll,
    isTaskSelected,
    batchComplete,
    batchDelete,
    batchRestore,
    batchUpdate,
  }
})
