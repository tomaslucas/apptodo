import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import BatchActionsBar from '../BatchActionsBar.vue'
import { useTaskStore } from '../../stores/task'
import { useUIStore } from '../../stores/ui'

vi.mock('../../api/client')

describe('BatchActionsBar', () => {
  beforeEach(() => {
    const pinia = createPinia()
    mount(BatchActionsBar, {
      global: {
        plugins: [pinia],
      },
    })
  })

  it('should not render when no tasks selected', () => {
    const wrapper = mount(BatchActionsBar, {
      global: {
        plugins: [createPinia()],
      },
    })

    expect(wrapper.find('.batch-actions-bar').exists()).toBe(false)
  })

  it('should render when tasks are selected', () => {
    const pinia = createPinia()
    const wrapper = mount(BatchActionsBar, {
      global: {
        plugins: [pinia],
      },
    })

    const taskStore = useTaskStore()
    taskStore.toggleTaskSelection('task-1')
    taskStore.toggleTaskSelection('task-2')

    wrapper.vm.$nextTick(() => {
      expect(wrapper.find('.batch-actions-bar').exists()).toBe(true)
      expect(wrapper.find('.selected-count').text()).toContain('2 selected')
    })
  })

  it('should display correct selected count', async () => {
    const pinia = createPinia()
    const wrapper = mount(BatchActionsBar, {
      global: {
        plugins: [pinia],
      },
    })

    const taskStore = useTaskStore()
    taskStore.toggleTaskSelection('task-1')

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.selected-count').text()).toContain('1 selected')
  })

  it('should clear selection on clear button', async () => {
    const pinia = createPinia()
    const wrapper = mount(BatchActionsBar, {
      global: {
        plugins: [pinia],
      },
    })

    const taskStore = useTaskStore()
    taskStore.toggleTaskSelection('task-1')
    taskStore.toggleTaskSelection('task-2')

    const clearBtn = wrapper.find('.btn-batch-clear')
    await clearBtn.trigger('click')

    expect(taskStore.getSelectedCount).toBe(0)
  })

  it('should show priority modal', async () => {
    const pinia = createPinia()
    const wrapper = mount(BatchActionsBar, {
      global: {
        plugins: [pinia],
      },
    })

    const taskStore = useTaskStore()
    taskStore.toggleTaskSelection('task-1')

    const priorityBtn = wrapper.find('.btn-batch-priority')
    await priorityBtn.trigger('click')

    expect(wrapper.vm.showPriorityModal).toBe(true)
  })

  it('should show status modal', async () => {
    const pinia = createPinia()
    const wrapper = mount(BatchActionsBar, {
      global: {
        plugins: [pinia],
      },
    })

    const taskStore = useTaskStore()
    taskStore.toggleTaskSelection('task-1')

    const statusBtn = wrapper.find('.btn-batch-status')
    await statusBtn.trigger('click')

    expect(wrapper.vm.showStatusModal).toBe(true)
  })

  it('should format labels correctly', () => {
    const pinia = createPinia()
    const wrapper = mount(BatchActionsBar, {
      global: {
        plugins: [pinia],
      },
    })

    expect(wrapper.vm.formatLabel('pending')).toBe('Pending')
    expect(wrapper.vm.formatLabel('in_progress')).toBe('In Progress')
    expect(wrapper.vm.formatLabel('completed')).toBe('Completed')
  })

  it('should be disabled when loading', async () => {
    const pinia = createPinia()
    const wrapper = mount(BatchActionsBar, {
      global: {
        plugins: [pinia],
      },
    })

    const taskStore = useTaskStore()
    taskStore.toggleTaskSelection('task-1')

    taskStore.isLoading = true
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('.btn-batch')
    buttons.forEach((btn) => {
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })
})
