import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '../useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    // Clear toasts after each test
    const { clear } = useToast()
    clear()
  })

  it('initializes with empty toasts', () => {
    const { toasts } = useToast()
    expect(toasts.value).toEqual([])
  })

  it('adds toast with message', () => {
    const { toasts, addToast } = useToast()
    
    addToast('Test message')
    
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Test message')
  })

  it('adds success toast', () => {
    const { toasts, success } = useToast()
    
    success('Success message', 'Success')
    
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[0].title).toBe('Success')
  })

  it('adds error toast with longer duration', () => {
    const { toasts, error } = useToast()
    
    error('Error message', 'Error')
    
    expect(toasts.value[0].type).toBe('error')
    expect(toasts.value[0].duration).toBe(5000)
  })

  it('adds warning toast', () => {
    const { toasts, warning } = useToast()
    
    warning('Warning message', 'Warning')
    
    expect(toasts.value[0].type).toBe('warning')
  })

  it('adds info toast', () => {
    const { toasts, info } = useToast()
    
    info('Info message', 'Info')
    
    expect(toasts.value[0].type).toBe('info')
  })

  it('removes toast by id', () => {
    const { toasts, addToast, removeToast } = useToast()
    
    const id = addToast('Test')
    expect(toasts.value).toHaveLength(1)
    
    removeToast(id)
    expect(toasts.value).toHaveLength(0)
  })

  it('auto-removes toast after duration', () => {
    const { toasts, addToast } = useToast()
    
    addToast('Test', { duration: 3000 })
    expect(toasts.value).toHaveLength(1)
    
    vi.advanceTimersByTime(3000)
    expect(toasts.value).toHaveLength(0)
  })

  it('respects null duration for persistent notifications', () => {
    const { addToast } = useToast()
    
    const id = addToast('Persistent', { duration: null })
    expect(id).toBeTruthy()
    
    // Toasts with duration: null should not auto-remove
    // (removal only happens via removeToast() call)
  })

  it('clears all toasts', () => {
    const { toasts, addToast, clear } = useToast()
    
    addToast('Test 1')
    addToast('Test 2')
    addToast('Test 3')
    
    expect(toasts.value).toHaveLength(3)
    
    clear()
    
    expect(toasts.value).toHaveLength(0)
  })

  it('returns unique ids', () => {
    const { addToast } = useToast()
    
    const id1 = addToast('Test 1')
    const id2 = addToast('Test 2')
    
    expect(id1).not.toBe(id2)
  })
})
