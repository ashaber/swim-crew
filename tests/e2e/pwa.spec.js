import { test, expect } from '@playwright/test';

test('service worker registers and activates', async ({ page }) => {
  await page.goto('/');
  const state = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    for (let i = 0; i < 25; i++) {
      if (reg.active?.state === 'activated') return 'activated';
      await new Promise(r => setTimeout(r, 200));
    }
    return reg.active?.state ?? 'no-active-worker';
  });
  expect(state).toBe('activated');
});

test('manifest is linked, fetchable, and declares icons', async ({ page, baseURL }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const res = await page.request.get(new URL(href, baseURL).toString());
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest.name).toBe('swim-crew');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  expect(manifest.icons.some(i => i.purpose === 'maskable')).toBeTruthy();
});

test('app shell still renders when offline (precached)', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.fill('#new-athlete-name', 'Alice');
  await page.click('.btn-add-athlete');
  await page.click('#start-swim-btn');

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#race-header')).toBeVisible();
  await expect(page.locator('.swipe-name')).toContainText('Alice');
  await context.setOffline(false);
});
