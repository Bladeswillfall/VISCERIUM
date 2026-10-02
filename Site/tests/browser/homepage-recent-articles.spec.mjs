import { test, expect } from '@playwright/test';

const homepage = 'http://127.0.0.1:4321/';

test('recent article carousel expands without changing card width', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 920 });
  await page.goto(homepage, { waitUntil: 'domcontentloaded' });

  const track = page.locator('#recent-track');
  const cards = track.locator('.record');
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBeLessThanOrEqual(36);

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


test('recent article controls align in both themes, without an article count', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 920 });
  await page.goto(homepage, { waitUntil: 'domcontentloaded' });

  const section = page.locator('#recent-articles');
  await expect(section.locator('.recent__count')).toHaveCount(0);
  await expect(page.locator('#recent-toggle')).toBeVisible();
  await expect(page.locator('#recent-next')).toBeVisible();

  const themes = [];
  for (const theme of ['dark', 'light']) {
    await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
    const layout = await section.evaluate((element) => {
      const grid = element.querySelector('#recent-toggle').getBoundingClientRect();
      const next = element.querySelector('#recent-next').getBoundingClientRect();
      const header = element.querySelector('#recent-title');
      return {
        background: getComputedStyle(element).backgroundImage,
        headingColor: getComputedStyle(header).color,
        cardBackground: getComputedStyle(element.querySelector('.record')).backgroundColor,
        cardTitleColor: getComputedStyle(element.querySelector('.record h3')).color,
        topDifference: Math.abs(grid.top - next.top),
        heightDifference: Math.abs(grid.height - next.height),
      };
    });
    expect(layout.topDifference).toBeLessThan(1);
    expect(layout.heightDifference).toBeLessThan(1);
    themes.push(layout);
  }
  expect(themes[1].background).not.toBe(themes[0].background);
  expect(themes[1].headingColor).not.toBe(themes[0].headingColor);
  expect(themes[1].cardBackground).not.toBe(themes[0].cardBackground);
  expect(themes[1].cardTitleColor).not.toBe(themes[0].cardTitleColor);
});

test('light-mode mobile articles retain readable text on the light background', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(homepage, { waitUntil: 'domcontentloaded' });
  const layout = await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    const article = document.querySelector('#recent-articles .record');
    const headline = getComputedStyle(article.querySelector('h3'));
    const probe = document.createElement('span');
    probe.style.color = 'var(--codex-text-body)';
    document.body.append(probe);
    const siteText = getComputedStyle(probe).color;
    probe.remove();
    return {
      headingColor: headline.color,
      siteText,
      countVisible: Boolean(document.querySelector('.recent__count')),
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    };
  });
  expect(layout.headingColor).toBe(layout.siteText);
  expect(layout.siteText).not.toBe('');
  expect(layout.countVisible).toBe(false);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
});

test('homepage has no link to the retired What\'s New route', async ({ page, request }) => {
  await page.goto(homepage, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('a[href="/changelog/"]')).toHaveCount(0);
  const response = await request.get(new URL('/changelog/', homepage).href);
  expect(response.status()).toBe(404);
});
