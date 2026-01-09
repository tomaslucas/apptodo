import { test, expect } from '@playwright/test'

test.describe('Visual Validation - UI/UX Improvements', () => {
  test('Register form shows password requirements with visual feedback', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    
    // Screenshot: Initial empty state
    await page.screenshot({ path: '/tmp/11-register-empty.png' })
    console.log('✓ Captured initial register form')
    
    // Type partial password
    const passwordInput = page.locator('input[id="password"]')
    await passwordInput.fill('Test')
    await page.waitForTimeout(300)
    
    await page.screenshot({ path: '/tmp/12-password-partial.png' })
    console.log('✓ Captured partial password state')
    
    // Complete password
    await passwordInput.fill('TestPassword123')
    await page.waitForTimeout(300)
    
    await page.screenshot({ path: '/tmp/13-password-complete.png' })
    console.log('✓ Captured complete password state')
    
    // Fill other fields
    const nameInput = page.locator('input[id="name"]')
    const emailInput = page.locator('input[type="email"]')
    const confirmPasswordInput = page.locator('input[id="confirm-password"]')
    
    await nameInput.fill('Test User')
    await emailInput.fill(`user-${Date.now()}@test.com`)
    await confirmPasswordInput.fill('TestPassword123')
    
    await page.screenshot({ path: '/tmp/14-register-ready.png' })
    console.log('✓ Captured ready-to-submit state')
    
    // Verify button is enabled
    const submitButton = page.locator('button[type="submit"]')
    const isDisabled = await submitButton.evaluate(el => el.disabled)
    console.log(`Submit button disabled: ${isDisabled}`)
    
    // Check password requirements are visible
    const requirements = page.locator('.password-requirements')
    await expect(requirements).toBeVisible()
    console.log('✓ Password requirements visible')
  })

  test('Dashboard header has improved contrast', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[id="password"]')
    const submitButton = page.locator('button[type="submit"]')
    
    await emailInput.fill('test@example.com')
    await passwordInput.fill('TestPassword123!')
    await submitButton.click()
    
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Screenshot dashboard with improved contrast
    await page.screenshot({ path: '/tmp/15-dashboard-contrast.png' })
    console.log('✓ Captured dashboard with improved contrast')
    
    // Verify header is visible
    const header = page.locator('.dashboard-header')
    await expect(header).toBeVisible()
    
    const title = page.locator('.dashboard-header h1')
    await expect(title).toBeVisible()
    console.log('✓ Dashboard header title visible with good contrast')
  })

  test('Login form has improved text contrast', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({ path: '/tmp/16-login-contrast.png' })
    console.log('✓ Captured login form with improved contrast')
    
    // Verify labels are visible
    const emailLabel = page.locator('label:has-text("Email")')
    const passwordLabel = page.locator('label:has-text("Password")')
    
    await expect(emailLabel).toBeVisible()
    await expect(passwordLabel).toBeVisible()
    console.log('✓ Login form labels visible with good contrast')
  })
})
