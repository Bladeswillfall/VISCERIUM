import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

async function installDarkTheme(page) {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    localStorage.setItem('starlight-theme', 'dark');
  });
}

async function readActiveLabel(canvas) {
  return canvas.evaluate((element) => {
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
      text,
      background,
      textLuminance,
      backgroundLuminance,
      ruleCount: cy.style().json().length,
    };
  });
}

async function chooseTheme(page, value, resolvedTheme) {
  const panel = page.locator('[data-reader-settings-panel]');
  if (await panel.isHidden()) {
    await page.locator('[data-reader-settings-trigger]').click();
    await expect(panel).toBeVisible();
  }
  await page.locator(`.reader-theme-options label:has(input[value="${value}"])`).click();
  await expect.poll(() => page.locator('html').getAttribute('data-theme')).toBe(resolvedTheme);
}

test('World Graph canvas labels keep readable dark-mode contrast', async ({ page }) => {
  await installDarkTheme(page);
  await page.goto(`${preview}/graph/`, { waitUntil: 'networkidle' });

  const graph = page.locator('[data-world-graph]');
  const canvas = graph.locator('[data-world-graph-canvas]');
  await expect(graph).toHaveAttribute('data-world-graph-ready', 'true');
  await canvas.focus();
  await expect(graph).toHaveAttribute('data-world-graph-context', 'keyboard');

  const label = await readActiveLabel(canvas);
  expect(label).not.toBeNull();
  expect(label.contrast).toBeGreaterThanOrEqual(4.5);
  expect(label.textLuminance).toBeGreaterThan(label.backgroundLuminance);
  expect(label.text).not.toEqual(label.background);
});

test('World Graph theme colours replace rather than stack across view modes', async ({ page }) => {
  await installDarkTheme(page);
  await page.goto(`${preview}/graph/`, { waitUntil: 'networkidle' });

  const graph = page.locator('[data-world-graph]');
  const canvas = graph.locator('[data-world-graph-canvas]');
  await expect(graph).toHaveAttribute('data-world-graph-ready', 'true');
  await canvas.focus();
  await expect(graph).toHaveAttribute('data-world-graph-context', 'keyboard');

  const initial = await readActiveLabel(canvas);
  expect(initial).not.toBeNull();
  expect(initial.text).toEqual([200, 191, 168, 255]);
  expect(initial.background).toEqual([16, 16, 16, 255]);

  await chooseTheme(page, 'light', 'light');
  await expect.poll(() => readActiveLabel(canvas)).toMatchObject({
    text: [0, 0, 0, 255],
    background: [185, 180, 169, 255],
    ruleCount: initial.ruleCount,
  });

  await chooseTheme(page, 'dark', 'dark');
  await expect.poll(() => readActiveLabel(canvas)).toMatchObject({
    text: [200, 191, 168, 255],
    background: [16, 16, 16, 255],
    ruleCount: initial.ruleCount,
  });

  await page.emulateMedia({ colorScheme: 'light' });
  await chooseTheme(page, 'auto', 'light');
  await expect.poll(() => readActiveLabel(canvas)).toMatchObject({
    text: [0, 0, 0, 255],
    background: [185, 180, 169, 255],
    ruleCount: initial.ruleCount,
  });
});
