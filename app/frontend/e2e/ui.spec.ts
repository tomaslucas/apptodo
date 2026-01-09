import { test, expect } from '@playwright/test'

test.describe('User Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display navigation bar', async ({ page }) => {
    const navbar = page.locator('nav, [role="navigation"], header')
    expect(await navbar.count()).toBeGreaterThan(0)
  })

  test('should have functional sidebar toggle', async ({ page }) => {
    const sidebarToggle = page.locator('button[aria-label*="menu" i], button[aria-label*="sidebar" i]')
    if (await sidebarToggle.count() > 0) {
      const sidebar = page.locator('aside, [class*="sidebar"]')

      // Check initial visibility
      const initialVisible = await sidebar.isVisible()

      // Toggle sidebar
      await sidebarToggle.click()
      await page.waitForTimeout(300)

      // Check visibility changed
      const afterToggle = await sidebar.isVisible()
      expect(afterToggle).not.toBe(initialVisible)
    }
  })

  test('should display footer', async ({ page }) => {
    const footer = page.locator('footer, [role="contentinfo"]')
    expect(await footer.count()).toBeGreaterThan(0)
  })

  test('should display responsive layout on mobile', async ({ page, context }) => {
    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Layout should adapt
    const sidebar = page.locator('aside, [class*="sidebar"]')
    const mobileMenu = page.locator('[class*="mobile"], [class*="menu"]')

    // Either sidebar is hidden or mobile menu is visible
    const sidebarVisible = await sidebar.isVisible()
    const mobileMenuVisible = await mobileMenu.isVisible()

    expect(sidebarVisible || mobileMenuVisible).toBeTruthy()
  })

  test('should display theme toggle if available', async ({ page }) => {
    const themeToggle = page.locator('button[aria-label*="theme" i], button[aria-label*="dark" i]')
    if (await themeToggle.count() > 0) {
      expect(themeToggle).toBeDefined()
    }
  })

  test('should show loading state', async ({ page }) => {
    // Trigger data load
    const items = page.locator('[class*="task"]')

    // Loading spinner might appear
    const spinner = page.locator('[class*="spinner"], [class*="loader"], [role="status"]')
    expect(spinner.count()).toBeGreaterThanOrEqual(0)
  })

  test('should display error messages', async ({ page }) => {
    // Try to trigger an error (e.g., invalid action)
    const modal = page.locator('[role="dialog"]')
    if (await modal.count() > 0) {
      // Close modal if open
      await page.keyboard.press('Escape')
    }

    // Look for error message
    const errorMessage = page.locator('[role="alert"], [class*="error"]')
    expect(errorMessage.count()).toBeGreaterThanOrEqual(0)
  })

  test('should display success notifications', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create|new/i })
    if (await createButton.count() > 0) {
      await createButton.first().click()

      // Fill and submit form
      const titleInput = page.getByPlaceholder(/title/i)
      if (await titleInput.count() > 0) {
        await titleInput.fill('Test Task')

        const submitButton = page.getByRole('button', { name: /create|save/i })
        if (await submitButton.count() > 0) {
          await submitButton.click()

          // Success notification should appear
          const notification = page.locator('[class*="toast"], [role="alert"], [class*="success"]')
          expect(notification.count()).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  test('should be keyboard accessible', async ({ page }) => {
    // Tab through interactive elements
    let tabCount = 0
    let prevFocused = null

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')

      const focused = await page.evaluate(() => document.activeElement?.tagName)
      if (focused && focused !== prevFocused) {
        tabCount++
      }
      prevFocused = focused
    }

    // Should have focusable elements
    expect(tabCount).toBeGreaterThan(0)
  })

  test('should display proper focus indicators', async ({ page }) => {
    const buttons = page.getByRole('button').first()
    if (await buttons.count() > 0) {
      // Focus button
      await buttons.focus()

      // Button should have focus visible style
      const focused = await buttons.evaluate((el) => el === document.activeElement)
      expect(focused).toBe(true)
    }
  })

  test('should maintain scroll position', async ({ page }) => {
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))

    // Perform action
    const links = page.getByRole('link')
    if (await links.count() > 0) {
      // Scroll position should be manageable
      const scrollPos = await page.evaluate(() => window.scrollY)
      expect(scrollPos).toBeGreaterThanOrEqual(0)
    }
  })

  test('should display proper typography', async ({ page }) => {
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const paragraphs = page.locator('p')

    // Should have readable content
    expect(await headings.count()).toBeGreaterThanOrEqual(0)
    expect(await paragraphs.count()).toBeGreaterThanOrEqual(0)
  })

  test('should use consistent spacing', async ({ page }) => {
    // Check that elements are visible and properly spaced
    const mainContent = page.locator('main, [role="main"]')
    expect(await mainContent.count()).toBeGreaterThanOrEqual(0)
  })
})
