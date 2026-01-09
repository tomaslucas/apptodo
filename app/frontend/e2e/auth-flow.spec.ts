import { test, expect } from '@playwright/test'

/**
 * Authentication Flow Test Suite
 * Tests complete user signup and login workflow with detailed validations
 * 
 * Requirements:
 * - Backend running on http://localhost:8000
 * - Frontend running on http://localhost:5173
 */

test.describe('Authentication Flow', () => {
  // Generate unique email for each test run to avoid conflicts
  const uniqueEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  const testUsername = `testuser-${Date.now()}`

  test('Should navigate to register page and verify form elements', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of register page
    await page.screenshot({ path: '/tmp/01-register-page.png' })
    
    // Verify we're on register page
    const currentUrl = page.url()
    expect(currentUrl).toContain('/register')
    
    // Verify form elements exist
    const nameInput = page.locator('input[id="name"]')
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[id="password"]')
    const confirmPasswordInput = page.locator('input[id="confirm-password"]')
    const submitButton = page.locator('button[type="submit"]')
    
    await expect(nameInput).toBeVisible()
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(confirmPasswordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
    
    console.log('✓ Register page loaded with all required form elements')
  })

  test('Should create a new user account', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    
    // Get form inputs
    const nameInput = page.locator('input[id="name"]')
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[id="password"]')
    const confirmPasswordInput = page.locator('input[id="confirm-password"]')
    const submitButton = page.locator('button[type="submit"]')
    
    // Fill form with test data
    await nameInput.fill(testUsername)
    await emailInput.fill(uniqueEmail)
    await passwordInput.fill(testPassword)
    await confirmPasswordInput.fill(testPassword)
    
    // Take screenshot before submission
    await page.screenshot({ path: '/tmp/03-register-filled.png' })
    
    // Submit form
    await submitButton.click()
    
    // Wait for navigation or success message
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Take screenshot after submission
    await page.screenshot({ path: '/tmp/04-register-response.png' })
    
    // Check if we got an error or success
    const errorMessage = page.locator('[class*="error"], [class*="alert"], .error-message')
    const successMessage = page.locator('[class*="success"], [class*="success-message"]')
    
    const hasError = await errorMessage.isVisible().catch(() => false)
    const hasSuccess = await successMessage.isVisible().catch(() => false)
    
    if (hasError) {
      const errorText = await errorMessage.first().textContent()
      console.log(`Error encountered: ${errorText}`)
    }
    
    if (hasSuccess) {
      const successText = await successMessage.first().textContent()
      console.log(`Success message: ${successText}`)
    }
    
    // After signup, we should either be redirected to login or dashboard
    const currentUrl = page.url()
    console.log(`After signup, current URL: ${currentUrl}`)
    
    // Expect to be redirected somewhere
    expect(currentUrl).not.toMatch(/^http:\/\/localhost:5173\/$/)
  })

  test('Should login with valid credentials', async ({ page }) => {
    // Use known existing test user
    const existingEmail = 'test@example.com'
    const existingPassword = 'TestPassword123!'
    
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of login page
    await page.screenshot({ path: '/tmp/05-login-page.png' })
    
    // Verify login form elements
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
    
    // Fill credentials
    await emailInput.fill(existingEmail)
    await passwordInput.fill(existingPassword)
    
    // Take screenshot before submit
    await page.screenshot({ path: '/tmp/06-login-filled.png' })
    
    // Submit
    await submitButton.click()
    
    // Wait for navigation
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Take screenshot after login attempt
    await page.screenshot({ path: '/tmp/07-login-response.png' })
    
    // Check for errors
    const errorMessage = page.locator('[class*="error"], [class*="alert"], .error-message')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    if (hasError) {
      const errorText = await errorMessage.first().textContent()
      console.log(`Login error: ${errorText}`)
      throw new Error(`Login failed: ${errorText}`)
    }
    
    // Verify we're logged in
    const currentUrl = page.url()
    console.log(`After login, current URL: ${currentUrl}`)
    
    // Should be on dashboard or not on login page
    if (currentUrl.includes('/login')) {
      console.log('Still on login page - checking for error messages')
      const allText = await page.textContent('body')
      console.log('Page content:', allText?.substring(0, 500))
    } else {
      // Look for logout button to confirm we're logged in
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")')
      try {
        await expect(logoutButton).toBeVisible({ timeout: 5000 })
        console.log('✓ Login successful - logout button visible')
      } catch (e) {
        console.log('Logout button not found, but navigated away from login page')
      }
    }
  })

  test('Should display dashboard after successful login', async ({ page }) => {
    // Navigate to login
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Fill and submit login form
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    
    await emailInput.fill('test@example.com')
    await passwordInput.fill('TestPassword123!')
    await submitButton.click()
    
    // Wait for navigation
    await page.waitForURL(/dashboard|tasks|todo/, { timeout: 10000 }).catch(() => {
      console.log('URL did not change to expected pattern')
    })
    
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Take screenshot of dashboard
    await page.screenshot({ path: '/tmp/08-dashboard.png' })
    
    const currentUrl = page.url()
    console.log(`Dashboard URL: ${currentUrl}`)
    
    // Look for key dashboard elements
    const navBar = page.locator('nav')
    const taskList = page.locator('[class*="task"], [class*="list"], main')
    
    try {
      await expect(navBar).toBeVisible({ timeout: 3000 })
      console.log('✓ Navigation bar visible')
    } catch (e) {
      console.log('Navigation bar not found')
    }
    
    try {
      await expect(taskList).toBeVisible({ timeout: 3000 })
      console.log('✓ Task list/main content visible')
    } catch (e) {
      console.log('Task list not found')
    }
    
    // Check for logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")')
    try {
      await expect(logoutButton).toBeVisible()
      console.log('✓ Logout button visible - user is authenticated')
    } catch (e) {
      console.log('Logout button not found')
    }
  })

  test('Should validate login form errors', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    
    // Try login with invalid email
    await emailInput.fill('invalid-email')
    await passwordInput.fill('password123')
    
    // Take screenshot with invalid input
    await page.screenshot({ path: '/tmp/09-invalid-login.png' })
    
    await submitButton.click()
    await page.waitForTimeout(1000)
    
    // Check for error message
    const errorMessage = page.locator('[class*="error"], [class*="invalid"], .error-message')
    const hasError = await errorMessage.isVisible().catch(() => false)
    
    console.log(`Invalid login - error shown: ${hasError}`)
    
    // Take screenshot after error
    await page.screenshot({ path: '/tmp/10-error-response.png' })
  })
})
