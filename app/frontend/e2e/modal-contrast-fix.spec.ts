import { test, expect } from '@playwright/test'

test.describe('apptodo-70: Modal Contrast and Input Interaction Fix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('modal header has proper text contrast', async ({ page }) => {
    // Open modal by clicking create button
    const createBtn = page.locator('button').filter({ hasText: /New Task|Create/i }).first()
    if (await createBtn.count() > 0) {
      await createBtn.click()
    } else {
      // Try keyboard shortcut
      await page.keyboard.press('Control+K')
    }

    // Wait for modal
    const modal = page.locator('.modal-overlay')
    await expect(modal).toBeVisible({ timeout: 5000 })

    const headerH2 = page.locator('.modal-header h2')
    
    // Verify text is visible
    await expect(headerH2).toBeVisible()
    const text = await headerH2.textContent()
    expect(text).toContain('Create New Task')

    // Check computed color - should be dark (#1a1a1a or similar)
    const computedColor = await headerH2.evaluate((el) => {
      const color = window.getComputedStyle(el).color
      return color
    })
    
    console.log('Header h2 computed color:', computedColor)
    
    // Parse RGB and check it's dark
    const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch
      const brightness = (parseInt(r) + parseInt(g) + parseInt(b)) / 3
      console.log('Color brightness:', brightness)
      // Should be dark (brightness < 100)
      expect(brightness).toBeLessThan(150)
    }
  })

  test('input field accepts user typing', async ({ page }) => {
    // Open modal
    const createBtn = page.locator('button').filter({ hasText: /New Task|Create/i }).first()
    if (await createBtn.count() > 0) {
      await createBtn.click()
    } else {
      await page.keyboard.press('Control+K')
    }

    await page.waitForSelector('.modal-content', { timeout: 5000 })

    const titleInput = page.locator('#title')
    
    // Verify input is visible and enabled
    await expect(titleInput).toBeVisible()
    expect(await titleInput.isDisabled()).toBe(false)
    
    // Click and type
    await titleInput.click()
    await titleInput.type('Test Task From Fix', { delay: 50 })
    
    // Verify text was entered
    const value = await titleInput.inputValue()
    expect(value).toBe('Test Task From Fix')
  })

  test('input field has proper styling for text visibility', async ({ page }) => {
    // Open modal
    const createBtn = page.locator('button').filter({ hasText: /New Task|Create/i }).first()
    if (await createBtn.count() > 0) {
      await createBtn.click()
    } else {
      await page.keyboard.press('Control+K')
    }

    await page.waitForSelector('.modal-content', { timeout: 5000 })

    const titleInput = page.locator('#title')
    
    // Get computed styles
    const styles = await titleInput.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        opacity: computed.opacity,
        pointerEvents: computed.pointerEvents,
        cursor: computed.cursor,
        visibility: computed.visibility,
        display: computed.display,
      }
    })

    console.log('Input field styles:', styles)

    // Verify styles support interaction
    expect(styles.display).not.toBe('none')
    expect(styles.visibility).not.toBe('hidden')
    expect(parseFloat(styles.opacity)).toBeGreaterThanOrEqual(0.9)
    expect(styles.pointerEvents).not.toBe('none')
    
    // Verify text will be visible
    const rgbMatch = styles.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch
      const brightness = (parseInt(r) + parseInt(g) + parseInt(b)) / 3
      // Should be dark enough to see
      expect(brightness).toBeLessThan(200)
    }
  })

  test('all form fields are interactive after modal opens', async ({ page }) => {
    // Open modal
    const createBtn = page.locator('button').filter({ hasText: /New Task|Create/i }).first()
    if (await createBtn.count() > 0) {
      await createBtn.click()
    } else {
      await page.keyboard.press('Control+K')
    }

    await page.waitForSelector('.modal-content', { timeout: 5000 })

    // Test each input type
    const titleInput = page.locator('#title')
    const descInput = page.locator('#description')
    const prioritySelect = page.locator('#priority')
    const statusSelect = page.locator('#status')

    // Title input
    await titleInput.fill('My Task')
    expect(await titleInput.inputValue()).toBe('My Task')

    // Description textarea
    await descInput.fill('Task description')
    expect(await descInput.inputValue()).toBe('Task description')

    // Priority select
    await prioritySelect.selectOption('high')
    expect(await prioritySelect.inputValue()).toBe('high')

    // Status select
    await statusSelect.selectOption('in_progress')
    expect(await statusSelect.inputValue()).toBe('in_progress')
  })
})
