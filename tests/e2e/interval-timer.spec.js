import { test, expect } from '@playwright/test';

test.use({ permissions: ['geolocation'], geolocation: { latitude: 40.7, longitude: -74.0, accuracy: 15 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('an early feed increments the interval and restarts the countdown from that moment', async ({ page }) => {
  await page.fill('#new-athlete-name', 'Alice');
  await page.click('.btn-add-athlete');
  await page.click('#start-swim-btn');
  await expect(page.locator('#interval-display')).toHaveText('#1');

  // Simulate being 22 minutes into the race (an early feed).
  await page.evaluate(() => {
    localStorage.setItem('swim_crew_race_start', String(Date.now() - 22 * 60 * 1000));
  });
  await page.waitForTimeout(1200); // let the 1s tick pick up the backdated start

  const beforeFeed = await page.locator('#next-feed-display').textContent();
  const [minBefore] = beforeFeed.split(':').map(Number);
  expect(minBefore).toBeGreaterThanOrEqual(6);
  expect(minBefore).toBeLessThanOrEqual(8); // ~30 - 22 minutes left

  await page.click('.cond-btn[data-val="4"]');
  await page.click('.btn-save');
  await expect(page.locator('#gps-status')).toContainText('Pin dropped', { timeout: 5000 });

  await expect(page.locator('#interval-display')).toHaveText('#2');
  const afterFeed = await page.locator('#next-feed-display').textContent();
  const [minAfter] = afterFeed.split(':').map(Number);
  expect(minAfter).toBeGreaterThanOrEqual(29); // countdown restarted near 30:00
  await expect(page.locator('.feed-num').first()).toHaveText('#1'); // per-athlete feed count
});

test('each athlete has an independent interval/countdown', async ({ page }) => {
  await page.fill('#new-athlete-name', 'Alice');
  await page.click('.btn-add-athlete');
  await page.click('#start-swim-btn');
  await page.click('#add-athlete-toggle-btn');
  await page.fill('#new-athlete-name', 'Bob');
  await page.click('.btn-add-athlete');

  await expect(page.locator('.swipe-name')).toContainText('Bob');
  await page.click('.cond-btn[data-val="4"]');
  await page.click('.btn-save');
  await expect(page.locator('#gps-status')).toContainText('Pin dropped', { timeout: 5000 });
  await expect(page.locator('#interval-display')).toHaveText('#2');

  await page.locator('.swipe-arrow').first().click();
  await expect(page.locator('.swipe-name')).toContainText('Alice');
  await expect(page.locator('#interval-display')).toHaveText('#1');
});
