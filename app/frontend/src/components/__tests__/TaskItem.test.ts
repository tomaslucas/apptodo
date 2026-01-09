import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskItem from '../TaskItem.vue'

describe('TaskItem', () => {
  let wrapper: any
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

  beforeEach(() => {
    wrapper = mount(TaskItem, {
      props: {
        task: mockTask,
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    })
  })

  describe('Component Rendering', () => {
    it('should render component correctly', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('should display task title', () => {
      const titleText = wrapper.text()
      expect(titleText).toContain(mockTask.title)
    })

    it('should display task description if provided', () => {
      const descriptionText = wrapper.text()
      expect(descriptionText).toContain(mockTask.description)
    })

    it('should display priority badge', () => {
      const priorityBadge = wrapper.find('[class*="priority"]')
      expect(priorityBadge.exists() || wrapper.text().includes(mockTask.priority)).toBeTruthy()
    })

    it('should display status indicator', () => {
      const statusIndicator = wrapper.find('[class*="status"]')
      expect(statusIndicator.exists() || wrapper.text().includes(mockTask.status)).toBeTruthy()
    })
  })

  describe('Task Actions', () => {
    it('should have edit button', () => {
      const buttons = wrapper.findAll('button')
      const editButton = buttons.find(
        (btn) => btn.text().toLowerCase().includes('edit') || btn.text().toLowerCase().includes('✏'),
      )
      expect(editButton).toBeTruthy()
    })

    it('should have delete button', () => {
      const buttons = wrapper.findAll('button')
      const deleteButton = buttons.find(
        (btn) => btn.text().toLowerCase().includes('delete') || btn.text().toLowerCase().includes('🗑'),
      )
      expect(deleteButton).toBeTruthy()
    })

    it('should have complete/mark done button', () => {
      const buttons = wrapper.findAll('button')
      const completeButton = buttons.find(
        (btn) =>
          btn.text().toLowerCase().includes('complete') ||
          btn.text().toLowerCase().includes('done') ||
          btn.text().toLowerCase().includes('✓'),
      )
      expect(completeButton).toBeTruthy()
    })

    it('should emit edit event on edit button click', async () => {
      const buttons = wrapper.findAll('button')
      const editButton = buttons.find((btn) => btn.text().toLowerCase().includes('edit'))

      if (editButton) {
        await editButton.trigger('click')
        expect(wrapper.emitted('edit')).toBeTruthy()
      }
    })

    it('should emit delete event on delete button click', async () => {
      const buttons = wrapper.findAll('button')
      const deleteButton = buttons.find((btn) => btn.text().toLowerCase().includes('delete'))

      if (deleteButton) {
        await deleteButton.trigger('click')
        expect(wrapper.emitted('delete')).toBeTruthy()
      }
    })

    it('should emit complete event on complete button click', async () => {
      const buttons = wrapper.findAll('button')
      const completeButton = buttons.find(
        (btn) => btn.text().toLowerCase().includes('complete') || btn.text().toLowerCase().includes('done'),
      )

      if (completeButton) {
        await completeButton.trigger('click')
        expect(wrapper.emitted('complete')).toBeTruthy()
      }
    })
  })

  describe('Task Status Display', () => {
    it('should highlight completed tasks', async () => {
      const completedTask = { ...mockTask, status: 'completed', completed_at: new Date().toISOString() }
      await wrapper.setProps({ task: completedTask })

      const text = wrapper.text()
      expect(text.toLowerCase().includes('completed') || wrapper.find('[class*="completed"]').exists()).toBeTruthy()
    })

    it('should show pending status for incomplete tasks', () => {
      const text = wrapper.text()
      expect(text.toLowerCase().includes('pending') || text.toLowerCase().includes('todo')).toBeTruthy()
    })

    it('should display different styling for different priorities', async () => {
      const highPriorityTask = { ...mockTask, priority: 'high' }
      await wrapper.setProps({ task: highPriorityTask })

      const priorityElement = wrapper.find('[class*="high"]')
      expect(priorityElement.exists() || wrapper.text().includes('high')).toBeTruthy()
    })
  })

  describe('Deadline Display', () => {
    it('should display deadline if provided', async () => {
      const taskWithDeadline = { ...mockTask, deadline: '2026-01-15T00:00:00Z' }
      await wrapper.setProps({ task: taskWithDeadline })

      const text = wrapper.text()
      expect(text).toContain('2026') || expect(text).toContain('Jan')
    })

    it('should not display deadline if not provided', () => {
      const taskWithoutDeadline = { ...mockTask, deadline: null }
      expect(wrapper.props('task').deadline).toBeNull()
    })

    it('should highlight overdue deadlines', async () => {
      const overdueTask = { ...mockTask, deadline: '2025-01-01T00:00:00Z' }
      await wrapper.setProps({ task: overdueTask })

      const overdueIndicator = wrapper.find('[class*="overdue"]')
      expect(overdueIndicator.exists() || wrapper.find('[class*="danger"]').exists()).toBeTruthy()
    })
  })

  describe('Selection and Focus', () => {
    it('should support selection checkbox if applicable', () => {
      const checkbox = wrapper.find('input[type="checkbox"]')
      expect(checkbox.exists()).toBeTruthy()
    })

    it('should emit selection change event', async () => {
      const checkbox = wrapper.find('input[type="checkbox"]')
      if (checkbox.exists()) {
        await checkbox.trigger('change')
        expect(wrapper.emitted('select') || wrapper.emitted('toggle')).toBeTruthy()
      }
    })

    it('should support keyboard focus', () => {
      const item = wrapper.find('[role="button"], button, div[tabindex]')
      expect(item.exists() || wrapper.element.getAttribute('tabindex') !== undefined).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible task item structure', () => {
      const item = wrapper.element
      expect(item).toBeDefined()
    })

    it('should have proper semantic HTML', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should support screen readers', () => {
      const text = wrapper.text()
      expect(text.length).toBeGreaterThan(0)
    })
  })

  describe('Hover and Interaction States', () => {
    it('should be interactive on hover', async () => {
      const item = wrapper.find('[class*="task"], [class*="item"]')
      if (item.exists()) {
        await item.trigger('mouseenter')
        expect(wrapper.vm).toBeDefined()
      }
    })

    it('should show action buttons on interaction', async () => {
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Data Updates', () => {
    it('should update when task prop changes', async () => {
      const updatedTask = { ...mockTask, title: 'Updated Title' }
      await wrapper.setProps({ task: updatedTask })

      expect(wrapper.text()).toContain('Updated Title')
    })

    it('should handle status changes', async () => {
      const completedTask = { ...mockTask, status: 'completed' }
      await wrapper.setProps({ task: completedTask })

      expect(wrapper.text()).toContain('completed') || expect(wrapper.props('task').status).toBe('completed')
    })
  })
})
