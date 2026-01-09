import { ref, computed, Ref } from 'vue'

export interface UseLoadingOptions {
  delay?: number
  onStart?: () => void
  onEnd?: () => void
}

export interface UseLoadingReturn {
  isLoading: Ref<boolean>
  progress: Ref<number>
  start: () => void
  end: () => void
  setProgress: (value: number) => void
  reset: () => void
}

/**
 * Composable for managing loading states
 */
export function useLoading(options: UseLoadingOptions = {}): UseLoadingReturn {
  const { delay = 0, onStart, onEnd } = options
  
  const isLoading = ref(false)
  const progress = ref(0)
  let timeoutId: NodeJS.Timeout | null = null
  let progressIntervalId: NodeJS.Timeout | null = null

  const start = () => {
    if (timeoutId) clearTimeout(timeoutId)
    
    if (delay > 0) {
      timeoutId = setTimeout(() => {
        isLoading.value = true
        progress.value = 0
        onStart?.()
        startProgressSimulation()
      }, delay)
    } else {
      isLoading.value = true
      progress.value = 0
      onStart?.()
      startProgressSimulation()
    }
  }

  const end = () => {
    if (timeoutId) clearTimeout(timeoutId)
    if (progressIntervalId) clearInterval(progressIntervalId)
    
    progress.value = 100
    isLoading.value = false
    onEnd?.()
  }

  const setProgress = (value: number) => {
    progress.value = Math.min(Math.max(value, 0), 100)
  }

  const reset = () => {
    if (timeoutId) clearTimeout(timeoutId)
    if (progressIntervalId) clearInterval(progressIntervalId)
    
    isLoading.value = false
    progress.value = 0
  }

  const startProgressSimulation = () => {
    if (progressIntervalId) clearInterval(progressIntervalId)
    
    progressIntervalId = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 30
      }
    }, 500)
  }

  return {
    isLoading,
    progress,
    start,
    end,
    setProgress,
    reset
  }
}
