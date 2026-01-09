/**
 * Utility functions for handling loading states
 */

/**
 * Creates a delay promise for simulating network latency
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Wraps an async function with loading state management
 */
export async function withLoading<T>(
  fn: () => Promise<T>,
  minDuration: number = 300
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await fn()
    const elapsed = Date.now() - startTime
    
    if (elapsed < minDuration) {
      await delay(minDuration - elapsed)
    }
    
    return result
  } catch (error) {
    const elapsed = Date.now() - startTime
    
    if (elapsed < minDuration) {
      await delay(minDuration - elapsed)
    }
    
    throw error
  }
}

/**
 * Simulates progressive loading with exponential backoff
 */
export async function* simulateProgress(
  duration: number = 3000,
  steps: number = 10
): AsyncGenerator<number, void, unknown> {
  const stepDuration = duration / steps
  let progress = 0

  for (let i = 0; i < steps; i++) {
    await delay(stepDuration)
    progress = Math.min((i + 1) / steps * 100, 95)
    yield progress
  }

  yield 100
}

/**
 * Batches multiple async operations with progress tracking
 */
export async function batchWithProgress<T>(
  tasks: (() => Promise<T>)[],
  onProgress?: (current: number, total: number) => void
): Promise<T[]> {
  const results: T[] = []
  const total = tasks.length

  for (let i = 0; i < total; i++) {
    results.push(await tasks[i]())
    onProgress?.(i + 1, total)
  }

  return results
}
