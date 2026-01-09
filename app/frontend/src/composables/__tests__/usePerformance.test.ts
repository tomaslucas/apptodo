import { describe, it, expect, vi } from 'vitest'
import { usePerformance } from '../usePerformance'

describe('usePerformance Composable', () => {
  it('initializes with metrics object', () => {
    const perf = usePerformance()
    expect(perf.metrics).toBeDefined()
  })

  it('has getCachedOrCompute method', () => {
    const { getCachedOrCompute } = usePerformance()
    expect(typeof getCachedOrCompute).toBe('function')
  })

  it('has cacheWithLRU method', () => {
    const { cacheWithLRU } = usePerformance()
    expect(typeof cacheWithLRU).toBe('function')
  })

  it('has createMemoized method', () => {
    const { createMemoized } = usePerformance()
    expect(typeof createMemoized).toBe('function')
  })

  it('has createDebounced method', () => {
    const { createDebounced } = usePerformance()
    expect(typeof createDebounced).toBe('function')
  })

  it('has createThrottled method', () => {
    const { createThrottled } = usePerformance()
    expect(typeof createThrottled).toBe('function')
  })

  it('has preload object with methods', () => {
    const { preload } = usePerformance()
    expect(preload).toHaveProperty('images')
    expect(preload).toHaveProperty('font')
    expect(typeof preload.images).toBe('function')
    expect(typeof preload.font).toBe('function')
  })

  it('has measureSync method', () => {
    const { measureSync } = usePerformance()
    expect(typeof measureSync).toBe('function')
  })

  it('has measureAsync method', () => {
    const { measureAsync } = usePerformance()
    expect(typeof measureAsync).toBe('function')
  })

  it('has reportWebVitals method', () => {
    const { reportWebVitals } = usePerformance()
    expect(typeof reportWebVitals).toBe('function')
  })

  it('has getPerformanceSummary method', () => {
    const { getPerformanceSummary } = usePerformance()
    expect(typeof getPerformanceSummary).toBe('function')
  })

  it('has clearCaches method', () => {
    const { clearCaches } = usePerformance()
    expect(typeof clearCaches).toBe('function')
  })

  it('caches values correctly', () => {
    const { getCachedOrCompute } = usePerformance()
    const fn = vi.fn().mockReturnValue('computed')

    const result1 = getCachedOrCompute('key', fn)
    const result2 = getCachedOrCompute('key', fn)

    expect(result1).toBe('computed')
    expect(result2).toBe('computed')
    expect(fn).toHaveBeenCalledOnce()
  })

  it('creates memoized function correctly', () => {
    const { createMemoized } = usePerformance()
    const fn = vi.fn((a: number) => a * 2)
    const memoized = createMemoized(fn)

    memoized(5)
    memoized(5)

    expect(fn).toHaveBeenCalledOnce()
  })

  it('measureSync executes and returns result', () => {
    const { measureSync } = usePerformance()
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = measureSync('test', () => 42)

    expect(result).toBe(42)
    consoleSpy.mockRestore()
  })

  it('measureAsync executes async function', async () => {
    const { measureAsync } = usePerformance()
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await measureAsync('test', async () => 42)

    expect(result).toBe(42)
    consoleSpy.mockRestore()
  })

  it('reportWebVitals logs metric', () => {
    const { reportWebVitals } = usePerformance()
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    reportWebVitals({ name: 'FCP', value: 100 })

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('FCP'))
    consoleSpy.mockRestore()
  })

  it('getPerformanceSummary returns object with properties', () => {
    const { getPerformanceSummary } = usePerformance()
    const summary = getPerformanceSummary()

    expect(summary).toHaveProperty('dns')
    expect(summary).toHaveProperty('tcp')
    expect(summary).toHaveProperty('ttfb')
    expect(summary).toHaveProperty('dom')
    expect(summary).toHaveProperty('load')
  })
})
