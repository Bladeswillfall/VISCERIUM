import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

test('era mode keeps ordinary Home navigation scoped until the reader exits', async ({ page }) => {
  await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });

  await expect(page.locator('html')).toHaveAttribute('data-era-context', 'CITADEL');
  await expect(page.locator('[data-era-context-control]')).toBeVisible();
  await expect(page.locator('[data-era-home]')).toHaveAttribute('href', '/eras/citadel/');
  await expect(page.locator('[data-era-exit]').first()).toContainText(/Exit CITADEL|Exit · All eras/);

  await page.locator('[data-era-context-control] [data-era-exit]').click();
  await page.waitForURL(/\/$/);
  await expect(page.locator('html')).not.toHaveAttribute('data-era-context', 'CITADEL');

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('html')).not.toHaveAttribute('data-era-context');
});

test('global relationship exploration stays inside a remembered era', async ({ page }) => {
  await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-era-context', 'CITADEL');

  await page.goto(`${preview}/relationships/`, { waitUntil: 'networkidle' });
  await page.waitForURL(/\/eras\/citadel\/relationships\/$/);
  await expect(page.locator('html')).toHaveAttribute('data-era-context', 'CITADEL');
});

test('Telescope search is scoped to the active era plus Universal pages', async ({ page }) => {
  await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });

  const searchButton = page.locator('[data-codex-search-open]');
  await expect(searchButton).toBeEnabled();
  await searchButton.click();

  await expect(page.locator('#telescope-dialog')).toBeVisible();
  await expect(page.locator('#telescope-search-input')).toBeFocused();
  await expect(page.locator('[data-telescope-scope-label]')).toContainText('CITADEL + Universal');

  const leakage = await page.evaluate(async () => {
    const controller = document.querySelector('telescope-search')?.telescopeSearch;
    const metadata = await fetch('/telescope-scope.json').then((response) => response.json());
    if (!controller || !Array.isArray(controller.allPages)) return ['missing-controller'];

    return controller.allPages
      .filter((entry) => {
        const key = String(entry.path || '').replace(/^\/+|\/+$/g, '').toLowerCase();
        const meta = metadata[key];
        return !meta
          || meta.searchable === false
          || meta.type === 'continuity'
          || !['CITADEL', 'Universal'].includes(meta.era);
      })
      .map((entry) => entry.path);
  });

  expect(leakage).toEqual([]);
});

test.describe('mobile era context', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('header keeps search and era exit controls separated without horizontal overflow', async ({ page }) => {
    await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });

    const search = page.locator('[data-codex-header-search] button[data-open-modal]');
    const exit = page.locator('[data-era-context-control] [data-era-exit]');
    await expect(search).toBeVisible();
    await expect(exit).toBeVisible();

    const geometry = await page.evaluate(() => {
      const searchNode = document.querySelector('[data-codex-header-search] button[data-open-modal]');
      const exitNode = document.querySelector('[data-era-context-control] [data-era-exit]');
      if (!(searchNode instanceof HTMLElement) || !(exitNode instanceof HTMLElement)) {
        throw new Error('Missing mobile header controls');
      }

      const searchRect = searchNode.getBoundingClientRect();
      const exitRect = exitNode.getBoundingClientRect();
      const overlap = Math.max(
        0,
        Math.min(searchRect.right, exitRect.right) - Math.max(searchRect.left, exitRect.left)
      );

      return {
        overlap,
        exitWidth: exitRect.width,
        exitRight: exitRect.right,
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      };
    });

    expect(geometry.overlap).toBe(0);
    expect(geometry.exitWidth).toBeLessThanOrEqual(48);
    expect(geometry.exitRight).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  });

  test('remembered era keeps non-era routes inside the same scoped sidebar', async ({ page }) => {
    await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-era-context', 'CITADEL');

    await page.goto(`${preview}/calendar/okse/`, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-era-context', 'CITADEL');
    await expect(page.locator('.codex-sidebar-global')).toHaveAttribute('hidden', '');

    const activeScopes = await page.locator('.codex-sidebar-era-scope').evaluateAll((nodes) =>
      nodes
        .filter((node) => !node.hasAttribute('hidden'))
        .map((node) => node.getAttribute('data-era-sidebar'))
    );
    expect(activeScopes).toEqual(['CITADEL']);
  });

  test('sidebar exposes the active era plus Universal content and can exit back to the all-era Codex', async ({ page }) => {
    await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });

    const initialScopes = await page.locator('.codex-sidebar-era-scope').evaluateAll((nodes) =>
      nodes
        .filter((node) => !node.hasAttribute('hidden'))
        .map((node) => node.getAttribute('data-era-sidebar'))
    );
    expect(initialScopes).toEqual(['CITADEL']);
    await expect(page.locator('.codex-sidebar-global')).toHaveAttribute('hidden', '');

    const menuButton = page.locator('.sidebar > starlight-menu-button button');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const citadelScope = page.locator('.codex-sidebar-era-scope[data-era-sidebar="CITADEL"]');
    await expect(citadelScope).toBeVisible();
    await expect(page.locator('.codex-sidebar-global')).toBeHidden();
    await expect(page.locator('.codex-sidebar-era-scope[data-era-sidebar="SMOG"]')).toBeHidden();
    await expect(page.locator('.codex-sidebar-era-scope[data-era-sidebar="NEARSIGHT"]')).toBeHidden();
    await expect(page.locator('.codex-sidebar-era-scope[data-era-sidebar="ENTROPY"]')).toBeHidden();
    await expect(citadelScope.getByText('Relationships', { exact: true })).toBeVisible();
    await expect(citadelScope.locator('.codex-sidebar-universal__label')).toHaveText('Universal');

    const degelGroup = citadelScope
      .locator('details.ion-expandable-group')
      .filter({ hasText: 'Degel System' })
      .first();
    await expect(degelGroup.locator(':scope > summary').getByText('Degel System', { exact: true })).toBeVisible();
    if (!(await degelGroup.evaluate((node) => node.hasAttribute('open')))) {
      await degelGroup.locator(':scope > summary').click();
    }

    await expect(citadelScope.getByRole('link', { name: 'Errack', exact: true })).toHaveAttribute('href', '/degel-system/errack/');
    await expect(citadelScope.locator('[data-era-exit]')).toBeVisible();

    await citadelScope.locator('[data-era-exit]').click();
    await page.waitForURL(/\/$/);
    await expect(page.locator('html')).not.toHaveAttribute('data-era-context');
  });
});
