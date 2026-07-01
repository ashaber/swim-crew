import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('Clear All Data also resets checklist, timeline, and notes -- not just feeds/athletes', async ({ page }) => {
  await page.fill('#new-athlete-name', 'Alice');
  await page.click('.btn-add-athlete');
  await page.click('#start-swim-btn');

  // Dirty up checklist, notes, and timeline state.
  await page.click('#nav-checklist');
  await page.locator('.checklist-item').first().click();
  await expect(page.locator('#cl-done')).toHaveText('1');

  await page.click('#nav-feed');
  await page.fill('#swim-notes', 'left this behind from a previous swim');

  await page.click('#nav-timeline');
  await page.locator('.tl-item').first().click();

  // Stop the swim to reveal Clear All Data.
  await page.click('#nav-feed');
  page.once('dialog', d => d.accept());
  await page.click('#stop-swim-btn');

  page.once('dialog', d => d.accept());
  await page.click('.btn-clear-data');

  await page.click('#nav-checklist');
  await expect(page.locator('#cl-done')).toHaveText('0');

  await page.click('#nav-feed');
  await expect(page.locator('#swim-notes')).toHaveValue('');

  await page.click('#nav-timeline');
  await expect(page.locator('.tl-item.done')).toHaveCount(0);
});
