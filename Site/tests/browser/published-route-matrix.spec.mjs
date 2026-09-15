import { test, expect } from '@playwright/test';

const routes = [
  ['/degel-system/errack/', '.codex-page-title'],
  ['/maps/', '.atlas-index'],
  ['/relationships/', '.relationship-page'],
  ['/graph/', '.world-graph'],
  ['/calendar/', '.calendar-module'],
  ['/eras/citadel/events/', '.codex-alpha-index'],
  ['/support/', '.support-page'],
  ['/creator-programme/', '.creator-programme-page'],
  ['/contact/', '.contact-page'],
  ['/', '.home-gateway'],
  ['/start-here/', '.start-here-primer'],
];

for (const [name, viewport] of [
  ['desktop', { width: 1440, height: 1000 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  test(`published route matrix remains visible and unclipped on ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport);

    for (const [path, selector] of routes) {
      const response = await page.goto(`http://127.0.0.1:4321${path}`, { waitUntil: 'domcontentloaded' });
      expect(response?.ok(), path).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(selector).first(), path).toBeVisible();

      if (path === '/creator-programme/') {
        await expect(page.locator('.creator-roll__value').nth(0)).toHaveText('£1468.48');
        await expect(page.locator('.creator-roll__value').nth(1)).toHaveText('6');
        await page.locator('.creator-support-metrics').evaluate((element) => element.scrollIntoView({ block: 'center' }));
        await expect(page.locator('.creator-roll[data-roll-active]')).toHaveCount(2);
        await expect(page.locator('.creator-roll__digit')).toHaveCount(7);
        await page.waitForFunction(() => {
          const track = document.querySelector('.creator-roll__track');
          if (!track) return false;
          const transform = getComputedStyle(track).transform;
          return transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)';
        });
      }

      const geometry = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        mainTextLength: document.querySelector('main')?.textContent?.trim().length ?? 0,
      }));
      expect(geometry.scrollWidth, `${path} horizontal overflow`).toBeLessThanOrEqual(geometry.clientWidth + 1);
      expect(geometry.mainTextLength, `${path} visible content`).toBeGreaterThan(40);
    }
  });
}

test('creator programme keeps header clearance without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const response = await page.goto('http://127.0.0.1:4321/creator-programme/', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBe(true);

  const geometry = await page.evaluate(() => {
    const main = document.querySelector('.main-frame');
    const header = document.querySelector('header.header');
    const hero = document.querySelector('.creator-hero');
    if (!main || !header || !hero) return null;

    return {
      mainPaddingTop: Number.parseFloat(getComputedStyle(main).paddingTop),
      headerHeight: header.getBoundingClientRect().height,
      heroTop: hero.getBoundingClientRect().top,
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry.mainPaddingTop).toBeGreaterThanOrEqual(geometry.headerHeight - 1);
  expect(geometry.heroTop).toBeGreaterThanOrEqual(geometry.headerHeight - 1);
  await context.close();
});
