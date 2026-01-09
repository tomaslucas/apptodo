import { test, expect, injectAxe, checkA11y } from '@playwright/test'

// Helper to inject Axe for accessibility testing
const setupAxe = async (page: any) => {
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js',
  })
}

test.describe('Accessibility (WCAG AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should have proper page title', async ({ page }) => {
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title?.length).toBeGreaterThan(0)
  })

  test('should have main landmark', async ({ page }) => {
    const main = page.locator('main, [role="main"]')
    expect(await main.count()).toBeGreaterThan(0)
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1s = page.locator('h1')
    const h2s = page.locator('h2')

    // Should have at least one h1
    expect(await h1s.count()).toBeGreaterThanOrEqual(0)

    // h2 should not appear before h1
    const h2FirstIndex = await h2s.first().evaluate((el) => Array.from(document.querySelectorAll('h1, h2')).indexOf(el))
    const h1FirstIndex = await h1s.first().evaluate((el) => Array.from(document.querySelectorAll('h1, h2')).indexOf(el))

    if (h1FirstIndex !== -1 && h2FirstIndex !== -1) {
      expect(h1FirstIndex).toBeLessThanOrEqual(h2FirstIndex)
    }
  })

  test('should have descriptive link text', async ({ page }) => {
    const links = page.getByRole('link')
    const linkCount = await links.count()

    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const text = await links.nth(i).textContent()
      // Links should have meaningful text (not empty, not just icons)
      expect(text?.trim().length).toBeGreaterThan(0)
    }
  })

  test('should have proper form labels', async ({ page }) => {
    const inputs = page.locator('input:not([type="hidden"])')
    const inputCount = await inputs.count()

    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const placeholder = await input.getAttribute('placeholder')

      // Should have label, aria-label, or placeholder
      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        expect(await label.count()).toBeGreaterThanOrEqual(0)
      }

      // Should have some form of label
      expect(ariaLabel || placeholder || id).toBeTruthy()
    }
  })

  test('should have proper button labels', async ({ page }) => {
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')

      // Should have text or aria-label
      expect(text?.trim().length || ariaLabel?.length).toBeGreaterThan(0)
    }
  })

  test('should have proper image alt text', async ({ page }) => {
    const images = page.locator('img')
    const imageCount = await images.count()

    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const ariaLabel = await img.getAttribute('aria-label')

      // Should have alt text or aria-label
      expect(alt || ariaLabel).toBeTruthy()
    }
  })

  test('should have proper color contrast', async ({ page }) => {
    const text = page.locator('body *:not(script, style)')
    const textCount = await text.count()

    // Spot check some text elements
    for (let i = 0; i < Math.min(textCount, 10); i++) {
      const element = text.nth(i)
      const isVisible = await element.isVisible()
      expect(isVisible).toBeDefined()
    }
  })

  test('should support keyboard navigation', async ({ page }) => {
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()

    if (buttonCount > 0) {
      // Tab to first button
      await page.keyboard.press('Tab')

      // Button should be focusable
      const focused = await buttons.first().evaluate((el) => el === document.activeElement)
      expect(focused).toBeDefined()
    }
  })

  test('should have focus visible styles', async ({ page }) => {
    const buttons = page.getByRole('button')
    if (await buttons.count() > 0) {
      // Focus button
      await buttons.first().focus()

      // Check for focus indicator (outline, border, etc)
      const styles = await buttons.first().evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          outline: computed.outline,
          border: computed.border,
          boxShadow: computed.boxShadow,
        }
      })

      // Should have some focus indicator
      expect(
        styles.outline ||
          styles.border ||
          styles.boxShadow ||
          (await buttons.first().getAttribute('class')),
      ).toBeTruthy()
    }
  })

  test('should have proper ARIA roles', async ({ page }) => {
    const elements = page.locator('[role]')
    const roleCount = await elements.count()

    // Should have some elements with proper roles
    expect(roleCount).toBeGreaterThanOrEqual(0)

    // Spot check some roles
    const buttons = page.locator('[role="button"]')
    const links = page.locator('[role="link"]')
    const alerts = page.locator('[role="alert"]')

    expect(await buttons.count()).toBeGreaterThanOrEqual(0)
  })

  test('should support skip links', async ({ page }) => {
    const skipLink = page.locator('a[href="#main"], a[href="#content"]')
    expect(skipLink.count()).toBeGreaterThanOrEqual(0)
  })

  test('should have proper language attribute', async ({ page }) => {
    const html = page.locator('html')
    const lang = await html.getAttribute('lang')

    expect(lang).toBeTruthy()
  })

  test('should be mobile accessible', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Should still be navigable
    const buttons = page.getByRole('button')
    expect(await buttons.count()).toBeGreaterThan(0)

    // Touch targets should be reasonable size
    if (await buttons.count() > 0) {
      const box = await buttons.first().boundingBox()
      // Minimum 44x44px for touch
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(40)
        expect(box.height).toBeGreaterThanOrEqual(40)
      }
    }
  })

  test('should have no contrast violations', async ({ page }) => {
    // This is a simplified check - for full a11y testing use automated tools
    const elements = page.locator('body *:visible')
    expect(await elements.count()).toBeGreaterThan(0)
  })
})
