import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

test('custom 404 page keeps navigation and site search working', async ({ page }) => {
  await page.goto(`${preview}/404.html`, { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'This page is not in the codex.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start here' })).toHaveAttribute('href', '/start-here/');
  await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
  await expect(page.locator('a.not-found-route[href="/graph/"]')).toBeVisible();

  await expect(page.locator('html')).toHaveAttribute('data-telescope-scope-ready', '');
  const search = page.locator('.not-found-route[data-codex-search-open]');
  await expect(search).toBeEnabled();
  await search.click();
  await expect(page.locator('#telescope-dialog')).toBeVisible();
});
