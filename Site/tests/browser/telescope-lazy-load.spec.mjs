import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('Telescope loads only after search is requested', async ({ page }) => {
  const searchRequests = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path === '/pages.json' || path === '/telescope-scope.json' || /\/_astro\/fuse\./.test(path)) {
      searchRequests.push(path);
    }
  });

  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });

  expect(searchRequests).toEqual([]);

  const searchButton = page.locator('[data-codex-header-search] button[data-open-modal]');
  const dialog = page.locator('#telescope-dialog');
  await expect(searchButton).toBeEnabled();
  await searchButton.click();
  await expect(dialog).toBeVisible();
  await expect.poll(() => searchRequests.includes('/pages.json')).toBe(true);
  await expect.poll(() => searchRequests.includes('/telescope-scope.json')).toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.keyboard.press('Control+K');
  await expect(dialog).toBeVisible();
});
