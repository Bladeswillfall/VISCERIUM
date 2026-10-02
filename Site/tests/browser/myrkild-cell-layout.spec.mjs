import { test, expect } from '@playwright/test';

const baseUrl = 'http://127.0.0.1:4321';
const strains = ['gluttony', 'envy', 'sloth', 'wrath', 'lust', 'pride', 'greed'];

test('all seven Myrkild cell illustrations wrap ordinary prose rather than quotations', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseUrl + '/myrkildicary/myrkild/', { waitUntil: 'domcontentloaded' });

  for (const strain of strains) {
    const figure = page.locator('.vc-image-right').filter({
      has: page.locator('img[src$="/myrkild-' + strain + '-cell.webp"]'),
    });
    await expect(figure).toHaveCount(1);
    await expect(figure).toBeVisible();
    const geometry = await figure.evaluate(node => ({
      inBlockquote: !!node.closest('blockquote'),
      float: getComputedStyle(node).float,
      shape: getComputedStyle(node).shapeOutside,
      top: getComputedStyle(node).marginTop,
      bottom: getComputedStyle(node).marginBottom,
      left: getComputedStyle(node).marginLeft,
      padding: getComputedStyle(node).padding,
      width: Math.round(node.getBoundingClientRect().width),
    }));
    expect(geometry.inBlockquote, strain + ' figure should not be quoted').toBe(false);
    expect(geometry.float).toBe('right');
    expect(geometry.shape).toContain('/myrkild-' + strain + '-cell.webp');
    expect(geometry.top).toBe('0px');
    expect(geometry.bottom).toBe('0px');
    expect(geometry.left).toBe('0px');
    expect(geometry.padding).toBe('0px');
    expect(geometry.width).toBeLessThanOrEqual(221);
  }

  const first = page.locator('p').filter({
    hasText: 'At first the Gluttony variant of Myrkild manifest',
  }).first();
  await expect(first).toBeVisible();
  expect(await first.evaluate(node => !!node.closest('blockquote'))).toBe(false);
});

test('mobile Myrkild strain illustrations stop floating and stay within the article', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto(baseUrl + '/myrkildicary/myrkild/', { waitUntil: 'domcontentloaded' });
  const first = page.locator('.vc-image-right').filter({
    has: page.locator('img[src$="/myrkild-gluttony-cell.webp"]'),
  });
  // The illustration is far below the fold on mobile. Bring its heading into
  // view to trigger the intentional lazy image load before asserting visibility.
  await page.getByRole('heading', {level:3, name:'Gluttony'}).scrollIntoViewIfNeeded();
  await expect.poll(() => first.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(first).toBeVisible();
  const layout = await first.evaluate(node => ({
    float: getComputedStyle(node).float,
    imageWidth: node.getBoundingClientRect().width,
    aspectRatio: getComputedStyle(node).aspectRatio,
    articleWidth: node.closest('.sl-markdown-content').getBoundingClientRect().width,
  }));
  expect(layout.float).toBe('none');
  expect(layout.aspectRatio).toBe('1 / 1');
  expect(layout.imageWidth).toBeLessThanOrEqual(layout.articleWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('Myrkild images expose the canonical Bailey attribution links', async ({ page }) => {
  await page.goto(baseUrl + '/myrkildicary/myrkild/', { waitUntil: 'domcontentloaded' });
  for (const strain of strains) {
    const figure = page.locator('.vc-image-right').filter({
      has: page.locator('img[src$="/myrkild-' + strain + '-cell.webp"]'),
    });
    await expect(figure.locator('a.vc-image-link')).toHaveAttribute(
      'href', '/attribution/images/myrkild-' + strain + '-cell-webp/',
    );
  }
});

test('Myrkild images open real Bailey-style attribution pages for all seven strains', async ({ page }) => {
  await page.goto(baseUrl + '/myrkildicary/myrkild/', { waitUntil: 'domcontentloaded' });
  const gluttony = page.locator('.vc-image-right').filter({
    has: page.locator('img[src$="/myrkild-gluttony-cell.webp"]'),
  });
  await gluttony.locator('a.vc-image-link').click();
  await expect(page).toHaveURL(/\/attribution\/images\/myrkild-gluttony-cell-webp\/$/);

  for (const strain of strains) {
    if (strain !== 'gluttony') {
      await page.goto(baseUrl + '/attribution/images/myrkild-' + strain + '-cell-webp/', {
        waitUntil: 'domcontentloaded',
      });
    }
    await expect(page.getByRole('heading', {
      level: 1,
      name: 'Myrkild — ' + strain[0].toUpperCase() + strain.slice(1) + ' cell',
    })).toBeVisible();
    const table = page.locator('.codex-attribution-table');
    await expect(table).toContainText('Elias Vail');
    await expect(table.locator('.codex-rights-badge')).toContainText('Copyright');
  }
});

test('Myrkild WebP transparency drives non-rectangular contour wrapping', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseUrl + '/myrkildicary/myrkild/', { waitUntil: 'domcontentloaded' });
  const figure = page.locator('.vc-image-shape').filter({
    has: page.locator('img[src$="/myrkild-gluttony-cell.webp"]'),
  });
  const image = figure.locator('img');
  await expect.poll(() => image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
  const alpha = await image.evaluate(node => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', {willReadFrequently:true});
    context.drawImage(node, 0, 0, 1, 1, 0, 0, 1, 1);
    return context.getImageData(0, 0, 1, 1).data[3];
  });
  expect(alpha).toBe(0);
  expect(await figure.evaluate(node => getComputedStyle(node).shapeOutside)).toContain('myrkild-gluttony-cell.webp');
});
