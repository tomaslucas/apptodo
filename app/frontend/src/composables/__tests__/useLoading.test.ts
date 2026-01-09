import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLoading } from '../useLoading'

describe('useLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with correct default values', () => {
    const { isLoading, progress } = useLoading()
    
    expect(isLoading.value).toBe(false)
    expect(progress.value).toBe(0)
  })

  it('starts loading immediately without delay', () => {
    const { isLoading, start } = useLoading()
    
    start()
    
    expect(isLoading.value).toBe(true)
  })

  it('starts loading after delay', () => {
    const { isLoading, start } = useLoading({ delay: 1000 })
    
    start()
    expect(isLoading.value).toBe(false)
    
    vi.advanceTimersByTime(1000)
    expect(isLoading.value).toBe(true)
  })

  it('calls onStart callback', () => {
    const onStart = vi.fn()
    const { start } = useLoading({ onStart })
    
    start()
    
    expect(onStart).toHaveBeenCalled()
  })

  it('calls onEnd callback', () => {
    const onEnd = vi.fn()
    const { start, end } = useLoading({ onEnd })
    
    start()
    end()
    
    expect(onEnd).toHaveBeenCalled()
  })

  it('ends loading and calls callback', () => {
    const { isLoading, end } = useLoading()
    
    end()
    
    expect(isLoading.value).toBe(false)
  })

  it('sets progress value within bounds', () => {
    const { progress, setProgress } = useLoading()
    
    setProgress(50)
    expect(progress.value).toBe(50)
    
    setProgress(150)
    expect(progress.value).toBe(100)
    
    setProgress(-10)
    expect(progress.value).toBe(0)
  })

  it('resets loading state', () => {
    const { isLoading, progress, reset } = useLoading()
    
    isLoading.value = true
    progress.value = 50
    
    reset()
    
    expect(isLoading.value).toBe(false)
    expect(progress.value).toBe(0)
  })

  it('simulates progress on start', () => {
    const { start, progress } = useLoading()
    
    start()
    
    vi.advanceTimersByTime(500)
    expect(progress.value).toBeGreaterThan(0)
  })
})
