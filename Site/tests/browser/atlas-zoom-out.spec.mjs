import { test, expect } from '@playwright/test';

function numericAttribute(locator, name) {
  return locator.getAttribute(name).then((value) => Number(value));
}

test('mobile Atlas starts width-fitted, resets to that framing and keeps zoom-out room', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4321/maps/errack-citadel/', { waitUntil: 'networkidle' });

  const atlas = page.locator('[data-atlas]');
  const zoomOut = atlas.locator('.leaflet-control-zoom-out');

  await expect(atlas).toHaveAttribute('data-atlas-ready', 'true');
  await expect(atlas).toHaveAttribute('data-atlas-raster', 'tiles');

  const initialZoom = await numericAttribute(atlas, 'data-atlas-zoom');
  expect(Number.isFinite(initialZoom)).toBe(true);
  expect(initialZoom).toBeLessThan(0);
  await expect(zoomOut).not.toHaveClass(/leaflet-disabled/);

  await zoomOut.click();
  await expect.poll(() => numericAttribute(atlas, 'data-atlas-zoom')).toBeLessThan(initialZoom - 0.4);
  await expect(zoomOut).not.toHaveClass(/leaflet-disabled/);

  await atlas.getByRole('button', { name: 'Reset map view' }).click();
  await expect.poll(async () => Math.abs((await numericAttribute(atlas, 'data-atlas-zoom')) - initialZoom)).toBeLessThan(0.05);
});
