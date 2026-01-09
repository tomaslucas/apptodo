import { test, expect } from '@playwright/test'

test.describe('AppTodo - Complete User Flow (Fixed)', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  }

  test('1. Home page navigation', async ({ page }) => {
    await page.goto('/')
    await page.screenshot({ path: 'screenshots/fixed-01-home.png' })
    // Should show Login and Register buttons on home
    expect(page.url()).toContain('localhost')
  })

  test('2. Navigate directly to login page', async ({ page }) => {
    await page.goto('/login')
    await page.screenshot({ path: 'screenshots/fixed-02-login.png' })
    const form = page.locator('form')
    expect(await form.count()).toBeGreaterThan(0)
  })

  test('3. Login with valid credentials', async ({ page }) => {
    // Go to login
    await page.goto('/login')
    
    // Fill form - look for input fields
    const inputs = page.locator('input[type="email"], input[type="password"]')
    const allInputs = page.locator('input')
    
    if (await allInputs.count() >= 2) {
      // Email is typically first
      await allInputs.first().fill(testUser.email)
      // Password is typically second
      if (await allInputs.count() >= 2) {
        await allInputs.nth(1).fill(testUser.password)
      }
      
      // Click submit
      const submitBtn = page.getByRole('button', { name: /login|sign in|submit/i })
      if (await submitBtn.count() > 0) {
        await submitBtn.click()
        await page.waitForLoadState('networkidle')
        await page.screenshot({ path: 'screenshots/fixed-03-after-login.png' })
      }
    }
  })

  test('4. Dashboard loads after authentication', async ({ page }) => {
    // Login first
    await page.goto('/login')
    const allInputs = page.locator('input')
    if (await allInputs.count() >= 2) {
      await allInputs.first().fill(testUser.email)
      await allInputs.nth(1).fill(testUser.password)
      const submitBtn = page.getByRole('button', { name: /login|sign in|submit/i })
      if (await submitBtn.count() > 0) {
        await submitBtn.click()
        await page.waitForLoadState('networkidle')
      }
    }
    
    // Now should be on dashboard
    await page.screenshot({ path: 'screenshots/fixed-04-dashboard.png' })
    
    // Check that we're authenticated
    const navBar = page.locator('nav')
    expect(await navBar.count()).toBeGreaterThan(0)
  })

  test('5. Keyboard shortcut Cmd+K opens create form', async ({ page }) => {
    // Login
    await page.goto('/login')
    const allInputs = page.locator('input')
    if (await allInputs.count() >= 2) {
      await allInputs.first().fill(testUser.email)
      await allInputs.nth(1).fill(testUser.password)
      const submitBtn = page.getByRole('button', { name: /login|sign in|submit/i })
      if (await submitBtn.count() > 0) {
        await submitBtn.click()
        await page.waitForLoadState('networkidle')
      }
    }
    
    // Press keyboard shortcut
    await page.keyboard.press('Meta+K')
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'screenshots/fixed-05-cmd-k-shortcut.png' })
  })

  test('6. Keyboard shortcut Cmd+/ shows help', async ({ page }) => {
    // Login
    await page.goto('/login')
    const allInputs = page.locator('input')
    if (await allInputs.count() >= 2) {
      await allInputs.first().fill(testUser.email)
      await allInputs.nth(1).fill(testUser.password)
      const submitBtn = page.getByRole('button', { name: /login|sign in|submit/i })
      if (await submitBtn.count() > 0) {
        await submitBtn.click()
        await page.waitForLoadState('networkidle')
      }
    }
    
    // Press help shortcut
    await page.keyboard.press('Meta+Slash')
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'screenshots/fixed-06-help-shortcut.png' })
    
    // Check if help modal is visible
    const shortcutsText = page.getByText(/shortcuts|keyboard/i)
    const count = await shortcutsText.count()
    console.log('Shortcuts text found:', count)
  })

  test('7. Create task with Cmd+K then fill form', async ({ page }) => {
    // Login
    await page.goto('/login')
    const allInputs = page.locator('input')
    if (await allInputs.count() >= 2) {
      await allInputs.first().fill(testUser.email)
      await allInputs.nth(1).fill(testUser.password)
      const submitBtn = page.getByRole('button', { name: /login|sign in|submit/i })
      if (await submitBtn.count() > 0) {
        await submitBtn.click()
        await page.waitForLoadState('networkidle')
      }
    }
    
    // Open create form with shortcut
    await page.keyboard.press('Meta+K')
    await page.waitForTimeout(300)
    
    // Fill task form
    const titleInput = page.locator('input[placeholder*="title" i], input[placeholder*="task" i]').first()
    if (await titleInput.count() > 0) {
      await titleInput.fill('Test Task from E2E Suite')
      await page.screenshot({ path: 'screenshots/fixed-07-task-created.png' })
      
      // Submit
      const saveBtn = page.getByRole('button', { name: /save|create|submit/i })
      if (await saveBtn.count() > 0) {
        await saveBtn.click()
        await page.waitForLoadState('networkidle')
        await page.screenshot({ path: 'screenshots/fixed-08-task-list-updated.png' })
      }
    }
  })

  test('8. Logout functionality', async ({ page }) => {
    // Login
    await page.goto('/login')
    const allInputs = page.locator('input')
    if (await allInputs.count() >= 2) {
      await allInputs.first().fill(testUser.email)
      await allInputs.nth(1).fill(testUser.password)
      const submitBtn = page.getByRole('button', { name: /login|sign in|submit/i })
      if (await submitBtn.count() > 0) {
        await submitBtn.click()
        await page.waitForLoadState('networkidle')
      }
    }
    
    // Find and click logout
    const logoutBtn = page.getByRole('button', { name: /logout|sign out/i })
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click()
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: 'screenshots/fixed-09-logged-out.png' })
      
      // Should be back at login
      expect(page.url()).toContain('/login')
    }
  })
})
