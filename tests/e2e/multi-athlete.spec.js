import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('a second athlete can be added and swiped to after the first', async ({ page }) => {
  await page.fill('#new-athlete-name', 'Alice');
  await page.fill('#new-athlete-km', '10');
  await page.click('.btn-add-athlete');
  await page.click('#start-swim-btn');

  const toggleBtn = page.locator('#add-athlete-toggle-btn');
  await expect(toggleBtn).toBeVisible();
  await expect(page.locator('#no-athletes-ui')).toBeHidden();

  await toggleBtn.click();
  await expect(page.locator('#no-athletes-ui')).toBeVisible();
  await expect(toggleBtn).toHaveText(/Cancel/);

  await page.fill('#new-athlete-name', 'Bob');
  await page.fill('#new-athlete-km', '33.3');
  await page.click('.btn-add-athlete');

  await expect(page.locator('#no-athletes-ui')).toBeHidden();
  await expect(page.locator('.swipe-name')).toContainText('Bob');
  await expect(page.locator('.swipe-dot')).toHaveCount(2);
  await expect(page.locator('.swipe-arrow').first()).toBeEnabled();

  await page.locator('.swipe-arrow').first().click();
  await expect(page.locator('.swipe-name')).toContainText('Alice');
});
