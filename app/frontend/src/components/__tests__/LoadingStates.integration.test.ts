import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLoading } from '../../composables/useLoading'
import { useToast } from '../../composables/useToast'

describe('Loading States Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    const { clear } = useToast()
    clear()
  })

  it('combines loading states with toast notifications', () => {
    const { isLoading, progress, start, end } = useLoading()
    const { addToast, toasts } = useToast()

    // Start loading
    start()
    expect(isLoading.value).toBe(true)

    // Add progress notification
    addToast('Loading task list', { 
      type: 'info',
      duration: null
    })
    expect(toasts.value).toHaveLength(1)

    // End loading and show success
    end()
    expect(isLoading.value).toBe(false)

    addToast('Task list loaded', { 
      type: 'success',
      title: 'Success'
    })
    expect(toasts.value).toHaveLength(2)
  })

  it('handles loading state with error recovery', () => {
    const { isLoading, start, end } = useLoading()
    const { error, toasts } = useToast()

    start()
    expect(isLoading.value).toBe(true)

    // Simulate error
    end()
    error('Failed to load tasks', 'Error')

    expect(isLoading.value).toBe(false)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].type).toBe('error')
  })

  it('manages multiple sequential async operations', () => {
    const operations = Array.from({ length: 3 }, () => useLoading())
    const { toasts, addToast } = useToast()

    // Sequence of operations
    operations.forEach((op, i) => {
      op.start()
      addToast(`Processing item ${i + 1}`, { 
        type: 'info',
        duration: null
      })
      op.end()
    })

    expect(operations.every(op => !op.isLoading.value)).toBe(true)
    expect(toasts.value).toHaveLength(3)
  })
})
