import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1174, height: 900 } });

function sidebarState(element) {
  const ancestry = [];
  let current = element;
  while (current) {
    const style = getComputedStyle(current);
    const rect = current.getBoundingClientRect();
    ancestry.push({
      element: `${current.tagName.toLowerCase()}${current.id ? `#${current.id}` : ''}${current.className ? `.${String(current.className).trim().replaceAll(/\s+/g, '.')}` : ''}`,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      position: style.position,
      transform: style.transform,
      width: rect.width,
      height: rect.height,
    });
    current = current.parentElement;
  }
  return ancestry;
}

async function expectSidebarOpen(sidebar) {
  await expect.poll(async () => sidebar.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility === 'visible'
      && style.opacity === '1'
      && style.pointerEvents === 'auto'
      && rect.right > 200;
  })).toBe(true);
}

test('left navigation starts collapsed, can open, and resets closed on reload', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/start-here/', { waitUntil: 'networkidle' });

  const sidebar = page.locator('#starlight__sidebar');
  const showButton = page.getByRole('button', { name: 'Show sidebar' });

  await expect(showButton).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/codex-sidebar-collapsed/);
  expect(await sidebar.locator('a').count()).toBeGreaterThan(3);

  await expect.poll(async () => sidebar.evaluate((element) => {
    const style = getComputedStyle(element);
    return `${style.visibility}:${style.opacity}:${style.pointerEvents}`;
  })).toBe('hidden:0:none');

  await showButton.click();
  const hideButton = page.getByRole('button', { name: 'Hide sidebar' });

  await expect(hideButton).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/codex-sidebar-collapsed/);
  await expectSidebarOpen(sidebar);

  const openAncestry = await sidebar.evaluate(sidebarState);
  expect(openAncestry[0]?.width).toBeGreaterThan(200);
  expect(openAncestry[0]?.height).toBeGreaterThan(200);
  expect(openAncestry.every((entry) => entry.display !== 'none')).toBe(true);
  expect(openAncestry.every((entry) => entry.visibility !== 'hidden')).toBe(true);
  expect(openAncestry[0]?.opacity).toBe('1');
  expect(openAncestry[0]?.pointerEvents).toBe('auto');

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: 'Show sidebar' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/codex-sidebar-collapsed/);
  await expect.poll(async () => sidebar.evaluate((element) => {
    const style = getComputedStyle(element);
    return `${style.visibility}:${style.opacity}:${style.pointerEvents}`;
  })).toBe('hidden:0:none');
});

test('homepage loads without a reveal and keeps its desktop navigation closed initially', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });

  const sidebar = page.locator('#starlight__sidebar');
  const homeGateway = page.locator('.home-gateway');

  await expect(page.locator('.home-reveal')).toHaveCount(0);
  await expect(homeGateway).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show sidebar' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/codex-sidebar-collapsed/);
  expect(await sidebar.locator('a').count()).toBeGreaterThan(3);

  await expect.poll(async () => sidebar.evaluate((element) => {
    const style = getComputedStyle(element);
    return `${style.visibility}:${style.opacity}:${style.pointerEvents}`;
  })).toBe('hidden:0:none');

  await page.getByRole('button', { name: 'Show sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Hide sidebar' })).toBeVisible();
  await expectSidebarOpen(sidebar);

  const geometry = await page.evaluate(() => {
    const sidebarRect = document.getElementById('starlight__sidebar')?.getBoundingClientRect();
    const homeRect = document.querySelector('.home-gateway')?.getBoundingClientRect();
    return {
      sidebarRight: sidebarRect?.right ?? 0,
      homeLeft: homeRect?.left ?? 0,
    };
  });

  expect(geometry.sidebarRight).toBeGreaterThan(200);
  expect(geometry.homeLeft).toBeGreaterThanOrEqual(geometry.sidebarRight - 1);
});

test('top ribbon owns flat, centred Telescope search and colour-mode controls', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/start-here/', { waitUntil: 'networkidle' });

  const searchButton = page.locator('[data-codex-header-search] button[data-open-modal]');
  const telescopeButton = page.locator('.right-group telescope-search .telescope__trigger-btn');
  const themeSelect = page.locator('.codex-theme-control select');

  await expect(searchButton).toBeVisible();
  await expect(telescopeButton).toBeHidden();
  await expect(themeSelect).toBeVisible();
  await expect(page.locator('#starlight__sidebar starlight-theme-select')).toHaveCount(0);
  expect(await page.locator('#starlight__sidebar .codex-local-icon').count()).toBeGreaterThan(3);
  await expect(page.locator('.codex-header .social-icons')).toHaveCount(0);
  await expect(page.locator('.codex-header a[href*="github.com"]')).toHaveCount(0);

  const ribbon = await page.evaluate(() => {
    const header = document.querySelector('.codex-header');
    const search = document.querySelector('[data-codex-header-search] button[data-open-modal]');
    const theme = document.querySelector('.codex-theme-control select');

    if (!(header instanceof HTMLElement) || !(search instanceof HTMLElement)) {
      throw new Error('Missing Codex header or search control');
    }

    const headerRect = header.getBoundingClientRect();
    const searchRect = search.getBoundingClientRect();
    const centerDelta = Math.abs(
      (searchRect.left + searchRect.width / 2) - (headerRect.left + headerRect.width / 2)
    );

    return {
      searchWidth: searchRect.width,
      centerDelta,
      backgroundImages: [search, theme]
        .filter((element) => element instanceof HTMLElement)
        .map((element) => getComputedStyle(element).backgroundImage),
    };
  });

  expect(ribbon.searchWidth).toBeGreaterThan(200);
  expect(ribbon.centerDelta).toBeLessThan(2);
  expect(ribbon.backgroundImages).toEqual(['none', 'none']);

  await searchButton.click();
  await expect(page.locator('#telescope-dialog')).toBeVisible();
  await page.locator('#telescope-search-input').fill('timeline');
  await expect(page.locator('#telescope-results .telescope__result-item').first()).toBeVisible();

  const initialTheme = await page.locator('html').getAttribute('data-theme');
  const selectedTheme = initialTheme === 'dark' ? 'light' : 'dark';
  await themeSelect.selectOption(selectedTheme);
  await expect.poll(() => page.locator('html').getAttribute('data-theme')).toBe(selectedTheme);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('starlight-theme'))).toBe(selectedTheme);
});

test('mobile On this page control only appears below the desktop breakpoint', async ({ page }) => {
  const mobileToc = page.locator('#starlight__on-this-page--mobile');

  await page.goto('http://127.0.0.1:4321/start-here/', { waitUntil: 'networkidle' });
  await expect(mobileToc).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await expect(mobileToc).toBeVisible();
});
