import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export interface Modal {
  id: string
  type: 'task-form' | 'confirm' | 'category' | 'custom'
  isOpen: boolean
  title?: string
  data?: Record<string, any>
}

export const useUIStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const modals = ref<Record<string, Modal>>({})
  const isSidebarOpen = ref(true)
  const commandPaletteOpen = ref(false)

  const activeModals = computed(() => {
    return Object.values(modals.value).filter((m) => m.isOpen)
  })

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const toast: Toast = { id, message, type, duration }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (toastId: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== toastId)
  }

  const clearToasts = () => {
    toasts.value = []
  }

  const openModal = (modalId: string, title?: string, data?: Record<string, any>) => {
    if (!modals.value[modalId]) {
      modals.value[modalId] = {
        id: modalId,
        type: 'custom',
        isOpen: false,
      }
    }
    modals.value[modalId].isOpen = true
    if (title) modals.value[modalId].title = title
    if (data) modals.value[modalId].data = data
  }

  const closeModal = (modalId: string) => {
    if (modals.value[modalId]) {
      modals.value[modalId].isOpen = false
    }
  }

  const toggleModal = (modalId: string, title?: string, data?: Record<string, any>) => {
    if (modals.value[modalId]?.isOpen) {
      closeModal(modalId)
    } else {
      openModal(modalId, title, data)
    }
  }

  const registerModal = (
    modalId: string,
    type: Modal['type'] = 'custom',
    isOpen = false,
    title?: string,
    data?: Record<string, any>
  ) => {
    modals.value[modalId] = {
      id: modalId,
      type,
      isOpen,
      title,
      data,
    }
  }

  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  const setSidebarOpen = (open: boolean) => {
    isSidebarOpen.value = open
  }

  const toggleCommandPalette = () => {
    commandPaletteOpen.value = !commandPaletteOpen.value
  }

  const setCommandPaletteOpen = (open: boolean) => {
    commandPaletteOpen.value = open
  }

  const closeAllModals = () => {
    Object.keys(modals.value).forEach((modalId) => {
      closeModal(modalId)
    })
  }

  return {
    toasts,
    modals,
    isSidebarOpen,
    commandPaletteOpen,
    activeModals,
    addToast,
    removeToast,
    clearToasts,
    openModal,
    closeModal,
    toggleModal,
    registerModal,
    toggleSidebar,
    setSidebarOpen,
    toggleCommandPalette,
    setCommandPaletteOpen,
    closeAllModals,
  }
})
