import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUIStore } from '../ui'

describe('UI Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const store = useUIStore()
      expect(store.toasts).toBeDefined()
      expect(store.modals).toBeDefined()
      expect(store.isSidebarOpen).toBeDefined()
    })

    it('should have empty toasts on init', () => {
      const store = useUIStore()
      expect(store.toasts).toEqual([])
    })

    it('should have sidebar open by default', () => {
      const store = useUIStore()
      expect(store.isSidebarOpen).toBe(true)
    })

    it('should have command palette closed by default', () => {
      const store = useUIStore()
      expect(store.commandPaletteOpen).toBe(false)
    })
  })

  describe('Sidebar Management', () => {
    it('should toggle sidebar', () => {
      const store = useUIStore()
      const initialState = store.isSidebarOpen
      store.toggleSidebar()

      expect(store.isSidebarOpen).toBe(!initialState)
    })

    it('should open sidebar', () => {
      const store = useUIStore()
      store.setSidebarOpen(false)
      store.setSidebarOpen(true)

      expect(store.isSidebarOpen).toBe(true)
    })

    it('should close sidebar', () => {
      const store = useUIStore()
      store.setSidebarOpen(false)

      expect(store.isSidebarOpen).toBe(false)
    })
  })

  describe('Command Palette', () => {
    it('should toggle command palette', () => {
      const store = useUIStore()
      const initialState = store.commandPaletteOpen
      store.toggleCommandPalette()

      expect(store.commandPaletteOpen).toBe(!initialState)
    })

    it('should open command palette', () => {
      const store = useUIStore()
      store.setCommandPaletteOpen(true)

      expect(store.commandPaletteOpen).toBe(true)
    })

    it('should close command palette', () => {
      const store = useUIStore()
      store.setCommandPaletteOpen(false)

      expect(store.commandPaletteOpen).toBe(false)
    })
  })

  describe('Toast Management', () => {
    it('should add toast', () => {
      const store = useUIStore()
      store.addToast('Test message', 'info')

      expect(store.toasts.length).toBeGreaterThan(0)
    })

    it('should add success toast', () => {
      const store = useUIStore()
      store.addToast('Success!', 'success')

      expect(store.toasts.some((t) => t.type === 'success')).toBeTruthy()
    })

    it('should add error toast', () => {
      const store = useUIStore()
      store.addToast('Error!', 'error')

      expect(store.toasts.some((t) => t.type === 'error')).toBeTruthy()
    })

    it('should add warning toast', () => {
      const store = useUIStore()
      store.addToast('Warning!', 'warning')

      expect(store.toasts.some((t) => t.type === 'warning')).toBeTruthy()
    })

    it('should add info toast', () => {
      const store = useUIStore()
      store.addToast('Info!', 'info')

      expect(store.toasts.some((t) => t.type === 'info')).toBeTruthy()
    })

    it('should return toast id on add', () => {
      const store = useUIStore()
      const toastId = store.addToast('Test', 'info')

      expect(typeof toastId).toBe('string')
      expect(toastId).toBeTruthy()
    })

    it('should remove toast by id', () => {
      const store = useUIStore()
      const toastId = store.addToast('Test', 'info', 5000)
      const initialCount = store.toasts.length

      store.removeToast(toastId)

      expect(store.toasts.length).toBe(initialCount - 1)
    })

    it('should clear all toasts', () => {
      const store = useUIStore()
      store.addToast('Test 1', 'info')
      store.addToast('Test 2', 'success')

      store.clearToasts()

      expect(store.toasts).toEqual([])
    })

    it('should auto-remove toast after timeout', async () => {
      const store = useUIStore()
      const toastId = store.addToast('Test', 'info', 100)

      await new Promise((resolve) => setTimeout(resolve, 150))
      expect(store.toasts.find((t) => t.id === toastId)).toBeUndefined()
    })

    it('should support permanent toasts', async () => {
      const store = useUIStore()
      const toastId = store.addToast('Permanent', 'info', 0)

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(store.toasts.find((t) => t.id === toastId)).toBeDefined()

      store.removeToast(toastId)
    })
  })

  describe('Modal Management', () => {
    it('should open modal', () => {
      const store = useUIStore()
      store.openModal('test-modal')

      expect(store.modals['test-modal']?.isOpen).toBe(true)
    })

    it('should close modal', () => {
      const store = useUIStore()
      store.openModal('test-modal')
      store.closeModal('test-modal')

      expect(store.modals['test-modal']?.isOpen).toBe(false)
    })

    it('should close all modals', () => {
      const store = useUIStore()
      store.openModal('modal1')
      store.openModal('modal2')

      store.closeAllModals()

      expect(
        Object.values(store.modals).every((m) => !m.isOpen) || store.activeModals.length === 0,
      ).toBeTruthy()
    })

    it('should toggle modal', () => {
      const store = useUIStore()
      const initialState = store.modals['test']?.isOpen
      store.toggleModal('test')

      expect(store.modals['test']?.isOpen).toBe(!initialState)
    })

    it('should register modal', () => {
      const store = useUIStore()
      store.registerModal('custom-modal', 'custom', false, 'Modal Title')

      expect(store.modals['custom-modal']).toBeDefined()
      expect(store.modals['custom-modal'].type).toBe('custom')
    })

    it('should set modal data', () => {
      const store = useUIStore()
      const data = { taskId: '123', action: 'edit' }
      store.openModal('task-modal', 'Edit Task', data)

      expect(store.modals['task-modal']?.data).toEqual(data)
    })

    it('should get active modal', () => {
      const store = useUIStore()
      store.openModal('active-modal')

      const activeModal = store.getActiveModal()
      expect(activeModal?.id).toBe('active-modal')
      expect(activeModal?.isOpen).toBe(true)
    })

    it('should handle multiple modals', () => {
      const store = useUIStore()
      store.openModal('modal1')
      store.openModal('modal2')
      store.openModal('modal3')

      expect(store.activeModals.length).toBeGreaterThan(0)
    })
  })

  describe('Sidebar State', () => {
    it('should track sidebar state', () => {
      const store = useUIStore()
      const initial = store.isSidebarOpen

      store.toggleSidebar()
      expect(store.isSidebarOpen).toBe(!initial)

      store.toggleSidebar()
      expect(store.isSidebarOpen).toBe(initial)
    })
  })

  describe('Toast Properties', () => {
    it('should have toast with id', () => {
      const store = useUIStore()
      store.addToast('Test', 'info')

      expect(store.toasts[0].id).toBeDefined()
    })

    it('should have toast with message', () => {
      const store = useUIStore()
      store.addToast('Test Message', 'info')

      expect(store.toasts[0].message).toBe('Test Message')
    })

    it('should have toast with type', () => {
      const store = useUIStore()
      store.addToast('Test', 'success')

      expect(store.toasts[0].type).toBe('success')
    })

    it('should have toast with duration', () => {
      const store = useUIStore()
      store.addToast('Test', 'info', 5000)

      expect(store.toasts[0].duration).toBe(5000)
    })
  })

  describe('Modal Types', () => {
    it('should support task-form modal type', () => {
      const store = useUIStore()
      store.registerModal('task-form', 'task-form')

      expect(store.modals['task-form'].type).toBe('task-form')
    })

    it('should support confirm modal type', () => {
      const store = useUIStore()
      store.registerModal('confirm', 'confirm')

      expect(store.modals['confirm'].type).toBe('confirm')
    })

    it('should support category modal type', () => {
      const store = useUIStore()
      store.registerModal('category', 'category')

      expect(store.modals['category'].type).toBe('category')
    })

    it('should support custom modal type', () => {
      const store = useUIStore()
      store.registerModal('custom', 'custom')

      expect(store.modals['custom'].type).toBe('custom')
    })
  })

  describe('Computed Properties', () => {
    it('should compute active modals', () => {
      const store = useUIStore()
      store.openModal('modal1')
      store.openModal('modal2')
      store.registerModal('modal3', 'custom', false)

      expect(store.activeModals.length).toBe(2)
    })

    it('should track modal count', () => {
      const store = useUIStore()
      store.openModal('modal1')
      store.openModal('modal2')

      expect(store.activeModals.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle closing non-existent modal', () => {
      const store = useUIStore()
      expect(() => store.closeModal('non-existent')).not.toThrow()
    })

    it('should handle multiple toast additions', () => {
      const store = useUIStore()
      for (let i = 0; i < 10; i++) {
        store.addToast(`Toast ${i}`, 'info')
      }

      expect(store.toasts.length).toBe(10)
    })

    it('should handle rapid modal toggles', () => {
      const store = useUIStore()
      store.toggleModal('rapid')
      store.toggleModal('rapid')
      store.toggleModal('rapid')

      expect(store.modals['rapid']).toBeDefined()
    })
  })

  describe('Toast Default Duration', () => {
    it('should have default duration of 3000ms', () => {
      const store = useUIStore()
      store.addToast('Test')

      expect(store.toasts[0].duration).toBe(3000)
    })

    it('should accept custom duration', () => {
      const store = useUIStore()
      store.addToast('Test', 'info', 5000)

      expect(store.toasts[0].duration).toBe(5000)
    })
  })
})
