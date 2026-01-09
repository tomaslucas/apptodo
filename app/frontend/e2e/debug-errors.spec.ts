import { test } from '@playwright/test'

test('debug - check for console errors', async ({ page }) => {
  const logs: string[] = []
  const errors: string[] = []
  
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`)
    logs.push(`[${msg.type()}] ${msg.text()}`)
  })
  
  page.on('pageerror', err => {
    console.log(`[ERROR] ${err.message}`)
    errors.push(err.message)
  })
  
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  
  console.log('\n=== LOGS ===')
  logs.forEach(l => console.log(l))
  
  console.log('\n=== ERRORS ===')
  errors.forEach(e => console.log(e))
  
  await page.screenshot({ path: 'screenshots/debug-console-errors.png' })
})
