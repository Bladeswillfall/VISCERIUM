import { test, expect } from '@playwright/test';

test.describe('timeline without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1024, height: 768 } });

  test('keeps the server-rendered chronological fallback visible', async ({ page }) => {
    await page.goto('http://127.0.0.1:4321/timelines/citadel/', { waitUntil: 'domcontentloaded' });

    const fallback = page.locator('[data-vc-fallback]');
    await expect(fallback).toBeVisible();
    await expect(fallback.getByRole('heading', { name: 'Chronological list' })).toBeVisible();
    expect(await fallback.locator('li').count()).toBeGreaterThan(0);
    await expect(page.locator('[data-vc-island-mounted]')).toHaveCount(0);
  });
});

test.describe('timeline with reduced motion', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('mounts and keeps controls usable without animated transitions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:4321/timelines/citadel/', { waitUntil: 'networkidle' });

    const app = page.locator('.vc-timeline-app');
    await expect(page.locator('[data-vc-island-mounted]')).toBeVisible();
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);

    const listButton = app.locator('[data-vc-list]');
    const transitionDurationMs = await listButton.evaluate((element) => {
      const duration = getComputedStyle(element).transitionDuration.split(',')[0].trim();
      return Number.parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000);
    });
    expect(transitionDurationMs).toBeLessThanOrEqual(1);

    await listButton.click();
    await expect(app.locator('.vc-timeline-list')).toBeVisible();
  });
});
