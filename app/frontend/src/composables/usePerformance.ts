import { ref, computed, onMounted, watch } from 'vue'
import {
  memoize,
  debounce,
  throttle,
  TTLCache,
  LRUCache,
  PerformanceMeasure,
  preloadImages
} from '@/utils/performance'

/**
 * Composable for performance monitoring and optimization
 */
export function usePerformance() {
  const metrics = ref({
    fps: 0,
    memory: 0,
    renderTime: 0
  })

  const cache = new TTLCache<any>(5 * 60 * 1000) // 5 minutes
  const lruCache = new LRUCache<string, any>(100)
  const measure = new PerformanceMeasure()

  /**
   * Monitor FPS
   */
  const startFPSMonitor = () => {
    let lastTime = performance.now()
    let frames = 0

    const updateFPS = () => {
      const currentTime = performance.now()
      const delta = currentTime - lastTime

      if (delta >= 1000) {
        metrics.value.fps = Math.round(frames * (1000 / delta))
        frames = 0
        lastTime = currentTime
      }

      frames++
      requestAnimationFrame(updateFPS)
    }

    updateFPS()
  }

  /**
   * Monitor memory usage (Chrome only)
   */
  const updateMemoryMetrics = () => {
    if (performance.memory) {
      metrics.value.memory = Math.round(
        performance.memory.usedJSHeapSize / 1048576
      ) // Convert to MB
    }
  }

  /**
   * Get cached value or compute if not cached
   */
  const getCachedOrCompute = <T>(
    key: string,
    fn: () => T,
    ttl?: number
  ): T => {
    const cached = cache.get(key)
    if (cached !== null) return cached

    const value = fn()
    cache.set(key, value, ttl)
    return value
  }

  /**
   * Use LRU cache for frequently accessed data
   */
  const cacheWithLRU = <T>(
    key: string,
    fn: () => T
  ): T => {
    const cached = lruCache.get(key)
    if (cached !== undefined) return cached

    const value = fn()
    lruCache.set(key, value)
    return value
  }

  /**
   * Create memoized function
   */
  const createMemoized = <T extends (...args: any[]) => any>(fn: T): T => {
    return memoize(fn)
  }

  /**
   * Create debounced function
   */
  const createDebounced = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T => {
    return debounce(fn, delay)
  }

  /**
   * Create throttled function
   */
  const createThrottled = <T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): T => {
    return throttle(fn, limit)
  }

  /**
   * Preload resources
   */
  const preload = {
    images: async (urls: string[]) => {
      await preloadImages(urls)
    },
    font: (url: string) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.href = url
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    }
  }

  /**
   * Measure function performance
   */
  const measureSync = <T>(label: string, fn: () => T): T => {
    return measure.measure(label, fn)
  }

  /**
   * Measure async function performance
   */
  const measureAsync = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    return measure.measureAsync(label, fn)
  }

  /**
   * Report Web Vitals
   */
  const reportWebVitals = (metric: any) => {
    console.log(`${metric.name}: ${metric.value}ms`)
  }

  /**
   * Get performance summary
   */
  const getPerformanceSummary = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    return {
      dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
      tcp: navigation?.connectEnd - navigation?.connectStart,
      ttfb: navigation?.responseStart - navigation?.requestStart,
      dom: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      load: navigation?.loadEventEnd - navigation?.loadEventStart,
      fp: performance.getEntriesByName('first-paint')[0]?.startTime,
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
    }
  }

  /**
   * Cleanup cache on unmount
   */
  const clearCaches = () => {
    cache.clear()
    lruCache.clear()
  }

  onMounted(() => {
    startFPSMonitor()
    const interval = setInterval(updateMemoryMetrics, 1000)
    
    return () => clearInterval(interval)
  })

  return {
    metrics: computed(() => metrics.value),
    getCachedOrCompute,
    cacheWithLRU,
    createMemoized,
    createDebounced,
    createThrottled,
    preload,
    measureSync,
    measureAsync,
    reportWebVitals,
    getPerformanceSummary,
    clearCaches
  }
}
