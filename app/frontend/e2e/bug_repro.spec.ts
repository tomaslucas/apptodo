import { test, expect } from '@playwright/test';

test.describe('Bug Reproduction', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    // Generate a unique user for each test run to be autonomous
    const testId = Date.now();
    const email = `test_${testId}@example.com`;
    const password = 'Password123!';

    // Go to registration
    await page.goto('/register');
    await page.fill('#name', `user_${testId}`);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#confirm-password', password);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or login
    await page.waitForURL(url => url.pathname === '/dashboard' || url.pathname === '/login');
    
    // If redirected to login, log in
    if (page.url().includes('/login')) {
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    }
  });

  test('Bug 1: Category persistence', async ({ page }) => {
    // Open Create Task Modal
    await page.click('.btn-create-task');
    
    // Fill form
    await page.fill('#title', 'Task with Category');
    await page.selectOption('#priority', 'media');
    
    // Create new category
    const catName = 'ReproCat_' + Date.now();
    await page.fill('.category-input', catName);
    await page.click('.btn-add-category');
    
    // Check for errors
    const errorMsg = page.locator('.error-message');
    if (await errorMsg.isVisible()) {
      console.log('Error creating category:', await errorMsg.textContent());
    }

    // Wait for category tag to appear in form (indicating selection)
    await expect(page.locator('.category-tag', { hasText: catName })).toBeVisible();
    
    // Save task
    await page.click('.btn-submit');
    
    // Expect modal to close
    await expect(page.locator('.modal-content')).toBeHidden();
    
    // Verify task is in list
    const taskItem = page.locator('.task-item', { hasText: 'Task with Category' });
    await expect(taskItem).toBeVisible();
    
    // BUG ASSERTION: Category tag should be visible in the list item
    // This is expected to FAIL currently
    await expect(taskItem.locator('.category-badge', { hasText: catName })).toBeVisible({ timeout: 5000 });
  });

  test('Bug 2: Batch Priority Update', async ({ page }) => {
    // Create a task first
    await page.click('.btn-create-task');
    await page.fill('#title', 'Batch Task');
    await page.selectOption('#priority', 'baja');
    await page.click('.btn-submit');
    
    // Select the task
    const taskItem = page.locator('.task-item', { hasText: 'Batch Task' });
    await taskItem.locator('.task-select-checkbox').check();
    
    // Check batch bar appears
    await expect(page.locator('.batch-actions-bar')).toBeVisible();
    
    // Click Priority -> High
    await page.click('.btn-batch-priority');
    await page.click('.priority-high'); // This sends 'high' instead of 'alta'
    
    // BUG ASSERTION: Priority badge should change to High
    // This is expected to FAIL currently
    await expect(taskItem.locator('.priority-badge.priority-alta')).toBeVisible({ timeout: 5000 });
  });
});
