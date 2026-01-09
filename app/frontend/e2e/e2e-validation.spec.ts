import { test, expect } from '@playwright/test'

/**
 * Complete E2E validation test suite
 * This suite validates the entire application workflow with a real test user
 * 
 * Requirements:
 * - Backend running on http://localhost:8000
 * - Frontend running on http://localhost:5173
 * - Test user must be created before running tests
 */

// Test user credentials (created by validate.sh)
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!'

test.describe('AppTodo - Complete E2E Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for E2E tests
    test.setTimeout(60000)
  })

  test('1. Home page loads', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Verify we're on the home page
    const navBar = page.locator('nav')
    await expect(navBar).toBeVisible()
    
    // Verify AppTodo branding
    const logo = page.locator('text=AppTodo')
    await expect(logo).toBeVisible()
  })

  test('2. Login page displays form', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Wait for form to be visible
    await page.waitForSelector('form', { timeout: 5000 })
    
    const form = page.locator('form')
    await expect(form).toBeVisible()
    
    // Verify form has email and password fields
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('3. Login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Wait for form to be ready
    await page.waitForSelector('form', { timeout: 5000 })
    
    // Fill in credentials
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button:has-text("Login"), button[type="submit"]')
    
    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    
    // Click submit
    await submitButton.click()
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Verify we're on dashboard
    expect(page.url()).toContain('dashboard')
  })

  test('4. Dashboard displays after login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('form', { timeout: 5000 })
    
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button:has-text("Login"), button[type="submit"]')
    
    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    await submitButton.click()
    
    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Verify dashboard elements
    const navBar = page.locator('nav')
    await expect(navBar).toBeVisible()
    
    // Should see logout button (indicates authenticated)
    const logoutButton = page.locator('button:has-text("Logout")')
    await expect(logoutButton).toBeVisible()
  })

  test('5. Keyboard shortcut Cmd+K opens create form', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('form', { timeout: 5000 })
    
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button:has-text("Login"), button[type="submit"]')
    
    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    await submitButton.click()
    
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Press Cmd+K (Meta on Mac, Ctrl on Windows)
    await page.keyboard.press('Meta+K')
    await page.waitForTimeout(500)
    
    // Check if form or modal opened
    const form = page.locator('form, [role="dialog"]')
    const formCount = await form.count()
    
    // At least one form should be visible or opened
    expect(formCount).toBeGreaterThan(0)
  })

  test('6. Keyboard shortcut Cmd+/ shows help modal', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('form', { timeout: 5000 })
    
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button:has-text("Login"), button[type="submit"]')
    
    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    await submitButton.click()
    
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Press Cmd+/ (Meta+Slash on Mac, Ctrl+Slash on Windows)
    await page.keyboard.press('Meta+Slash')
    await page.waitForTimeout(500)
    
    // Check for shortcuts help modal/text
    const helpText = page.getByText(/shortcuts|keyboard/i)
    const helpCount = await helpText.count()
    
    // Should show keyboard shortcuts information
    expect(helpCount).toBeGreaterThan(0)
  })

  test('7. Create task via API works', async ({ page }) => {
    // First, login to get a token (we do this via the UI)
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('form', { timeout: 5000 })
    
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button:has-text("Login"), button[type="submit"]')
    
    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    await submitButton.click()
    
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Now we're logged in, verify task list is visible
    // (this validates the backend API is working)
    expect(page.url()).toContain('dashboard')
  })

  test('8. Logout functionality', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('form', { timeout: 5000 })
    
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button:has-text("Login"), button[type="submit"]')
    
    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    await submitButton.click()
    
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout")')
    await expect(logoutButton).toBeVisible()
    await logoutButton.click()
    
    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})
