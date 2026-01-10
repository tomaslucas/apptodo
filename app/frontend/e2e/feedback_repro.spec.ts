import { test, expect } from '@playwright/test';

test.describe('User Feedback Reproduction', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    // Autonomous user setup
    const testId = Date.now();
    const email = `feedback_${testId}@example.com`;
    const password = 'Password123!';

    await page.goto('/register');
    await page.fill('#name', `user_${testId}`);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.fill('#confirm-password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => url.pathname === '/dashboard' || url.pathname === '/login');
    
    if (page.url().includes('/login')) {
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    }
  });

  test('Issue 1 & 3: Multiple categories and Edit persistence', async ({ page }) => {
    // Create categories first
    await page.click('.btn-create-task');
    
    const cat1 = 'Cat1_' + Date.now();
    const cat2 = 'Cat2_' + Date.now();
    
    // Create Cat 1
    await page.fill('.category-input', cat1);
    await page.click('.btn-add-category');
    
    // Create Cat 2
    await page.fill('.category-input', cat2);
    await page.click('.btn-add-category');
    
    // Verify both are selected in form (tags visible)
    await expect(page.locator('.category-tag', { hasText: cat1 })).toBeVisible();
    await expect(page.locator('.category-tag', { hasText: cat2 })).toBeVisible();
    
    // Save task
    await page.fill('#title', 'Multi Category Task');
    await page.click('.btn-submit');
    
    // Verify in list
    const taskItem = page.locator('.task-item', { hasText: 'Multi Category Task' });
    await expect(taskItem).toBeVisible();
    
    // Check if BOTH categories are visible on the card
    await expect(taskItem.locator('.category-badge', { hasText: cat1 })).toBeVisible();
    await expect(taskItem.locator('.category-badge', { hasText: cat2 })).toBeVisible();
    
    // Edit task to add Cat 3
    await taskItem.locator('.btn-edit').click();
    
    const cat3 = 'Cat3_' + Date.now();
    await page.fill('.category-input', cat3);
    await page.click('.btn-add-category');
    
    // Save edit
    await page.click('.btn-submit');
    
    // Verify Cat 3 is now on the card too
    await expect(taskItem.locator('.category-badge', { hasText: cat3 })).toBeVisible();
  });

  test('Issue 2: Add Category button on list', async ({ page }) => {
    // Create task
    await page.click('.btn-create-task');
    await page.fill('#title', 'Button Test Task');
    await page.click('.btn-submit');
    
    const taskItem = page.locator('.task-item', { hasText: 'Button Test Task' });
    
    // Click inline Add Category button
    // User says "does nothing"
    await taskItem.locator('.btn-add-category').click();
    
    // Expect some modal to open
    // Ideally we check for a specific modal selector. 
    // If the user says it does nothing, this might timeout or fail to find a modal.
    await expect(page.locator('.modal-content')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Category to Task' })).toBeVisible();
  });

  test('Issue 4 & 5: Filters and Contrast', async ({ page }) => {
    // Create a High priority task
    await page.click('.btn-create-task');
    await page.fill('#title', 'High Priority Task');
    await page.selectOption('#priority', 'alta');
    await page.click('.btn-submit');
    
    // Create a Low priority task
    await page.click('.btn-create-task');
    await page.fill('#title', 'Low Priority Task');
    await page.selectOption('#priority', 'baja');
    await page.click('.btn-submit');
    
    // Filter by High Priority
    // User says "contrast is bad", so we might have trouble finding it if it's hidden or white-on-white, 
    // but Playwright finds elements by DOM, not vision (unless we use screenshots).
    // We will test functionality first.
    
    // Assuming there is a filter bar
    await page.selectOption('select#priority-filter', 'alta');
    
    // Verify only High task is visible
    await expect(page.locator('.task-item', { hasText: 'High Priority Task' })).toBeVisible();
    await expect(page.locator('.task-item', { hasText: 'Low Priority Task' })).toBeHidden();
  });
});
