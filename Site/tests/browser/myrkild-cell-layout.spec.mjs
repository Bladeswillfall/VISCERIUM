import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const baseUrl = 'http://127.0.0.1:4321';
const strains = ['gluttony', 'envy', 'sloth', 'wrath', 'lust', 'pride', 'greed'];
const baileyPipelineAvailable = existsSync(
  fileURLToPath(new URL('../../src/lib/image-attribution.mjs', import.meta.url)),
);

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
  await expect(first).toBeVisible();
  const layout = await first.evaluate(node => ({
    float: getComputedStyle(node).float,
    imageWidth: node.getBoundingClientRect().width,
    articleWidth: node.closest('.sl-markdown-content').getBoundingClientRect().width,
  }));
  expect(layout.float).toBe('none');
  expect(layout.imageWidth).toBeLessThanOrEqual(layout.articleWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('Myrkild artwork uses Bailey attribution links and metadata tables once its pipeline is integrated', async ({ page }) => {
  test.skip(!baileyPipelineAvailable, 'Requires the open Bailey attribution implementation in PR #161');
  await page.goto(baseUrl + '/myrkildicary/myrkild/', { waitUntil: 'domcontentloaded' });
  for (const strain of strains) {
    const figure = page.locator('.vc-image-right').filter({
      has: page.locator('img[src$="/myrkild-' + strain + '-cell.webp"]'),
    });
    await expect(figure.locator('a.vc-image-link')).toHaveAttribute(
      'href', '/attribution/images/myrkild-' + strain + '-cell-webp/',
    );
  }
  await page.goto(baseUrl + '/attribution/images/myrkild-gluttony-cell-webp/', {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.getByRole('heading', { level: 1, name: 'Myrkild — Gluttony cell' })).toBeVisible();
  const table = page.locator('.codex-attribution-table');
  await expect(table).toContainText('Elias Vail');
  await expect(table.locator('.codex-rights-badge')).toContainText('Copyright');
});
