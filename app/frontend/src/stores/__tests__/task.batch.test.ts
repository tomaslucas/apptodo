import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../task'
import apiClient from '../../api/client'

vi.mock('../../api/client')

describe('Task Store - Batch Operations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Task Selection', () => {
    it('should toggle task selection', () => {
      const store = useTaskStore()
      const taskId = 'task-1'

      store.toggleTaskSelection(taskId)
      expect(store.isTaskSelected(taskId)).toBe(true)
      expect(store.getSelectedCount).toBe(1)

      store.toggleTaskSelection(taskId)
      expect(store.isTaskSelected(taskId)).toBe(false)
      expect(store.getSelectedCount).toBe(0)
    })

    it('should handle multiple selections', () => {
      const store = useTaskStore()

      store.toggleTaskSelection('task-1')
      store.toggleTaskSelection('task-2')
      store.toggleTaskSelection('task-3')

      expect(store.getSelectedCount).toBe(3)
      expect(store.isTaskSelected('task-1')).toBe(true)
      expect(store.isTaskSelected('task-2')).toBe(true)
      expect(store.isTaskSelected('task-3')).toBe(true)
    })

    it('should select all filtered tasks', () => {
      const store = useTaskStore()
      store.tasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'pending',
          priority: 'low',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'task-2',
          title: 'Task 2',
          status: 'pending',
          priority: 'medium',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]

      store.selectAll()
      expect(store.getSelectedCount).toBe(2)
      expect(store.isTaskSelected('task-1')).toBe(true)
      expect(store.isTaskSelected('task-2')).toBe(true)
    })

    it('should deselect all tasks', () => {
      const store = useTaskStore()
      store.toggleTaskSelection('task-1')
      store.toggleTaskSelection('task-2')

      expect(store.getSelectedCount).toBe(2)

      store.deselectAll()
      expect(store.getSelectedCount).toBe(0)
      expect(store.isTaskSelected('task-1')).toBe(false)
      expect(store.isTaskSelected('task-2')).toBe(false)
    })
  })

  describe('Batch Complete', () => {
    it('should complete selected tasks', async () => {
      const store = useTaskStore()
      store.tasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'pending',
          priority: 'low',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'task-2',
          title: 'Task 2',
          status: 'pending',
          priority: 'medium',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]

      store.toggleTaskSelection('task-1')
      store.toggleTaskSelection('task-2')

      vi.mocked(apiClient.post).mockResolvedValue({ data: { updated_count: 2 } })

      const result = await store.batchComplete()

      expect(result).toBe(true)
      expect(store.tasks[0].status).toBe('completed')
      expect(store.tasks[1].status).toBe('completed')
      expect(store.getSelectedCount).toBe(0)
    })

    it('should handle batch complete errors', async () => {
      const store = useTaskStore()
      store.toggleTaskSelection('task-1')

      vi.mocked(apiClient.post).mockRejectedValue(new Error('API error'))

      const result = await store.batchComplete()

      expect(result).toBe(false)
      expect(store.error).toContain('Failed to complete tasks')
    })

    it('should not complete when no tasks selected', async () => {
      const store = useTaskStore()
      const result = await store.batchComplete()

      expect(result).toBe(false)
    })
  })

  describe('Batch Delete', () => {
    it('should delete selected tasks', async () => {
      const store = useTaskStore()
      store.tasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'pending',
          priority: 'low',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'task-2',
          title: 'Task 2',
          status: 'pending',
          priority: 'medium',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]

      store.toggleTaskSelection('task-1')

      vi.mocked(apiClient.post).mockResolvedValue({ data: { deleted_count: 1 } })

      const result = await store.batchDelete()

      expect(result).toBe(true)
      expect(store.tasks).toHaveLength(1)
      expect(store.tasks[0].id).toBe('task-2')
      expect(store.getSelectedCount).toBe(0)
    })

    it('should handle batch delete errors', async () => {
      const store = useTaskStore()
      store.toggleTaskSelection('task-1')

      vi.mocked(apiClient.post).mockRejectedValue(new Error('API error'))

      const result = await store.batchDelete()

      expect(result).toBe(false)
      expect(store.error).toContain('Failed to delete tasks')
    })
  })

  describe('Batch Update', () => {
    it('should update status of selected tasks', async () => {
      const store = useTaskStore()
      store.tasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'pending',
          priority: 'low',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]

      store.toggleTaskSelection('task-1')

      vi.mocked(apiClient.patch).mockResolvedValue({ data: { updated_count: 1 } })

      const result = await store.batchUpdate({ status: 'in_progress' })

      expect(result).toBe(true)
      expect(store.tasks[0].status).toBe('in_progress')
      expect(store.getSelectedCount).toBe(0)
    })

    it('should update priority of selected tasks', async () => {
      const store = useTaskStore()
      store.tasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'pending',
          priority: 'low',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]

      store.toggleTaskSelection('task-1')

      vi.mocked(apiClient.patch).mockResolvedValue({ data: { updated_count: 1 } })

      const result = await store.batchUpdate({ priority: 'high' })

      expect(result).toBe(true)
      expect(store.tasks[0].priority).toBe('high')
    })

    it('should handle batch update errors', async () => {
      const store = useTaskStore()
      store.toggleTaskSelection('task-1')

      vi.mocked(apiClient.patch).mockRejectedValue(new Error('API error'))

      const result = await store.batchUpdate({ status: 'completed' })

      expect(result).toBe(false)
      expect(store.error).toContain('Failed to update tasks')
    })
  })

  describe('Batch Restore', () => {
    it('should restore selected tasks', async () => {
      const store = useTaskStore()
      store.toggleTaskSelection('task-1')

      vi.mocked(apiClient.post).mockResolvedValue({ data: { restored_count: 1 } })
      vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [] } })

      const result = await store.batchRestore()

      expect(result).toBe(true)
      expect(store.getSelectedCount).toBe(0)
    })

    it('should handle batch restore errors', async () => {
      const store = useTaskStore()
      store.toggleTaskSelection('task-1')

      vi.mocked(apiClient.post).mockRejectedValue(new Error('API error'))

      const result = await store.batchRestore()

      expect(result).toBe(false)
      expect(store.error).toContain('Failed to restore tasks')
    })
  })
})
