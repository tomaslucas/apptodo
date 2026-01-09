import { test, expect } from '@playwright/test'

test('debug - see what is on the page', async ({ page }) => {
  await page.goto('/')
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-1-homepage.png' })
  
  // Get page content
  const content = await page.content()
  console.log('Page content length:', content.length)
  
  // Check if we're on login page
  const loginForm = page.locator('form')
  console.log('Form count:', await loginForm.count())
  
  // Get all text on page
  const bodyText = await page.locator('body').textContent()
  console.log('Body text:', bodyText?.substring(0, 200))
  
  // Check for auth state
  const isAuthenticated = page.locator('[class*="authenticated"]')
  console.log('Authenticated class count:', await isAuthenticated.count())
  
  // Check localStorage
  const auth = await page.evaluate(() => localStorage.getItem('auth'))
  console.log('Auth token:', auth ? 'exists' : 'missing')
})
