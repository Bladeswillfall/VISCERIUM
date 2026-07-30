import { test, expect } from '@playwright/test';

test('Atlas demo renders the real CITADEL WebP map', async ({ page }) => {
  const imageResponsePromise = page.waitForResponse((response) => (
    response.url().endsWith('/assets/maps/Errack-CITADEL.webp')
  ));

  await page.goto('http://127.0.0.1:4321/maps/exploration-demo-world/', { waitUntil: 'domcontentloaded' });

  const imageResponse = await imageResponsePromise;
  expect(imageResponse.ok()).toBe(true);
  expect(imageResponse.headers()['content-type']).toMatch(/^image\/webp\b/i);

  const atlas = page.locator('[data-atlas]');
  await expect(atlas).toHaveAttribute('data-atlas-ready', 'true', { timeout: 10_000 });

  const overlay = atlas.locator('img.leaflet-image-layer');
  await expect(overlay).toHaveAttribute('src', /\/assets\/maps\/Errack-CITADEL\.webp$/);

  const image = await overlay.evaluate((element) => ({
    complete: element.complete,
    naturalWidth: element.naturalWidth,
    naturalHeight: element.naturalHeight,
  }));

  expect(image).toEqual({
    complete: true,
    naturalWidth: 7680,
    naturalHeight: 3840,
  });
});
