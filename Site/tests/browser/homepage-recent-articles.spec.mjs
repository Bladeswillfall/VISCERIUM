import { test, expect } from '@playwright/test';

const homepage = 'http://127.0.0.1:4321/';

test('recent article carousel expands without changing card width', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 920 });
  await page.goto(homepage, { waitUntil: 'domcontentloaded' });

  const track = page.locator('#recent-track');
  const cards = track.locator('.record');
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBeLessThanOrEqual(6);

  const originalWidth = await cards.first().evaluate((card) => card.getBoundingClientRect().width);
  await page.locator('#recent-toggle').click();
  await expect(page.locator('#recent-articles')).toHaveAttribute('data-view', 'grid');
  await expect(page.locator('#recent-toggle')).toHaveAttribute('aria-expanded', 'true');

  const layout = await track.evaluate((list) => ({
    columns: getComputedStyle(list).gridTemplateColumns.split(' ').length,
    overflow: getComputedStyle(list).overflowX,
  }));
  expect(layout.columns).toBe(3);
  expect(layout.overflow).toBe('visible');
  const expandedWidth = await cards.first().evaluate((card) => card.getBoundingClientRect().width);
  expect(expandedWidth).toBeLessThanOrEqual(originalWidth + 1);

  await page.locator('#recent-toggle').click();
  await expect(page.locator('#recent-articles')).toHaveAttribute('data-view', 'rail');
});

test('mouse drag scrolls the rail and releases without an article click', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto(homepage, { waitUntil: 'domcontentloaded' });
  const track = page.locator('#recent-track');
  await expect(page.locator('#recent-next')).toBeVisible();
  await track.scrollIntoViewIfNeeded();
  const bounds = await track.boundingBox();
  expect(bounds).not.toBeNull();
  const startX = bounds.x + Math.min(bounds.width - 35, 660);
  const y = bounds.y + 90;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - 280, y, { steps: 9 });
  await page.mouse.up();
  await expect.poll(() => track.evaluate((list) => list.scrollLeft)).toBeGreaterThan(100);
  await page.waitForTimeout(450);
  expect(page.url()).toBe(homepage);
});

test('narrow screens use a vertical list with no horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(homepage, { waitUntil: 'domcontentloaded' });
  const track = page.locator('#recent-track');
  await expect(page.locator('#recent-toggle')).toBeHidden();
  await expect(page.locator('#recent-next')).toBeHidden();
  const layout = await track.evaluate((list) => ({
    flow: getComputedStyle(list).gridAutoFlow,
    overflowX: getComputedStyle(list).overflowX,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  expect(layout.flow).toBe('row');
  expect(layout.overflowX).toBe('visible');
  expect(layout.horizontalOverflow).toBe(false);
});
