import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile header controls expose 44px targets and remain interactive', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });

  const searchButton = page.locator('[data-codex-header-search] button[data-open-modal]');
  const settingsButton = page.locator('[data-reader-settings-trigger]');
  const settingsPanel = page.locator('[data-reader-settings-panel]');

  for (const target of [searchButton, settingsButton]) {
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  await settingsButton.click();
  await expect(settingsPanel).toBeVisible();
  await settingsButton.click();
  await expect(settingsPanel).toBeHidden();

  await expect(searchButton).toBeEnabled();
  await searchButton.click();
  await expect(page.locator('#telescope-dialog')).toBeVisible();
});

test('settings dialog focuses its full-size close control', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/start-here/', { waitUntil: 'networkidle' });
  await page.locator('[data-reader-settings-trigger]').click();
  const close = page.locator('[data-reader-settings-close]');
  await expect(close).toBeFocused();
  const box = await close.boundingBox();
  expect(box).not.toBeNull();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await close.click();
  await expect(page.locator('[data-reader-settings-panel]')).toBeHidden();
  await expect(page.locator('[data-reader-settings-trigger]')).toBeFocused();
});

test('footer secondary copy remains readable at narrow viewport widths', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
  const selectors = [
    '.footer-brand__notice',
    '.footer-wayfinder__routes a',
    '.policy-link__title',
    '.policy-link__description',
  ];
  for (const selector of selectors) {
    const values = await page.locator(selector).evaluateAll((nodes) =>
      nodes.map((node) => Number.parseFloat(getComputedStyle(node).fontSize)));
    expect(values.length).toBeGreaterThan(0);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(12);
  }
});
