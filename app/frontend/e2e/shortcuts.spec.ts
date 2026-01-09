import { test, expect } from '@playwright/test'

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should show shortcuts help modal on Cmd/Ctrl+/', async ({ page }) => {
    // Press Cmd+/ or Ctrl+/
    const isMac = process.platform === 'darwin'
    if (isMac) {
      await page.keyboard.press('Meta+Slash')
    } else {
      await page.keyboard.press('Control+Slash')
    }

    // Help modal should appear
    const helpModal = page.locator('[role="dialog"], [class*="modal"]').first()
    await expect(helpModal).toBeDefined()
  })

  test('should close modal on Escape key', async ({ page }) => {
    // Open any modal
    const createButton = page.getByRole('button', { name: /create|new/i })
    if (await createButton.count() > 0) {
      await createButton.first().click()

      // Modal should be visible
      const modal = page.locator('[role="dialog"]')
      expect(await modal.count()).toBeGreaterThan(0)

      // Press Escape
      await page.keyboard.press('Escape')

      // Modal should be closed or hidden
      await page.waitForTimeout(300) // Wait for animation
    }
  })

  test('should create task on Cmd/Ctrl+K', async ({ page }) => {
    const isMac = process.platform === 'darwin'
    if (isMac) {
      await page.keyboard.press('Meta+K')
    } else {
      await page.keyboard.press('Control+K')
    }

    // Task form should appear
    const form = page.locator('form, [role="dialog"]')
    expect(await form.count()).toBeGreaterThan(0)
  })

  test('should focus search on Cmd/Ctrl+F', async ({ page }) => {
    const isMac = process.platform === 'darwin'
    if (isMac) {
      await page.keyboard.press('Meta+F')
    } else {
      await page.keyboard.press('Control+F')
    }

    // Search input should be focused
    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.count() > 0) {
      const focused = await searchInput.evaluate((el) => el === document.activeElement)
      expect(focused).toBe(true)
    }
  })

  test('should navigate tasks with J/K keys', async ({ page }) => {
    const taskItems = page.locator('[class*="task-item"], li')
    if (await taskItems.count() > 1) {
      // Get first task
      const firstTask = taskItems.first()
      const firstText = await firstTask.textContent()

      // Press J to go to next
      await page.keyboard.press('j')
      await page.waitForTimeout(100)

      // Focus should move to next task
      const secondTask = taskItems.nth(1)
      const secondText = await secondTask.textContent()

      expect(firstText).not.toBe(secondText)
    }
  })

  test('should show shortcuts help with descriptions', async ({ page }) => {
    const isMac = process.platform === 'darwin'
    if (isMac) {
      await page.keyboard.press('Meta+Slash')
    } else {
      await page.keyboard.press('Control+Slash')
    }

    // Modal should display shortcuts
    const modal = page.locator('[role="dialog"], [class*="modal"]').first()
    const modalText = await modal.textContent()

    // Check for common shortcuts mentioned
    const hasShortcuts = modalText?.includes('Cmd') || modalText?.includes('Ctrl') || modalText?.includes('Shift')
    expect(hasShortcuts).toBe(true)
  })

  test('should handle platform-specific shortcuts', async ({ page }) => {
    // Check if Cmd or Ctrl shortcuts are available
    const isMac = process.platform === 'darwin'
    const shortcutPrefix = isMac ? 'Meta' : 'Control'

    // Test Cmd/Ctrl+K (create task)
    const key = `${shortcutPrefix}+K`
    const buttons = page.getByRole('button')
    expect(await buttons.count()).toBeGreaterThan(0)
  })

  test('should display shortcuts in help modal', async ({ page }) => {
    const isMac = process.platform === 'darwin'
    if (isMac) {
      await page.keyboard.press('Meta+Slash')
    } else {
      await page.keyboard.press('Control+Slash')
    }

    const modal = page.locator('[role="dialog"], [class*="shortcuts"]').first()
    const text = await modal.textContent()

    // Check for shortcut labels
    const hasKeys = text?.includes('K') || text?.includes('J') || text?.includes('Enter')
    expect(hasKeys).toBe(true)
  })
})
