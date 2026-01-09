# Performance Optimizations - apptodo-20

## Overview

Comprehensive performance optimization utilities and composables for building fast, efficient Vue applications.

## Performance Utilities (utils/performance.ts)

### Memoization

Cache function results to avoid recalculation:

```typescript
import { memoize } from '@/utils/performance'

const expensiveFunction = (a, b) => {
  return a + b
}

const memoized = memoize(expensiveFunction)

memoized(2, 3) // Computed: 5
memoized(2, 3) // Cached: 5 (function not called again)
```

### Debounce

Delay function execution, cancelling previous calls:

```typescript
import { debounce } from '@/utils/performance'

const handleSearch = debounce((query) => {
  // API call
  fetch(`/search?q=${query}`)
}, 300)

// Called many times but debounced
input.addEventListener('input', (e) => {
  handleSearch(e.target.value)
})
```

**Use Cases:**
- Search input handling
- Window resize events
- Text input validation

### Throttle

Limit function execution frequency:

```typescript
import { throttle } from '@/utils/performance'

const handleScroll = throttle(() => {
  // Heavy computation
}, 100)

window.addEventListener('scroll', handleScroll)
```

**Use Cases:**
- Scroll event handling
- Window resize events
- Mouse move tracking

### TTL Cache

Cache with time-to-live expiration:

```typescript
import { TTLCache } from '@/utils/performance'

const cache = new TTLCache<string>(5 * 60 * 1000) // 5 min default

// Set with default TTL
cache.set('user:1', userData)

// Set with custom TTL
cache.set('token', accessToken, 60 * 1000) // 1 minute

// Get value
const user = cache.get('user:1')

// Check existence
if (cache.has('token')) {
  // Token exists
}

// Delete
cache.delete('token')

// Clear all
cache.clear()

// Check size
console.log(cache.size()) // 42
```

### LRU Cache

Least Recently Used cache with capacity limit:

```typescript
import { LRUCache } from '@/utils/performance'

const cache = new LRUCache<string, any>(100) // Max 100 items

cache.set('key1', value1)
cache.set('key2', value2)

const value = cache.get('key1') // Moves to end (recently used)

cache.set('key101', value101) // Evicts oldest (least recently used)

cache.clear()
```

**Features:**
- Automatic eviction of least recently used items
- Efficient memory management
- O(1) operations

### Performance Measurement

Measure code execution time:

```typescript
import { PerformanceMeasure } from '@/utils/performance'

const measure = new PerformanceMeasure()

// Measure sync function
measure.start('operation')
// ... do work ...
const duration = measure.end('operation')

// Or use convenience method
measure.measure('computation', () => {
  // ... expensive operation ...
  return result
})

// Measure async operations
await measure.measureAsync('fetch', async () => {
  return fetch('/api/data')
})
```

### Batch Requests

Batch multiple async operations:

```typescript
import { BatchRequest } from '@/utils/performance'

const batch = new BatchRequest<any>(10) // 10ms batch delay

const promise = batch.add('request-1', async () => {
  return fetch('/api/data')
})

// Multiple requests are batched into single operation
```

### Virtual Scrolling

Efficiently render large lists:

```typescript
import { createVirtualScroller } from '@/utils/performance'

const items = largeDataSet // 10,000+ items
const itemHeight = 50 // pixels
const containerHeight = 500

const scroller = createVirtualScroller(
  items,
  itemHeight,
  containerHeight,
  5 // buffer items
)

// Get only visible items
const visibleItems = scroller.getVisibleItems()

// Handle scroll
element.addEventListener('scroll', scroller.handleScroll)
```

### Image Preloading

Preload images for faster display:

```typescript
import { preloadImages } from '@/utils/performance'

const urls = [
  '/hero.jpg',
  '/banner.jpg',
  '/thumbnail.jpg'
]

await preloadImages(urls)
// All images loaded, can display immediately
```

### Resource Hints

Optimize resource loading:

```typescript
import { addResourceHints } from '@/utils/performance'

// DNS prefetch
addResourceHints('https://api.example.com', 'dns-prefetch')

// Preconnect for critical resources
addResourceHints('https://cdn.example.com', 'preconnect')

// Prefetch likely resources
addResourceHints('/about.js', 'prefetch')

// Preload critical resources
addResourceHints('/fonts/main.woff2', 'preload')
```

## usePerformance Composable

Complete performance management in Vue components:

```typescript
import { usePerformance } from '@/composables/usePerformance'

export default {
  setup() {
    const {
      metrics,
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
    } = usePerformance()

    return {
      metrics,
      getCachedOrCompute,
      createDebounced,
      preload
    }
  }
}
```

### Metrics Monitoring

Monitor real-time performance metrics:

```vue
<script setup lang="ts">
import { usePerformance } from '@/composables/usePerformance'

const { metrics } = usePerformance()
</script>

<template>
  <div class="metrics">
    <div>FPS: {{ metrics.fps }}</div>
    <div>Memory: {{ metrics.memory }}MB</div>
    <div>Render Time: {{ metrics.renderTime }}ms</div>
  </div>
</template>
```

