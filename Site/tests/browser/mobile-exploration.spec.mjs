import { test, expect } from '@playwright/test';

const phone = { width: 390, height: 844 };
const phoneLandscape = { width: 844, height: 390 };

async function openAtSize(page, path, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`http://127.0.0.1:4321${path}`, { waitUntil: 'networkidle' });
}

async function openMobile(page, path) {
  await openAtSize(page, path, phone);
}

test('mobile Atlas prioritises the map and uses native exploration controls', async ({ page }) => {
  await openMobile(page, '/maps/errack-citadel/');

  const atlas = page.locator('[data-atlas]');
  const canvas = atlas.locator('[data-atlas-canvas]');
  await expect(atlas).toHaveAttribute('data-atlas-ready', 'true');
  await expect(canvas).toBeVisible();

  const frameBox = await atlas.locator('.atlas__frame').boundingBox();
  expect(frameBox?.y ?? 999).toBeLessThan(260);
  await expect(atlas.locator('.atlas__toolbar')).toBeHidden();
  await expect(atlas.locator('.atlas__surface-controls')).toBeVisible();
  await expect(atlas.locator('.leaflet-control-layers')).toHaveCount(0);
  await expect(atlas.locator('.atlas__empty-note')).toContainText('no positioned markers have been published yet');

  await atlas.getByRole('button', { name: 'Search map' }).click();
  const mobileSearch = page.locator('#atlas-errack-citadel-mobile-search');
  await expect(mobileSearch).toBeVisible();
  await mobileSearch.getByRole('searchbox', { name: 'Search map' }).fill('unpublished place');
  await expect(mobileSearch.locator('.atlas-search__empty')).toHaveText('No matching markers.');
  await mobileSearch.getByRole('button', { name: 'Close search' }).click();

  await atlas.getByRole('button', { name: 'Enter focus mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-exploration-focus', '');
  await expect(page.locator('.codex-header')).toBeHidden();
  const focusedBox = await canvas.boundingBox();
  expect(focusedBox?.height ?? 0).toBeGreaterThan(780);
  await atlas.getByRole('button', { name: 'Exit focus mode' }).click();
});

test('landscape phone keeps Atlas inspection compact while preserving the map workspace', async ({ page }) => {
  await openAtSize(page, '/maps/errack-citadel/', phoneLandscape);

  const atlas = page.locator('[data-atlas]');
  await expect(atlas).toHaveAttribute('data-atlas-ready', 'true');
  await expect(atlas.locator('[data-atlas-canvas]')).toBeVisible();
  await expect(atlas.locator('.atlas__toolbar')).toBeVisible();

  await expect(atlas.locator('.leaflet-control-layers')).toHaveCount(0);
  await expect(atlas.locator('.atlas__empty-note')).toContainText('no positioned markers have been published yet');

  const search = atlas.locator('.atlas__toolbar').getByRole('searchbox', { name: 'Find a place' });
  await search.fill('unpublished place');
  await expect(atlas.locator('.atlas__toolbar .atlas-search__empty')).toHaveText('No matching markers.');
});

test('mobile Relationships renders published structured relationships', async ({ page }) => {
  await openMobile(page, '/relationships/');

  const explorer = page.locator('[data-relationship-explorer]');
  await expect(explorer.locator('[data-relationship-canvas]')).toBeVisible();
  await expect(explorer.locator('.relationship-explorer__empty')).toHaveCount(0);
  await expect(explorer.getByRole('button', { name: 'Search relationships' })).toBeVisible();
  await expect(page.locator('.pagination-links')).toHaveCount(0);
});
