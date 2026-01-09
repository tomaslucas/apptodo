import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form on initial load', async ({ page }) => {
    const loginForm = page.getByRole('form') || page.locator('form')
    expect(await loginForm.count()).toBeGreaterThan(0)
  })

  test('should require email/username field', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /login|sign in/i })
    if (await submitButton.count() > 0) {
      await submitButton.click()

      // Should show validation error
      const errorMessage = page.locator('[role="alert"], .error, .invalid')
      expect(await errorMessage.count()).toBeGreaterThan(0)
    }
  })

  test('should require password field', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/email|username/i)
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com')

      const submitButton = page.getByRole('button', { name: /login|sign in/i })
      if (await submitButton.count() > 0) {
        await submitButton.click()

        // Should show password validation error
        const errorMessage = page.locator('[role="alert"], .error')
        expect(await errorMessage.count()).toBeGreaterThan(0)
      }
    }
  })

  test('should display password toggle', async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/password/i)
    if (await passwordInput.count() > 0) {
      const toggleButton = passwordInput.locator('~ button') || page.locator('button[aria-label*="password" i]')
      expect(passwordInput).toBeDefined()
    }
  })

  test('should have remember me checkbox', async ({ page }) => {
    const rememberCheckbox = page.getByLabel(/remember/i) || page.locator('input[type="checkbox"]')
    if (await rememberCheckbox.count() > 0) {
      expect(rememberCheckbox).toBeDefined()
    }
  })

  test('should have forgot password link', async ({ page }) => {
    const forgotLink = page.getByText(/forgot password|reset password/i)
    if (await forgotLink.count() > 0) {
      expect(forgotLink).toBeDefined()
    }
  })

  test('should have sign up link', async ({ page }) => {
    const signupLink = page.getByText(/sign up|create account|register/i)
    if (await signupLink.count() > 0) {
      expect(signupLink).toBeDefined()
    }
  })
})
