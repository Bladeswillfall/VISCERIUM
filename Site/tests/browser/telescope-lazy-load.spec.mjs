import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('Telescope loads only after search is requested', async ({ page }) => {
  const searchRequests = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path === '/pages.json' || path === '/telescope-scope.json' || /\/_astro\/fuse\./.test(path)) {
      searchRequests.push(path);
    }
  });

  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });

  expect(searchRequests).toEqual([]);

  const searchButton = page.locator('[data-codex-header-search] button[data-open-modal]');
  const dialog = page.locator('#telescope-dialog');
  await expect(searchButton).toBeEnabled();
  await searchButton.click();
  await expect(dialog).toBeVisible();
  await expect.poll(() => searchRequests.includes('/pages.json')).toBe(true);
  await expect.poll(() => searchRequests.includes('/telescope-scope.json')).toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.keyboard.press('Control+K');
  await expect(dialog).toBeVisible();
});

test('mobile footer keeps readable text and full-size route targets in light mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('starlight-theme', 'light'));
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });

  const footer = page.locator('.ion-codex-footer');
  await expect(footer.locator('.footer-wayfinder__primary')).toHaveAttribute('href', '/start-here/');

  const state = await footer.evaluate((element) => {
    const notice = element.querySelector('.footer-brand__notice');
    const description = element.querySelector('.policy-link__description');
    const routes = [...element.querySelectorAll('.footer-wayfinder__routes a')];
    if (!(notice instanceof HTMLElement) || !(description instanceof HTMLElement)) {
      throw new Error('Missing footer text');
    }

    return {
      footerColor: getComputedStyle(element).color,
      noticeColor: getComputedStyle(notice).color,
      descriptionColor: getComputedStyle(description).color,
      routeRects: routes.map((route) => {
        const rect = route.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
    };
  });

  expect(state.noticeColor).toBe(state.footerColor);
  expect(state.descriptionColor).toBe(state.footerColor);
  expect(state.routeRects.length).toBeGreaterThan(0);
  expect(state.routeRects.every(({ width, height }) => width >= 48 && height >= 48)).toBe(true);
});
