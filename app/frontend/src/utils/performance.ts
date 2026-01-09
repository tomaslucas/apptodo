/**
 * Performance optimization utilities
 */

/**
 * Memoize function results to avoid recalculation
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map()

  return ((...args: any[]) => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null

  return ((...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }) as T
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle = false

  return ((...args: any[]) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }) as T
}

/**
 * Simple cache with TTL (time-to-live)
 */
export class TTLCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>()

  constructor(private defaultTTL: number = 60000) {}

  set(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

/**
 * Request batching for API calls
 */
export class BatchRequest<T> {
  private queue: Array<{ id: string; fn: () => Promise<T> }> = []
  private processing = false
  private batchDelay: number

  constructor(batchDelay: number = 10) {
    this.batchDelay = batchDelay
  }

  async add(id: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, fn })
      this.processBatch()
    })
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    await new Promise(resolve => setTimeout(resolve, this.batchDelay))

    const batch = this.queue.splice(0, this.queue.length)

    try {
      const results = await Promise.all(batch.map(item => item.fn()))
      // Process results if needed
    } catch (error) {
      // Handle batch error
      console.error('Batch request error:', error)
    }

    this.processing = false

    if (this.queue.length > 0) {
      this.processBatch()
    }
  }
}

/**
 * Intersection Observer helper for lazy loading
 */
export function useLazyLoad(
  element: HTMLElement,
  onVisible: () => void,
  options: IntersectionObserverInit = {}
): () => void {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        onVisible()
        observer.unobserve(element)
      }
    })
  }, {
    threshold: 0.1,
    ...options
  })

  observer.observe(element)

  return () => {
    observer.unobserve(element)
    observer.disconnect()
  }
}

/**
 * Virtual scroller for large lists
 */
export function createVirtualScroller(
  items: any[],
  itemHeight: number,
  containerHeight: number,
  buffer: number = 5
) {
  let scrollTop = 0

  const getVisibleRange = () => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    )
    return { startIndex, endIndex }
  }

  const getVisibleItems = () => {
    const { startIndex, endIndex } = getVisibleRange()
    return items.slice(startIndex, endIndex).map((item, i) => ({
      ...item,
      index: startIndex + i
    }))
  }

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLElement
    scrollTop = target.scrollTop
  }

  return {
    getVisibleItems,
    getVisibleRange,
    handleScroll,
    getOffsetY: () => {
      const { startIndex } = getVisibleRange()
      return startIndex * itemHeight
    }
  }
}

/**
 * Preload images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = url
    })
  })

  await Promise.all(promises)
}

/**
 * Resource hints for performance
 */
export function addResourceHints(url: string, type: 'dns-prefetch' | 'preconnect' | 'prefetch' | 'preload'): void {
  const link = document.createElement('link')
  link.rel = type
  link.href = url
  if (type === 'preload') {
    link.as = 'fetch'
    link.crossOrigin = 'anonymous'
  }
  document.head.appendChild(link)
}

/**
 * Measure performance metrics
 */
export class PerformanceMeasure {
  private marks = new Map<string, number>()

  start(label: string): void {
    this.marks.set(label, performance.now())
  }

  end(label: string): number {
    const startTime = this.marks.get(label)
    if (!startTime) {
      console.warn(`No start mark found for ${label}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.marks.delete(label)
    return duration
  }

  measure<T>(label: string, fn: () => T): T {
    this.start(label)
    try {
      return fn()
    } finally {
      const duration = this.end(label)
      console.log(`${label}: ${duration.toFixed(2)}ms`)
    }
  }

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label)
    try {
      return await fn()
    } finally {
      const duration = this.end(label)
      console.log(`${label}: ${duration.toFixed(2)}ms`)
    }
  }
}

/**
 * Worker pool for heavy computations
 */
export class WorkerPool {
  private workers: Worker[] = []
  private queue: Array<{
    fn: string
    args: any[]
    resolve: (value: any) => void
    reject: (error: any) => void
  }> = []

  constructor(workerScript: string, poolSize: number = 4) {
    for (let i = 0; i < poolSize; i++) {
      this.workers.push(new Worker(workerScript))
    }
  }

  async run(fn: string, args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, args, resolve, reject })
      this.process()
    })
  }

  private process(): void {
    if (this.queue.length === 0) return

    const task = this.queue.shift()
    if (!task) return

    const worker = this.workers[0]
    // Implementation would depend on worker message protocol
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate())
    this.workers = []
    this.queue = []
  }
}

/**
 * LRU Cache implementation
 */
export class LRUCache<K, V> {
  private map = new Map<K, V>()

  constructor(private maxSize: number = 100) {}

  get(key: K): V | null {
    if (!this.map.has(key)) return null

    // Move to end (most recently used)
    const value = this.map.get(key)!
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    // Remove if exists
    if (this.map.has(key)) {
      this.map.delete(key)
    }
    // Add to end
    this.map.set(key, value)

    // Remove oldest if exceeded capacity
    if (this.map.size > this.maxSize) {
      const firstKey = this.map.keys().next().value
      this.map.delete(firstKey)
    }
  }

  clear(): void {
    this.map.clear()
  }

  size(): number {
    return this.map.size
  }
}
