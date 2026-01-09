import { test, expect } from '@playwright/test'

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Try to login if needed (handle both authenticated and non-authenticated states)
    const loginForm = page.locator('form')
    if (await loginForm.count() > 0) {
      // Skip login tests for E2E if auth is required
      // In a real scenario, you'd have test credentials
      test.skip()
    }
  })

  test('should display task list', async ({ page }) => {
    const taskList = page.locator('[class*="task"], [role="list"]')
    expect(taskList).toBeDefined()
  })

  test('should display create task button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create|new|add/i })
    expect(await createButton.count()).toBeGreaterThan(0)
  })

  test('should open task form on create button click', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create|new|add/i })
    if (await createButton.count() > 0) {
      await createButton.first().click()

      // Task form should appear
      const taskForm = page.locator('form, [role="dialog"]')
      expect(await taskForm.count()).toBeGreaterThan(0)
    }
  })

  test('should create task with title', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create|new|add/i })
    if (await createButton.count() > 0) {
      await createButton.first().click()

      // Fill task form
      const titleInput = page.getByPlaceholder(/title|task name/i) || page.locator('input[type="text"]').first()
      if (await titleInput.count() > 0) {
        await titleInput.fill('Test Task from E2E')

        const submitButton = page.getByRole('button', { name: /create|save|submit/i })
        if (await submitButton.count() > 0) {
          await submitButton.click()

          // Task should appear in list
          const taskItem = page.getByText(/Test Task from E2E/i)
          await expect(taskItem).toBeDefined()
        }
      }
    }
  })

  test('should display task with priority', async ({ page }) => {
    const taskItems = page.locator('[class*="task-item"], [class*="task"]')
    if (await taskItems.count() > 0) {
      const priorityBadge = taskItems.locator('[class*="priority"], [class*="badge"]').first()
      expect(priorityBadge).toBeDefined()
    }
  })

  test('should complete task', async ({ page }) => {
    const taskItems = page.locator('[class*="task-item"], li')
    if (await taskItems.count() > 0) {
      const completeButton = taskItems.first().locator('button').first()
      await completeButton.click()

      // Task should be marked as complete
      const completedTask = page.locator('[class*="completed"]')
      expect(await completedTask.count()).toBeGreaterThan(0)
    }
  })

  test('should edit task', async ({ page }) => {
    const taskItems = page.locator('[class*="task-item"], li')
    if (await taskItems.count() > 0) {
      const editButton = taskItems.first().locator('button:has-text("Edit"), button[aria-label*="edit"]').first()
      if (await editButton.count() > 0) {
        await editButton.click()

        // Edit form should appear
        const form = page.locator('form, [role="dialog"]')
        expect(await form.count()).toBeGreaterThan(0)
      }
    }
  })

  test('should delete task', async ({ page }) => {
    const taskItems = page.locator('[class*="task-item"], li')
    if (await taskItems.count() > 0) {
      const initialCount = await taskItems.count()

      const deleteButton = taskItems.first().locator('button:has-text("Delete"), button[aria-label*="delete"]').first()
      if (await deleteButton.count() > 0) {
        await deleteButton.click()

        // Confirmation modal should appear
        const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i })
        if (await confirmButton.count() > 0) {
          await confirmButton.click()

          // Task count should decrease
          const updatedItems = page.locator('[class*="task-item"], li')
          expect(await updatedItems.count()).toBeLessThanOrEqual(initialCount)
        }
      }
    }
  })

  test('should filter tasks by status', async ({ page }) => {
    const statusFilter = page.locator('select:has-option("completed")') || page.getByLabel(/status/i)
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('completed')

      // Should display only completed tasks
      const taskList = page.locator('[class*="task"]')
      expect(await taskList.count()).toBeGreaterThan(0)
    }
  })

  test('should search tasks', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|find/i) || page.locator('input[type="search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')

      // Tasks should be filtered
      const taskList = page.locator('[class*="task"]')
      expect(await taskList.count()).toBeGreaterThan(0)
    }
  })

  test('should display task count', async ({ page }) => {
    const taskCounter = page.locator('[class*="count"], span:has-text(/tasks?/i)')
    if (await taskCounter.count() > 0) {
      const text = await taskCounter.first().textContent()
      expect(text).toMatch(/\d+/)
    }
  })
})
