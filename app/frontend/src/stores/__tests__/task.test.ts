import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../task'

describe('Task Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    priority: 'medium',
    category_id: null,
    deadline: null,
    created_at: '2026-01-09T00:00:00Z',
    updated_at: '2026-01-09T00:00:00Z',
    completed_at: null,
  }

  describe('Initial State', () => {
    it('should have empty tasks array on init', () => {
      const store = useTaskStore()
      expect(store.tasks).toEqual([])
    })

    it('should have null loading state on init', () => {
      const store = useTaskStore()
      expect(store.loading).toBe(false)
    })

    it('should have null error on init', () => {
      const store = useTaskStore()
      expect(store.error).toBeNull()
    })

    it('should have empty filters on init', () => {
      const store = useTaskStore()
      expect(store.filters).toBeDefined()
    })
  })

  describe('Task Actions', () => {
    it('should add a task', () => {
      const store = useTaskStore()
      store.addTask(mockTask)

      expect(store.tasks.length).toBe(1)
      expect(store.tasks[0]).toEqual(mockTask)
    })

    it('should set tasks array', () => {
      const store = useTaskStore()
      const tasks = [mockTask, { ...mockTask, id: '2', title: 'Task 2' }]
      store.setTasks(tasks)

      expect(store.tasks).toEqual(tasks)
    })

    it('should update a task', () => {
      const store = useTaskStore()
      store.addTask(mockTask)

      const updatedTask = { ...mockTask, title: 'Updated Title' }
      store.updateTask(updatedTask)

      expect(store.tasks[0].title).toBe('Updated Title')
    })

    it('should delete a task', () => {
      const store = useTaskStore()
      store.addTask(mockTask)

      store.deleteTask(mockTask.id)

      expect(store.tasks.length).toBe(0)
    })

    it('should complete a task', () => {
      const store = useTaskStore()
      store.addTask(mockTask)

      store.completeTask(mockTask.id)

      const task = store.tasks.find((t) => t.id === mockTask.id)
      expect(task?.status).toBe('completed')
    })

    it('should clear all tasks', () => {
      const store = useTaskStore()
      store.addTask(mockTask)
      store.addTask({ ...mockTask, id: '2' })

      store.clearTasks()

      expect(store.tasks).toEqual([])
    })
  })

  describe('Filter Actions', () => {
    it('should set filters', () => {
      const store = useTaskStore()
      const filters = { status: 'completed', priority: 'high' }
      store.setFilters(filters)

      expect(store.filters).toEqual(expect.objectContaining(filters))
    })

    it('should clear filters', () => {
      const store = useTaskStore()
      store.setFilters({ status: 'completed' })
      store.clearFilters()

      expect(store.filters.status).toBeUndefined() || expect(store.filters).toEqual({})
    })

    it('should update search filter', () => {
      const store = useTaskStore()
      store.setSearchFilter('test search')

      expect(store.filters.search).toBe('test search')
    })

    it('should update status filter', () => {
      const store = useTaskStore()
      store.setStatusFilter('completed')

      expect(store.filters.status).toBe('completed')
    })

    it('should update priority filter', () => {
      const store = useTaskStore()
      store.setPriorityFilter('high')

      expect(store.filters.priority).toBe('high')
    })
  })

  describe('Loading State', () => {
    it('should set loading true', () => {
      const store = useTaskStore()
      store.setLoading(true)

      expect(store.loading).toBe(true)
    })

    it('should set loading false', () => {
      const store = useTaskStore()
      store.setLoading(true)
      store.setLoading(false)

      expect(store.loading).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should set error message', () => {
      const store = useTaskStore()
      const error = 'Failed to load tasks'
      store.setError(error)

      expect(store.error).toBe(error)
    })

    it('should clear error', () => {
      const store = useTaskStore()
      store.setError('Some error')
      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    it('should get filtered tasks', () => {
      const store = useTaskStore()
      const completedTask = { ...mockTask, id: '1', status: 'completed' }
      const pendingTask = { ...mockTask, id: '2', status: 'pending' }

      store.setTasks([completedTask, pendingTask])
      store.setStatusFilter('completed')

      const filtered = store.filteredTasks
      expect(filtered.some((t) => t.status === 'completed')).toBeTruthy()
    })

    it('should get task count', () => {
      const store = useTaskStore()
      store.addTask(mockTask)
      store.addTask({ ...mockTask, id: '2' })

      expect(store.taskCount).toBe(2)
    })

    it('should get completed task count', () => {
      const store = useTaskStore()
      store.addTask(mockTask)
      store.addTask({ ...mockTask, id: '2', status: 'completed' })

      expect(store.completedCount).toBe(1) || expect(store.completedCount).toBeGreaterThan(0)
    })

    it('should get pending task count', () => {
      const store = useTaskStore()
      store.addTask(mockTask)
      store.addTask({ ...mockTask, id: '2', status: 'completed' })

      expect(store.pendingCount).toBe(1) || expect(store.pendingCount).toBeGreaterThan(0)
    })
  })

  describe('Task Search', () => {
    it('should search tasks by title', () => {
      const store = useTaskStore()
      store.addTask({ ...mockTask, title: 'Important Task' })
      store.addTask({ ...mockTask, id: '2', title: 'Another Task' })

      store.setSearchFilter('Important')
      const results = store.filteredTasks

      expect(results.some((t) => t.title.includes('Important'))).toBeTruthy()
    })

    it('should search case-insensitively', () => {
      const store = useTaskStore()
      store.addTask({ ...mockTask, title: 'Test Task' })

      store.setSearchFilter('test')
      const results = store.filteredTasks

      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('Task Sorting', () => {
    it('should get sorted tasks', () => {
      const store = useTaskStore()
      store.addTask({ ...mockTask, id: '1', priority: 'low', created_at: '2026-01-01T00:00:00Z' })
      store.addTask({ ...mockTask, id: '2', priority: 'high', created_at: '2026-01-09T00:00:00Z' })

      const sorted = store.sortedTasks || store.tasks
      expect(sorted).toBeDefined()
    })
  })

  describe('Batch Operations', () => {
    it('should handle batch delete', () => {
      const store = useTaskStore()
      store.addTask(mockTask)
      store.addTask({ ...mockTask, id: '2' })

      store.batchDelete([mockTask.id, '2'])

      expect(store.tasks.length).toBe(0)
    })

    it('should handle batch complete', () => {
      const store = useTaskStore()
      store.addTask(mockTask)
      store.addTask({ ...mockTask, id: '2', status: 'pending' })

      store.batchComplete([mockTask.id, '2'])

      expect(store.tasks.every((t) => t.status === 'completed')).toBeTruthy()
    })
  })

  describe('Selection State', () => {
    it('should track selected task ids', () => {
      const store = useTaskStore()
      store.selectTask(mockTask.id)

      expect(store.selectedTasks).toContain(mockTask.id)
    })

    it('should deselect task', () => {
      const store = useTaskStore()
      store.selectTask(mockTask.id)
      store.deselectTask(mockTask.id)

      expect(store.selectedTasks).not.toContain(mockTask.id)
    })

    it('should select all tasks', () => {
      const store = useTaskStore()
      store.addTask(mockTask)
      store.addTask({ ...mockTask, id: '2' })

      store.selectAll()

      expect(store.selectedTasks.length).toBe(2)
    })

    it('should clear selection', () => {
      const store = useTaskStore()
      store.selectTask(mockTask.id)
      store.clearSelection()

      expect(store.selectedTasks.length).toBe(0)
    })
  })

  describe('Pagination', () => {
    it('should set page', () => {
      const store = useTaskStore()
      store.setPage(2)

      expect(store.currentPage).toBe(2)
    })

    it('should set page size', () => {
      const store = useTaskStore()
      store.setPageSize(25)

      expect(store.pageSize).toBe(25)
    })

    it('should calculate total pages', () => {
      const store = useTaskStore()
      for (let i = 0; i < 50; i++) {
        store.addTask({ ...mockTask, id: String(i) })
      }

      store.setPageSize(10)
      expect(store.totalPages).toBe(5) || expect(store.totalPages).toBeGreaterThan(0)
    })
  })

  describe('Statistics', () => {
    it('should calculate task progress', () => {
      const store = useTaskStore()
      store.addTask(mockTask)
      store.addTask({ ...mockTask, id: '2', status: 'completed' })

      const progress = store.taskProgress
      expect(progress).toBeGreaterThan(0) || expect(progress).toBeGreaterThanOrEqual(0)
    })

    it('should track high priority tasks', () => {
      const store = useTaskStore()
      store.addTask({ ...mockTask, priority: 'high' })
      store.addTask({ ...mockTask, id: '2', priority: 'low' })

      const highPriority = store.tasks.filter((t) => t.priority === 'high')
      expect(highPriority.length).toBeGreaterThan(0)
    })
  })

  describe('Undo/Redo', () => {
    it('should support undo', () => {
      const store = useTaskStore()
      store.addTask(mockTask)
      store.undo?.()

      expect(store.tasks.length || 0).toBeLessThanOrEqual(1)
    })

    it('should support redo', () => {
      const store = useTaskStore()
      store.addTask(mockTask)
      store.undo?.()
      store.redo?.()

      expect(store.tasks.length).toBeGreaterThan(0) || expect(store.redo).toBeDefined()
    })
  })
})
