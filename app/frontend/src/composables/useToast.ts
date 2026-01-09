import { ref, readonly } from 'vue'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number | null
  closeable?: boolean
}

// Global toasts state
const globalToasts = ref<ToastMessage[]>([])
let nextId = 0

/**
 * Composable for managing toast notifications
 */
export function useToast() {
  const addToast = (
    message: string,
    options: Partial<Omit<ToastMessage, 'id' | 'message'>> = {}
  ): string => {
    const id = `toast-${nextId++}`
    const toast: ToastMessage = {
      id,
      type: options.type ?? 'info',
      message,
      duration: options.duration ?? 3000,
      closeable: options.closeable ?? true,
      title: options.title
    }
    
    globalToasts.value.push(toast)
    
    if (toast.duration) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration)
    }
    
    return id
  }

  const removeToast = (id: string) => {
    const index = globalToasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      globalToasts.value.splice(index, 1)
    }
  }

  const success = (message: string, title?: string) => {
    return addToast(message, { type: 'success', title, duration: 3000 })
  }

  const error = (message: string, title?: string) => {
    return addToast(message, { type: 'error', title, duration: 5000 })
  }

  const warning = (message: string, title?: string) => {
    return addToast(message, { type: 'warning', title, duration: 3000 })
  }

  const info = (message: string, title?: string) => {
    return addToast(message, { type: 'info', title, duration: 3000 })
  }

  const clear = () => {
    globalToasts.value = []
  }

  return {
    toasts: readonly(globalToasts),
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clear
  }
}
