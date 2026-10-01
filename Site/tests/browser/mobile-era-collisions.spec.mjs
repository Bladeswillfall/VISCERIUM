import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';
const phone = { width: 390, height: 844 };

function overlapArea(first, second) {
  const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
  const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
  return width * height;
}

test.describe('mobile era collision guards', () => {
  test.use({ viewport: phone });

  test('header era exit remains fully visible and separate from search and reader settings', async ({ page }) => {
    await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });

    const search = page.locator('[data-codex-header-search] button[data-open-modal]');
    const exit = page.locator('[data-era-context-control] [data-era-exit]');
    const settings = page.locator('[data-reader-settings-trigger]');

    await expect(search).toBeVisible();
    await expect(exit).toBeVisible();
    await expect(settings).toBeVisible();

    const geometry = await page.evaluate(() => {
      const searchNode = document.querySelector('[data-codex-header-search] button[data-open-modal]');
      const exitNode = document.querySelector('[data-era-context-control] [data-era-exit]');
      const iconNode = exitNode?.querySelector('.codex-era-context-exit-icon');
      const settingsNode = document.querySelector('[data-reader-settings-trigger]');
      if (!(searchNode instanceof HTMLElement)
        || !(exitNode instanceof HTMLElement)
        || !(iconNode instanceof HTMLElement)
        || !(settingsNode instanceof HTMLElement)) {
        throw new Error('Missing mobile header controls');
      }

      const searchRect = searchNode.getBoundingClientRect();
      const exitRect = exitNode.getBoundingClientRect();
      const iconRect = iconNode.getBoundingClientRect();
      const settingsRect = settingsNode.getBoundingClientRect();
      const hit = document.elementFromPoint(
        exitRect.left + exitRect.width / 2,
        exitRect.top + exitRect.height / 2,
      );

      return {
        searchRect: searchRect.toJSON(),
        exitRect: exitRect.toJSON(),
        iconRect: iconRect.toJSON(),
        settingsRect: settingsRect.toJSON(),
        searchClientWidth: searchNode.clientWidth,
        searchScrollWidth: searchNode.scrollWidth,
        exitOwnsCentre: Boolean(hit?.closest('[data-era-exit]') === exitNode),
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      };
    });

    expect(overlapArea(geometry.searchRect, geometry.exitRect)).toBe(0);
    expect(overlapArea(geometry.exitRect, geometry.settingsRect)).toBe(0);
    expect(geometry.searchScrollWidth).toBeLessThanOrEqual(geometry.searchClientWidth + 1);
    expect(geometry.iconRect.left).toBeGreaterThanOrEqual(geometry.exitRect.left - 1);
    expect(geometry.iconRect.right).toBeLessThanOrEqual(geometry.exitRect.right + 1);
    expect(geometry.exitOwnsCentre).toBe(true);
    expect(geometry.exitRect.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.settingsRect.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  });

  test('sidebar era exit does not sit underneath the mobile drawer close button', async ({ page }) => {
    await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });

    const menuButton = page.locator('.sidebar > .sl-menu-button');
    const toggleOwnsCentre = () => menuButton.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return button === target || button.contains(target);
    });
    await expect(menuButton).toBeVisible();
    expect(await toggleOwnsCentre()).toBe(true);
    await menuButton.click();
    await expect(page.locator('#starlight__sidebar:popover-open')).toBeVisible();
    expect(await toggleOwnsCentre()).toBe(true);

    const sidebarExit = page.locator('[data-era-sidebar-toolbar] [data-era-exit]');
    await expect(sidebarExit).toBeVisible();
    await expect(menuButton).toBeVisible();

    const geometry = await page.evaluate(() => {
      const exitNode = document.querySelector('[data-era-sidebar-toolbar] [data-era-exit]');
      const closeNode = document.querySelector('.sidebar > .sl-menu-button');
      if (!(exitNode instanceof HTMLElement) || !(closeNode instanceof HTMLElement)) {
        throw new Error('Missing mobile sidebar controls');
      }

      const exitRect = exitNode.getBoundingClientRect();
      const closeRect = closeNode.getBoundingClientRect();
      const hit = document.elementFromPoint(
        exitRect.left + exitRect.width / 2,
        exitRect.top + exitRect.height / 2,
      );

      return {
        exitRect: exitRect.toJSON(),
        closeRect: closeRect.toJSON(),
        exitOwnsCentre: Boolean(hit?.closest('[data-era-exit]') === exitNode),
      };
    });

    expect(overlapArea(geometry.exitRect, geometry.closeRect)).toBe(0);
    expect(geometry.exitOwnsCentre).toBe(true);

    // A second pointer click must close the drawer, not only Escape.
    await menuButton.click();
    await expect(page.locator('#starlight__sidebar:popover-open')).toHaveCount(0);
    await menuButton.click();
    await expect(page.locator('#starlight__sidebar:popover-open')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#starlight__sidebar:popover-open')).toHaveCount(0);
    await expect(menuButton).toBeVisible();
  });

  test('mobile menu can open and close after scrolling hides the ribbon', async ({ page }) => {
    await page.goto(`${preview}/eras/citadel/events/the-ash-winter-pilgrimage/`, { waitUntil: 'networkidle' });

    const scrollRoom = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    expect(scrollRoom).toBeGreaterThan(100);
    await page.evaluate(() => window.scrollTo(0, Math.min(700, document.documentElement.scrollHeight - innerHeight)));
    await expect(page.locator('html')).toHaveAttribute('data-codex-mobile-header-hidden', '');

    const menuButton = page.locator('.sidebar > .sl-menu-button');
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.locator('#starlight__sidebar:popover-open')).toBeVisible();

    await expect.poll(() => page.locator('header.header').evaluate(
      (header) => Math.round(header.getBoundingClientRect().top),
    )).toBe(0);
    const geometry = await page.evaluate(() => {
      const button = document.querySelector('.sidebar > .sl-menu-button');
      const drawer = document.querySelector('#starlight__sidebar');
      if (!(button instanceof HTMLElement) || !(drawer instanceof HTMLElement)) {
        throw new Error('Missing mobile menu controls');
      }
      const rect = button.getBoundingClientRect();
      const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        buttonIsHitTarget: target === button || button.contains(target),
        buttonBottom: rect.bottom,
        drawerTop: drawer.getBoundingClientRect().top,
      };
    });
    expect(geometry.buttonIsHitTarget).toBe(true);
    expect(geometry.buttonBottom).toBeLessThanOrEqual(geometry.drawerTop);

    await menuButton.click();
    await expect(page.locator('#starlight__sidebar:popover-open')).toHaveCount(0);
  });
});
