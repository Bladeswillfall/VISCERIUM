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
  await openMobile(page, '/maps/exploration-demo-world/');

  const atlas = page.locator('[data-atlas]');
  const canvas = atlas.locator('[data-atlas-canvas]');
  await expect(atlas).toHaveAttribute('data-atlas-ready', 'true');
  await expect(canvas).toBeVisible();

  const frameBox = await atlas.locator('.atlas__frame').boundingBox();
  expect(frameBox?.y ?? 999).toBeLessThan(260);
  await expect(atlas.locator('.atlas__toolbar')).toBeHidden();
  await expect(atlas.locator('.atlas__surface-controls')).toBeVisible();
  await expect(atlas.locator('.leaflet-control-layers')).toBeVisible();

  await atlas.getByRole('button', { name: 'Search map' }).click();
  const mobileSearch = page.locator('#atlas-exploration-demo-world-mobile-search');
  await expect(mobileSearch).toBeVisible();
  await mobileSearch.getByRole('searchbox', { name: 'Search map' }).fill('Demo Gate City');
  await mobileSearch.getByRole('button', { name: /Demo Gate City/i }).click();

  const inspector = atlas.locator('[data-atlas-inspector]');
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText('Demo Gate City');
  await inspector.getByRole('button', { name: 'Close location details' }).click();

  await atlas.getByRole('button', { name: 'Enter focus mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-exploration-focus', '');
  await expect(page.locator('.codex-header')).toBeHidden();
  const focusedBox = await canvas.boundingBox();
  expect(focusedBox?.height ?? 0).toBeGreaterThan(780);
  await atlas.getByRole('button', { name: 'Exit focus mode' }).click();
});

test('landscape phone keeps Atlas inspection compact while preserving the map workspace', async ({ page }) => {
  await openAtSize(page, '/maps/exploration-demo-world/', phoneLandscape);

  const atlas = page.locator('[data-atlas]');
  await expect(atlas).toHaveAttribute('data-atlas-ready', 'true');
  await expect(atlas.locator('[data-atlas-canvas]')).toBeVisible();
  await expect(atlas.locator('.atlas__toolbar')).toBeVisible();

  const layers = atlas.locator('.leaflet-control-layers');
  await expect(layers).toBeVisible();
  await expect(layers).not.toHaveClass(/leaflet-control-layers-expanded/);

  const search = atlas.locator('.atlas__toolbar').getByRole('searchbox', { name: 'Find a place' });
  await search.fill('Demo Gate City');
  await atlas.locator('.atlas__toolbar').getByRole('button', { name: /Demo Gate City/i }).click();

  const inspector = atlas.locator('[data-atlas-inspector]');
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText('Demo Gate City');
  await inspector.getByRole('button', { name: 'Close location details' }).click();
});

test('mobile Relationships offers filters, list mode and focus mode', async ({ page }) => {
  await openMobile(page, '/relationships/');

  const explorer = page.locator('[data-relationship-explorer]');
  const canvas = explorer.locator('[data-relationship-canvas]');
  await expect(canvas).toBeVisible();
  await expect(explorer.locator('.relationship-explorer__toolbar')).toBeHidden();
  await expect(explorer.locator('.relationship-explorer__mobile-controls')).toBeVisible();

  await explorer.getByRole('button', { name: 'Filter relationships' }).click();
  await expect(page.locator('#relationship-mobile-filters')).toBeVisible();
  await page.locator('#relationship-mobile-filters').getByRole('button', { name: 'Close filters' }).click();

  await explorer.getByRole('button', { name: 'Show relationship list' }).click();
  await expect(explorer.locator('[data-relationship-list]')).toBeVisible();
  await expect(canvas).toBeHidden();
  await expect(explorer.getByRole('button', { name: 'Show relationship graph' })).toBeVisible();

  await explorer.getByRole('button', { name: 'Show relationship graph' }).click();
  await expect(canvas).toBeVisible();

  await explorer.getByRole('button', { name: 'Enter focus mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-exploration-focus', '');
  await expect(page.locator('.codex-header')).toBeHidden();
  await expect(explorer.locator('.relationship-explorer__frame')).toBeVisible();
  await explorer.getByRole('button', { name: 'Exit focus mode' }).click();
});
