import { test, expect } from '@playwright/test'

test('simple - just see what loads at /login', async ({ page }) => {
  await page.goto('/login')
  
  // Wait for content
  await page.waitForLoadState('networkidle')
  
  // Screenshot
  await page.screenshot({ path: 'screenshots/simple-login-page.png' })
  
  // Get ALL content
  const html = await page.content()
  console.log('HTML length:', html.length)
  
  // Look for form tags
  const hasForm = html.includes('<form')
  console.log('Has form tag:', hasForm)
  
  // Look for email input
  const hasEmail = html.includes('email')
  console.log('Has email:', hasEmail)
  
  // Get all text
  const bodyText = await page.locator('body').textContent()
  console.log('Body text:', bodyText?.substring(0, 300))
  
  // Try to find inputs
  const inputs = page.locator('input')
  console.log('Input count:', await inputs.count())
  
  // Try to find form elements
  const forms = page.locator('form')
  console.log('Form count:', await forms.count())
})
