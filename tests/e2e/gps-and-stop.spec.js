import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('GPS auto-drop on save', () => {
  test.use({ permissions: ['geolocation'], geolocation: { latitude: 40.7, longitude: -74.0, accuracy: 15 } });

  test('saving a feed drops the GPS pin itself, no separate step needed', async ({ page }) => {
    await page.fill('#new-athlete-name', 'Alice');
    await page.click('.btn-add-athlete');
    await page.click('#start-swim-btn');

    await expect(page.locator('#gps-status')).toContainText('automatically');
    await page.click('.cond-btn[data-val="4"]');
    await page.click('.btn-save');

    await expect(page.locator('#gps-status')).toContainText('Pin dropped', { timeout: 5000 });
    await expect(page.locator('.feed-row')).toHaveCount(1);
  });
});

test.describe('GPS denied falls back cleanly', () => {
  test.use({ permissions: [] });

  test('denied geolocation still saves the feed without crashing', async ({ page }) => {
    await page.fill('#new-athlete-name', 'Alice');
    await page.click('.btn-add-athlete');
    await page.click('#start-swim-btn');

    await page.click('.cond-btn[data-val="4"]');
    await page.fill('#manual-distance', '250');
    await page.click('.btn-save');

    await expect(page.locator('#gps-status')).toContainText('manual distance', { timeout: 5000 });
    await expect(page.locator('.feed-row')).toHaveCount(1);
  });
});

test('stopping the swim blocks new entries but keeps the feed log, stats, and export visible', async ({ page }) => {
  await page.fill('#new-athlete-name', 'Alice');
  await page.click('.btn-add-athlete');
  await page.click('#start-swim-btn');

  await page.click('.cond-btn[data-val="4"]');
  await page.fill('#manual-distance', '400');
  await page.click('.btn-save');
  await expect(page.locator('.feed-row')).toHaveCount(1);

  page.once('dialog', d => d.accept());
  await page.click('#stop-swim-btn');

  await expect(page.locator('#feed-area')).toBeVisible();
  await expect(page.locator('.feed-row')).toHaveCount(1);
  await expect(page.locator('#feed-stats')).toBeVisible();
  await expect(page.locator('#export-btn')).toBeVisible();
  await expect(page.locator('#feed-form-container')).toBeHidden();
  await expect(page.locator('#feed-paused-msg')).toBeVisible();

  await page.click('text=Resume');
  await expect(page.locator('#feed-form-container')).toBeVisible();
  await expect(page.locator('.feed-row')).toHaveCount(1);
});

test('stopping the swim freezes the elapsed clock and next-feed countdown', async ({ page }) => {
  await page.fill('#new-athlete-name', 'Alice');
  await page.click('.btn-add-athlete');
  await page.click('#start-swim-btn');
  await page.waitForTimeout(1200); // let the clock tick at least once past 0:00:00

  page.once('dialog', d => d.accept());
  await page.click('#stop-swim-btn');

  const elapsedAtStop = await page.locator('#elapsed-display').textContent();
  const nextFeedAtStop = await page.locator('#next-feed-display').textContent();

  await page.waitForTimeout(2500); // more than two tick intervals

  await expect(page.locator('#elapsed-display')).toHaveText(elapsedAtStop);
  await expect(page.locator('#next-feed-display')).toHaveText(nextFeedAtStop);
});
