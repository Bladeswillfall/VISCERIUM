import { test, expect } from '@playwright/test';

test('canonical Atlas streams WebP LOD tiles without downloading the full map raster', async ({ page }) => {
  const fullMapRequests = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/assets/maps/Errack-CITADEL.webp')) fullMapRequests.push(request.url());
  });

  const tileResponsePromise = page.waitForResponse((response) => (
    /\/assets\/map-tiles\/errack-citadel\/\d+\/\d+\/\d+\.webp$/.test(response.url())
  ));

  await page.goto('http://127.0.0.1:4321/maps/errack-citadel/', { waitUntil: 'domcontentloaded' });

  const tileResponse = await tileResponsePromise;
  expect(tileResponse.ok()).toBe(true);
  expect(tileResponse.headers()['content-type']).toMatch(/^image\/webp\b/i);

  const atlas = page.locator('[data-atlas]');
  await expect(atlas).toHaveAttribute('data-atlas-ready', 'true', { timeout: 10_000 });
  await expect(atlas).toHaveAttribute('data-atlas-raster', 'tiles');

  const tile = atlas.locator('.atlas-map-tile img.leaflet-tile').first();
  await expect(tile).toBeVisible();
  await expect(tile).toHaveAttribute('src', /\/assets\/map-tiles\/errack-citadel\/\d+\/\d+\/\d+\.webp$/);

  const image = await tile.evaluate((element) => ({
    complete: element.complete,
    naturalWidth: element.naturalWidth,
    naturalHeight: element.naturalHeight,
  }));

  expect(image).toEqual({
    complete: true,
    naturalWidth: 512,
    naturalHeight: 512,
  });
  expect(fullMapRequests).toEqual([]);
});
