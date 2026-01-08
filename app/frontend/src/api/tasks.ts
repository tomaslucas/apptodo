import apiClient from './client'
import { Task } from '../stores/task'

export interface TaskFilters {
  status?: string
  priority?: string
  category_id?: string
  categories?: string
  deadline_from?: string
  deadline_to?: string
  search?: string
  completed?: boolean
  limit?: number
  offset?: number
}

export const taskAPI = {
  // Get all tasks with filters
  getTasks: async (filters?: TaskFilters) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }
    const response = await apiClient.get(`/api/v1/tasks${params.toString() ? '?' + params.toString() : ''}`)
    return response.data
  },

  // Get single task
  getTask: async (taskId: string) => {
    const response = await apiClient.get(`/api/v1/tasks/${taskId}`)
    return response.data
  },

  // Create task
  createTask: async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await apiClient.post('/api/v1/tasks', taskData)
    return response.data
  },

  // Update task
  updateTask: async (taskId: string, updates: Partial<Task>) => {
    const response = await apiClient.patch(`/api/v1/tasks/${taskId}`, updates)
    return response.data
  },

  // Delete task (soft delete)
  deleteTask: async (taskId: string) => {
    await apiClient.delete(`/api/v1/tasks/${taskId}`)
  },

  // Restore task
  restoreTask: async (taskId: string) => {
    const response = await apiClient.post(`/api/v1/tasks/${taskId}/restore`)
    return response.data
  },

  // Get task events
  getTaskEvents: async (taskId: string, limit = 50, offset = 0) => {
    const response = await apiClient.get(`/api/v1/tasks/${taskId}/events`, {
      params: { limit, offset },
    })
    return response.data
  },

  // Batch operations
  batchComplete: async (taskIds: string[]) => {
    const response = await apiClient.post('/api/v1/tasks/batch/complete', { task_ids: taskIds })
    return response.data
  },

  batchDelete: async (taskIds: string[]) => {
    const response = await apiClient.post('/api/v1/tasks/batch/delete', { task_ids: taskIds })
    return response.data
  },

  batchRestore: async (taskIds: string[]) => {
    const response = await apiClient.post('/api/v1/tasks/batch/restore', { task_ids: taskIds })
    return response.data
  },

  batchUpdate: async (taskIds: string[], updates: { status?: string; priority?: string }) => {
    const response = await apiClient.patch('/api/v1/tasks/batch/update', {
      task_ids: taskIds,
      ...updates,
    })
    return response.data
  },
}
