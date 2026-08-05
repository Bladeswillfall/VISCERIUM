import { test, expect } from '@playwright/test';

async function horizontalMapGap(viewport, image) {
  const viewportBox = await viewport.boundingBox();
  const imageBox = await image.boundingBox();
  expect(viewportBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  return {
    viewportWidth: viewportBox.width,
    imageWidth: imageBox.width,
    gap: viewportBox.width - imageBox.width,
  };
}

test('mobile Atlas starts width-fitted, resets to that framing and keeps zoom-out room', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4321/maps/errack-citadel/', { waitUntil: 'networkidle' });

  const atlas = page.locator('[data-atlas]');
  const viewport = atlas.locator('[data-atlas-canvas]');
  const image = atlas.locator('.leaflet-image-layer');
  const zoomOut = atlas.locator('.leaflet-control-zoom-out');

  await expect(atlas).toHaveAttribute('data-atlas-ready', 'true');
  await expect(image).toBeVisible();

  const initial = await horizontalMapGap(viewport, image);
  expect(initial.imageWidth).toBeGreaterThan(initial.viewportWidth * 0.9);
  expect(initial.gap).toBeGreaterThanOrEqual(24);
  expect(initial.gap).toBeLessThanOrEqual(40);
  await expect(zoomOut).not.toHaveClass(/leaflet-disabled/);

  await zoomOut.click();
  await expect.poll(async () => (await image.boundingBox())?.width ?? Infinity).toBeLessThan(initial.imageWidth * 0.75);
  await expect(zoomOut).not.toHaveClass(/leaflet-disabled/);

  await atlas.getByRole('button', { name: 'Reset map view' }).click();
  await expect.poll(async () => (await image.boundingBox())?.width ?? 0).toBeGreaterThan(initial.imageWidth * 0.98);

  const reset = await horizontalMapGap(viewport, image);
  expect(Math.abs(reset.imageWidth - initial.imageWidth)).toBeLessThan(3);
  expect(reset.gap).toBeGreaterThanOrEqual(24);
  expect(reset.gap).toBeLessThanOrEqual(40);
});
