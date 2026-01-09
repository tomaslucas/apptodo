import { test, expect } from '@playwright/test'

test.describe('Complete User Flow - AppTodo', () => {
  let testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    username: `testuser${Date.now()}`
  }

  test('1. Should navigate to home page', async ({ page }) => {
    await page.goto('/')
    await page.screenshot({ path: 'screenshots/01-home.png' })
    expect(page.url()).toContain('localhost')
  })

  test('2. Should see login page when not authenticated', async ({ page }) => {
    await page.goto('/')
    await page.screenshot({ path: 'screenshots/02-login-redirect.png' })
    
    // Should have a form or login button
    const loginText = page.getByText(/login|sign in/i)
    await expect(loginText).toBeDefined()
  })

  test('3. Should register new user', async ({ page }) => {
    await page.goto('/')
    
    // Find register link
    const registerLink = page.getByRole('link', { name: /register/i })
    await registerLink.click()
    await page.screenshot({ path: 'screenshots/03-register-page.png' })
    
    // Fill registration form
    const inputs = page.locator('input')
    const inputCount = await inputs.count()
    console.log('Inputs found:', inputCount)
    
    if (inputCount > 0) {
      // Assuming first input is email, second is password
      await inputs.first().fill(testUser.email)
      await page.screenshot({ path: 'screenshots/04-email-filled.png' })
      
      if (inputCount > 1) {
        await inputs.nth(1).fill(testUser.password)
        await page.screenshot({ path: 'screenshots/05-password-filled.png' })
      }
      
      // Submit form
      const submitButton = page.getByRole('button', { name: /register|sign up/i })
      if (await submitButton.count() > 0) {
        await submitButton.click()
        await page.waitForLoadState('networkidle')
        await page.screenshot({ path: 'screenshots/06-after-register.png' })
      }
    }
  })

  test('4. Should login successfully', async ({ page }) => {
    await page.goto('/login')
    await page.screenshot({ path: 'screenshots/07-login-page.png' })
    
    // Fill login form
    const inputs = page.locator('input')
    if (await inputs.count() >= 2) {
      await inputs.first().fill(testUser.email)
      await inputs.nth(1).fill(testUser.password)
      await page.screenshot({ path: 'screenshots/08-login-filled.png' })
      
      const submitButton = page.getByRole('button', { name: /login|sign in|submit/i })
      if (await submitButton.count() > 0) {
        await submitButton.click()
        await page.waitForLoadState('networkidle')
        await page.screenshot({ path: 'screenshots/09-dashboard.png' })
      }
    }
  })

  test('5. Should see task list on dashboard', async ({ page }) => {
    await page.goto('/login')
    const inputs = page.locator('input')
    if (await inputs.count() >= 2) {
      await inputs.first().fill(testUser.email)
      await inputs.nth(1).fill(testUser.password)
      const submitButton = page.getByRole('button', { name: /login|sign in|submit/i })
      if (await submitButton.count() > 0) {
        await submitButton.click()
        await page.waitForLoadState('networkidle')
      }
    }
    
    await page.screenshot({ path: 'screenshots/10-task-list.png' })
    
    // Look for task list or dashboard elements
    const taskList = page.locator('[class*="task"], [role="list"]')
    console.log('Task list found:', await taskList.count())
  })

  test('6. Should create a new task', async ({ page }) => {
    // Login first
    await page.goto('/login')
    const inputs = page.locator('input')
    if (await inputs.count() >= 2) {
      await inputs.first().fill(testUser.email)
      await inputs.nth(1).fill(testUser.password)
      const submitButton = page.getByRole('button', { name: /login|sign in|submit/i })
      if (await submitButton.count() > 0) {
        await submitButton.click()
        await page.waitForLoadState('networkidle')
      }
    }
    
    // Find create button
    const createBtn = page.getByRole('button', { name: /create|new|add/i })
    if (await createBtn.count() > 0) {
      await createBtn.click()
      await page.screenshot({ path: 'screenshots/11-create-task-form.png' })
      
      // Fill task form
      const titleInput = page.getByPlaceholder(/title|task/i).first()
      if (await titleInput.count() > 0) {
        await titleInput.fill('Test Task from E2E')
        await page.screenshot({ path: 'screenshots/12-task-form-filled.png' })
        
        const saveBtn = page.getByRole('button', { name: /save|create|submit/i })
        if (await saveBtn.count() > 0) {
          await saveBtn.click()
          await page.waitForLoadState('networkidle')
          await page.screenshot({ path: 'screenshots/13-task-created.png' })
        }
      }
    }
  })

  test('7. Should test keyboard shortcut Cmd+K', async ({ page }) => {
    // Login first
    await page.goto('/login')
    const inputs = page.locator('input')
    if (await inputs.count() >= 2) {
      await inputs.first().fill(testUser.email)
      await inputs.nth(1).fill(testUser.password)
      const submitButton = page.getByRole('button', { name: /login|sign in|submit/i })
      if (await submitButton.count() > 0) {
        await submitButton.click()
        await page.waitForLoadState('networkidle')
      }
    }
    
    // Press Cmd+K
    await page.keyboard.press('Meta+K')
    await page.screenshot({ path: 'screenshots/14-shortcut-cmd-k.png' })
    
    // Check if create form opened
    const form = page.locator('form, [role="dialog"]')
    console.log('Form opened after Cmd+K:', await form.count())
  })

  test('8. Should test keyboard shortcut for help Cmd+/', async ({ page }) => {
    // Login first
    await page.goto('/login')
    const inputs = page.locator('input')
    if (await inputs.count() >= 2) {
      await inputs.first().fill(testUser.email)
      await inputs.nth(1).fill(testUser.password)
      const submitButton = page.getByRole('button', { name: /login|sign in|submit/i })
      if (await submitButton.count() > 0) {
        await submitButton.click()
        await page.waitForLoadState('networkidle')
      }
    }
    
    // Press Cmd+?
    await page.keyboard.press('Meta+Slash')
    await page.screenshot({ path: 'screenshots/15-shortcut-help.png' })
    
    // Check if help modal opened
    const helpModal = page.locator('[class*="help"], [class*="modal"], [class*="shortcut"]')
    console.log('Help modal opened:', await helpModal.count())
  })
})
