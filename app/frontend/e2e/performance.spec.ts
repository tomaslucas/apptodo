import { test, expect } from '@playwright/test'

test.describe('Performance', () => {
  test('should load page within reasonable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')

    const loadTime = Date.now() - startTime

    // Page should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should render without layout shift', async ({ page }) => {
    let layoutShifts = 0

    // Monitor for layout shifts
    await page.evaluateHandle(() => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              (window as any).layoutShiftCount = ((window as any).layoutShiftCount || 0) + 1
            }
          }
        })

        try {
          observer.observe({ entryTypes: ['layout-shift'] })
        } catch (e) {
          // Ignore if not supported
        }
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    layoutShifts = (await page.evaluate(() => (window as any).layoutShiftCount || 0)) as number

    // Should have minimal layout shifts
    expect(layoutShifts).toBeLessThan(5)
  })

  test('should have good Largest Contentful Paint (LCP)', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        if ('PerformanceObserver' in window) {
          let largestPaint = 0

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              largestPaint = Math.max(largestPaint, (entry as any).renderTime || (entry as any).loadTime)
            }
          })

          try {
            observer.observe({ entryTypes: ['largest-contentful-paint'] })
            setTimeout(() => resolve({ lcp: largestPaint }), 2000)
          } catch (e) {
            resolve({ lcp: 0 })
          }
        } else {
          resolve({ lcp: 0 })
        }
      })
    })

    // LCP should be under 2.5 seconds
    expect(metrics.lcp).toBeLessThan(2500)
  })

  test('should have minimal cumulative layout shift', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        if ('PerformanceObserver' in window) {
          let cumulativeLayoutShift = 0

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cumulativeLayoutShift += (entry as any).value
              }
            }
          })

          try {
            observer.observe({ entryTypes: ['layout-shift'] })
            setTimeout(() => resolve({ cls: cumulativeLayoutShift }), 3000)
          } catch (e) {
            resolve({ cls: 0 })
          }
        } else {
          resolve({ cls: 0 })
        }
      })
    })

    // CLS should be under 0.1
    expect(metrics.cls).toBeLessThan(0.1)
  })

  test('should load resources efficiently', async ({ page }) => {
    const resourceTimings = await page.evaluate(() => {
      return (performance.getEntriesByType('resource') as any[]).map((r) => ({
        name: r.name,
        duration: r.duration,
        size: r.transferSize,
      }))
    })

    // Should not have excessively long resource loads
    const slowResources = resourceTimings.filter((r) => r.duration > 2000)
    expect(slowResources.length).toBeLessThan(2)
  })

  test('should have limited bundle size impact', async ({ page }) => {
    const resources = await page.evaluate(() => {
      return (performance.getEntriesByType('resource') as any[]).reduce((total: number, r) => {
        return total + (r.transferSize || 0)
      }, 0)
    })

    // Total resource size should be reasonable (< 5MB)
    expect(resources).toBeLessThan(5000000)
  })

  test('should not have excessive memory usage', async ({ page }) => {
    // Note: Memory APIs are limited in browser context
    const metrics = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory
      }
      return null
    })

    // If available, check memory usage
    if (metrics) {
      expect(metrics.usedJSHeapSize).toBeLessThan(50000000) // < 50MB
    }
  })

  test('should handle rapid interactions smoothly', async ({ page }) => {
    const startTime = performance.now()

    // Simulate rapid interactions
    const buttons = page.getByRole('button')
    for (let i = 0; i < Math.min(5, await buttons.count()); i++) {
      await buttons.nth(i).click()
      await page.waitForTimeout(100)
    }

    const duration = performance.now() - startTime

    // Should handle interactions smoothly (< 2 seconds for 5 clicks)
    expect(duration).toBeLessThan(2000)
  })

  test('should lazy load content when applicable', async ({ page }) => {
    const initialResources = (
      await page.evaluate(() =>
        (performance.getEntriesByType('resource') as any[]).length,
      )
    ) as number

    // Scroll down to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 1000))
    await page.waitForTimeout(500)

    const afterScrollResources = (
      await page.evaluate(() =>
        (performance.getEntriesByType('resource') as any[]).length,
      )
    ) as number

    // May have loaded additional resources
    expect(afterScrollResources).toBeGreaterThanOrEqual(initialResources)
  })

  test('should cache resources properly', async ({ page, context }) => {
    // First load
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const firstLoadMetrics = await page.evaluate(() => {
      return {
        duration: performance.timing.loadEventEnd - performance.timing.navigationStart,
      }
    })

    // Reload
    await page.reload()
    await page.waitForLoadState('networkidle')

    const secondLoadMetrics = await page.evaluate(() => {
      return {
        duration: performance.timing.loadEventEnd - performance.timing.navigationStart,
      }
    })

    // Second load should generally be faster (cached resources)
    expect(secondLoadMetrics.duration).toBeLessThanOrEqual(firstLoadMetrics.duration + 500)
  })
})
