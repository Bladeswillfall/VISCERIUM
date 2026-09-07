import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

test('World Graph hover labels keep readable contrast in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('starlight-theme', 'dark'));
  await page.goto(`${preview}/graph/`, { waitUntil: 'networkidle' });

  const graph = page.locator('[data-world-graph]');
  const canvas = graph.locator('[data-world-graph-canvas]');
  await expect(graph).toHaveAttribute('data-world-graph-ready', 'true');

  const point = await canvas.evaluate((element) => {
    const node = element._cyreg?.cy?.nodes().first();
    if (!node?.length) return null;
    const position = node.renderedPosition();
    const bounds = element.getBoundingClientRect();
    return { x: bounds.left + position.x, y: bounds.top + position.y };
  });
  expect(point).not.toBeNull();
  await page.mouse.move(point.x, point.y);
  await expect(graph).toHaveAttribute('data-world-graph-context', 'pointer');

  const contrast = await canvas.evaluate((element) => {
    const node = element._cyreg?.cy?.nodes('.is-active').first();
    if (!node?.length) return 0;

    const raster = document.createElement('canvas');
    raster.width = 2;
    raster.height = 1;
    const context = raster.getContext('2d');
    if (!context) return 0;
    context.fillStyle = node.style('text-background-color');
    context.fillRect(0, 0, 1, 1);
    context.fillStyle = node.style('color');
    context.fillRect(1, 0, 1, 1);

    const pixels = context.getImageData(0, 0, 2, 1).data;
    const luminance = (offset) => {
      const linear = (value) => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      };
      return .2126 * linear(pixels[offset])
        + .7152 * linear(pixels[offset + 1])
        + .0722 * linear(pixels[offset + 2]);
    };
    const background = luminance(0);
    const text = luminance(4);
    return (Math.max(background, text) + .05) / (Math.min(background, text) + .05);
  });

  expect(contrast).toBeGreaterThanOrEqual(4.5);
});
