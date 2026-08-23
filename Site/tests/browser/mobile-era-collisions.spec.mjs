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

    const menuButton = page.locator('.sidebar > starlight-menu-button button');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const sidebarExit = page.locator('[data-era-sidebar-toolbar] [data-era-exit]');
    await expect(sidebarExit).toBeVisible();
    await expect(menuButton).toBeVisible();

    const geometry = await page.evaluate(() => {
      const exitNode = document.querySelector('[data-era-sidebar-toolbar] [data-era-exit]');
      const closeNode = document.querySelector('.sidebar > starlight-menu-button button');
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
  });
});
