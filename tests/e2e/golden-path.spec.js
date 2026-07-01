import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('add athlete, start swim, log a feed, check tabs, reload persists', async ({ page }) => {
  await expect(page.locator('#no-athletes-ui')).toBeVisible();

  await page.fill('#new-athlete-name', 'Alice');
  await page.fill('#new-athlete-km', '10');
  await page.click('.btn-add-athlete');
  await expect(page.locator('#no-athletes-ui')).toBeHidden();

  await page.click('#start-swim-btn');
  await expect(page.locator('#elapsed-display')).not.toHaveText('—');

  await page.click('.check-opt[data-id="drink"]');
  await page.click('.adj-btn[onclick="adjustGel(1)"]');
  await page.click('.cond-btn[data-val="4"]');
  await page.fill('#manual-distance', '500');
  await page.fill('#feed-notes', 'Feeling good');
  await page.click('.btn-save');

  await expect(page.locator('.feed-row')).toHaveCount(1);
  await expect(page.locator('#stat-feeds')).toHaveText('1');

  await page.click('#nav-timeline');
  await expect(page.locator('#panel-timeline')).toBeVisible();
  await page.click('#nav-checklist');
  await expect(page.locator('#panel-checklist')).toBeVisible();
  await page.click('#nav-plan');
  await expect(page.locator('#panel-plan')).toContainText('Swim Plan');
  await page.click('#nav-feed');

  await page.reload();
  await expect(page.locator('.feed-row')).toHaveCount(1);
  await expect(page.locator('.swipe-name')).toContainText('Alice');
});