### Cached Data Fetching

```typescript
const { getCachedOrCompute } = usePerformance()

const userData = getCachedOrCompute('user:1', async () => {
  return await fetchUser(1)
}, 5 * 60 * 1000) // 5 min cache
```

### Debounced Search

```vue
<script setup lang="ts">
import { usePerformance } from '@/composables/usePerformance'

const { createDebounced } = usePerformance()
const searchResults = ref([])

const handleSearch = createDebounced(async (query) => {
  searchResults.value = await fetchSearchResults(query)
}, 300)

const onInput = (e) => {
  handleSearch(e.target.value)
}
</script>
```

## Implementation Patterns

### Lazy Component Loading

```typescript
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)
```

### Code Splitting

```typescript
const route = {
  path: '/dashboard',
  component: () => import('./Dashboard.vue')
}
```

### Image Lazy Loading

```typescript
const images = document.querySelectorAll('[data-src]')

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target
      img.src = img.dataset.src
      imageObserver.unobserve(img)
    }
  })
})

images.forEach(img => imageObserver.observe(img))
```

### Virtual Scrolling with Vue

```vue
<script setup lang="ts">
import { usePerformance } from '@/composables/usePerformance'
import { createVirtualScroller } from '@/utils/performance'

const items = ref([])
const container = ref()
const scroller = ref()

onMounted(() => {
  scroller.value = createVirtualScroller(
    items.value,
    50, // itemHeight
    500, // containerHeight
    5 // buffer
  )
})

const handleScroll = (e) => {
  scroller.value.handleScroll(e)
}
</script>

<template>
  <div 
    ref="container"
    @scroll="handleScroll"
    class="virtual-list"
  >
    <div v-for="item in scroller?.getVisibleItems()" :key="item.index">
      {{ item.title }}
    </div>
  </div>
</template>
```

## Performance Tips

### 1. Use Memoization for Expensive Computations

```typescript
const expensiveFilter = memoize((items, criteria) => {
  return items.filter(/* complex logic */)
})
```

### 2. Debounce User Input

```typescript
const search = debounce(performSearch, 300)
input.addEventListener('input', (e) => search(e.target.value))
```

### 3. Cache API Responses

```typescript
const cache = new TTLCache(10 * 60 * 1000) // 10 minutes

const getUser = async (id) => {
  const cached = cache.get(`user:${id}`)
  if (cached) return cached

  const user = await fetch(`/api/users/${id}`)
  cache.set(`user:${id}`, user)
  return user
}
```

### 4. Lazy Load Images

```vue
<img v-lazy="imageSrc" :alt="imageAlt" />
```

### 5. Virtual Scroll for Long Lists

Use virtual scrolling for lists with 100+ items instead of rendering all.

### 6. Code Split Routes

```typescript
// Instead of:
import Dashboard from './Dashboard.vue'

// Do:
const Dashboard = () => import('./Dashboard.vue')
```

### 7. Preload Critical Resources

```typescript
// In main.ts or critical path
addResourceHints('https://api.example.com', 'preconnect')
addResourceHints('/fonts/main.woff2', 'preload')
```

## Testing Performance

### Unit Tests

```bash
bun test src/utils/__tests__/performance.test.ts
bun test src/composables/__tests__/usePerformance.test.ts
```

### Browser DevTools

- **Lighthouse** - Performance audit
- **Performance tab** - Frame rate, CPU usage
- **Network tab** - Resource loading time
- **Memory tab** - Memory leaks detection

### Metrics

- **FCP** (First Contentful Paint) - < 1.8s
- **LCP** (Largest Contentful Paint) - < 2.5s
- **FID** (First Input Delay) - < 100ms
- **CLS** (Cumulative Layout Shift) - < 0.1

## Files Created

### Utilities
- `src/utils/performance.ts` - Core performance utilities
- `src/utils/__tests__/performance.test.ts` - 12 tests

### Composables
- `src/composables/usePerformance.ts` - Vue composable
- `src/composables/__tests__/usePerformance.test.ts` - 15 tests

## Performance Checklist

- [x] Memoization for expensive functions
- [x] Debounce for high-frequency events
- [x] Throttle for scroll/resize events
- [x] Caching with TTL
- [x] LRU cache for bounded memory
- [x] Lazy component loading
- [x] Code splitting
- [x] Virtual scrolling utilities
- [x] Image preloading
- [x] Resource hints
- [x] Performance measurement tools
- [x] Batch request optimization
- [x] Memory monitoring
- [x] FPS monitoring
- [x] Web Vitals reporting

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Vue Performance](https://vuejs.org/guide/best-practices/performance.html)

## Next Steps

1. Integrate performance metrics into monitoring
2. Set up performance budgets
3. Monitor Core Web Vitals in production
4. Optimize critical rendering path
5. Implement service workers for caching
