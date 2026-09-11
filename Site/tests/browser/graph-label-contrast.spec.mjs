import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

async function installDarkTheme(page) {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    localStorage.setItem('starlight-theme', 'dark');
  });
}

test('World Graph canvas labels keep readable dark-mode contrast', async ({ page }) => {
  await installDarkTheme(page);
  await page.goto(`${preview}/graph/`, { waitUntil: 'networkidle' });

  const graph = page.locator('[data-world-graph]');
  const canvas = graph.locator('[data-world-graph-canvas]');
  await expect(graph).toHaveAttribute('data-world-graph-ready', 'true');
  await canvas.focus();
  await expect(graph).toHaveAttribute('data-world-graph-context', 'keyboard');

  const label = await canvas.evaluate((element) => {
    const cy = element._cyreg?.cy;
    const node = cy?.nodes('.is-active').first();
    if (!node?.length) return null;

    const pixels = (value) => {
      const raster = document.createElement('canvas');
      raster.width = 1;
      raster.height = 1;
      const context = raster.getContext('2d');
      if (!context) return null;
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    const luminance = ([red, green, blue]) => {
      const linear = (value) => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      };
      return .2126 * linear(red) + .7152 * linear(green) + .0722 * linear(blue);
    };

    const text = pixels(node.style('color'));
    const background = pixels(node.style('text-background-color'));
    if (!text || !background) return null;
    const textLuminance = luminance(text);
    const backgroundLuminance = luminance(background);
    const contrast = (Math.max(textLuminance, backgroundLuminance) + .05)
      / (Math.min(textLuminance, backgroundLuminance) + .05);

    return {
      contrast,
      text: node.style('color'),
      background: node.style('text-background-color'),
    };
  });

  expect(label).not.toBeNull();
  expect(label.contrast).toBeGreaterThanOrEqual(4.5);
  expect(label.text).not.toBe(label.background);
});
