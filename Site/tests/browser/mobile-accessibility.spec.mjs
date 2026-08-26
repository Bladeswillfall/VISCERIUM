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
