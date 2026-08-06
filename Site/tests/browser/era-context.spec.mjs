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

  test('remembered era hides only its three sibling era branches', async ({ page }) => {
    await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-era-context', 'CITADEL');

    await page.goto(`${preview}/calendar/okse/`, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-era-context', 'CITADEL');

    const branchState = await page.locator('[data-era-sidebar-branch]').evaluateAll((nodes) =>
      nodes.map((node) => ({
        era: node.getAttribute('data-era-sidebar-branch'),
        hidden: node.hasAttribute('hidden'),
        display: getComputedStyle(node).display,
      }))
    );

    expect(branchState.filter((branch) => branch.era === 'CITADEL').every((branch) => branch.display !== 'none')).toBe(true);
    expect(branchState.filter((branch) => branch.era !== 'CITADEL').every((branch) => branch.hidden || branch.display === 'none')).toBe(true);
    await expect(page.locator('.codex-sidebar-tree')).toBeAttached();
  });

  test('sidebar keeps Universal content in place and hides only inactive eras', async ({ page }) => {
    await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });

    const menuButton = page.locator('.sidebar > starlight-menu-button button');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const tree = page.locator('.codex-sidebar-tree');
    await expect(tree).toBeVisible();
    await expect(page.locator('[data-era-sidebar-toolbar]')).toBeVisible();
    await expect(page.locator('[data-era-sidebar-label="CITADEL"]')).toBeVisible();

    const branchState = await page.locator('[data-era-sidebar-branch]').evaluateAll((nodes) =>
      nodes.map((node) => ({
        era: node.getAttribute('data-era-sidebar-branch'),
        hidden: node.hasAttribute('hidden'),
        display: getComputedStyle(node).display,
      }))
    );
    expect(branchState.filter((branch) => branch.era === 'CITADEL').every((branch) => branch.display !== 'none')).toBe(true);
    expect(branchState.filter((branch) => branch.era !== 'CITADEL').every((branch) => branch.hidden || branch.display === 'none')).toBe(true);

    const degelGroup = tree
      .locator('details.ion-expandable-group')
      .filter({ hasText: 'Degel System' })
      .first();
    await expect(degelGroup.locator(':scope > summary').getByText('Degel System', { exact: true })).toBeVisible();
    if (!(await degelGroup.evaluate((node) => node.hasAttribute('open')))) {
      await degelGroup.locator(':scope > summary').click();
    }

    await expect(tree.getByRole('link', { name: 'Errack', exact: true })).toHaveAttribute('href', '/degel-system/errack/');
    await expect(page.locator('.codex-sidebar-universal__label')).toHaveCount(0);

    await page.locator('[data-era-sidebar-toolbar] [data-era-exit]').click();
    await page.waitForURL(/\/$/);
    await expect(page.locator('html')).not.toHaveAttribute('data-era-context');
  });

  test('sidebar uses the golden-ratio hierarchy without sacrificing touch rhythm', async ({ page }) => {
    await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });

    const menuButton = page.locator('.sidebar > starlight-menu-button button');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const geometry = await page.evaluate(() => {
      const toolbar = document.querySelector('[data-era-sidebar-toolbar]');
      const rootRow = document.querySelector('[data-sidebar-row="Degel System"] > details > summary');
      const rootLabel = rootRow?.querySelector('.large');
      const eraBranch = document.querySelector('[data-era-sidebar-branch="CITADEL"]');
      const eraRow = eraBranch?.querySelector(':scope > details > summary');
      const eraLabel = eraRow?.querySelector('.large');
      const categoryRow = eraBranch?.querySelector('[data-sidebar-row="Events"] > details > summary');
      const categoryLabel = categoryRow?.querySelector('.large');
      const leafRow = eraBranch?.querySelector('[data-sidebar-row="Overview"] > a');

      if (!(toolbar instanceof HTMLElement)
        || !(rootRow instanceof HTMLElement)
        || !(rootLabel instanceof HTMLElement)
        || !(eraBranch instanceof HTMLElement)
        || !(eraRow instanceof HTMLElement)
        || !(eraLabel instanceof HTMLElement)
        || !(categoryRow instanceof HTMLElement)
        || !(categoryLabel instanceof HTMLElement)
        || !(leafRow instanceof HTMLElement)) {
        throw new Error('Missing sidebar hierarchy fixtures');
      }

      const rows = [...eraBranch.querySelectorAll(':scope > details > .sidebar-list > li')]
        .filter((row) => row instanceof HTMLElement && getComputedStyle(row).display !== 'none')
        .map((row) => row.querySelector(':scope > a, :scope > details > summary, :scope > .empty-group'))
        .filter((row) => row instanceof HTMLElement);
      const rects = rows.map((row) => row.getBoundingClientRect());
      const gaps = rects.slice(1).map((rect, index) => rect.top - rects[index].bottom);
      const heights = rects.map((rect) => rect.height);
      const fontSize = (node) => Number.parseFloat(getComputedStyle(node).fontSize);

      return {
        toolbarGap: rootRow.getBoundingClientRect().top - toolbar.getBoundingClientRect().bottom,
        maximumRowGap: Math.max(0, ...gaps),
        minimumRowHeight: Math.min(...heights),
        maximumRowHeight: Math.max(...heights),
        rootRowHeight: rootRow.getBoundingClientRect().height,
        eraRowHeight: eraRow.getBoundingClientRect().height,
        categoryRowHeight: categoryRow.getBoundingClientRect().height,
        leafRowHeight: leafRow.getBoundingClientRect().height,
        rootFont: fontSize(rootLabel),
        eraFont: fontSize(eraLabel),
        categoryFont: fontSize(categoryLabel),
        leafFont: fontSize(leafRow),
      };
    });

    expect(geometry.toolbarGap).toBeLessThanOrEqual(12);
    expect(geometry.maximumRowGap).toBeLessThanOrEqual(6);
    expect(geometry.minimumRowHeight).toBeGreaterThanOrEqual(40);
    expect(geometry.maximumRowHeight).toBeLessThanOrEqual(46);
    expect(geometry.leafRowHeight).toBeGreaterThanOrEqual(40);
    expect(geometry.categoryRowHeight).toBeGreaterThanOrEqual(44);
    expect(geometry.eraRowHeight).toBeGreaterThanOrEqual(46);
    expect(geometry.rootRowHeight).toBeGreaterThanOrEqual(48);

    expect(geometry.leafFont).toBeGreaterThanOrEqual(14);
    expect(geometry.leafFont).toBeLessThanOrEqual(14.1);
    expect(geometry.categoryFont / geometry.leafFont).toBeCloseTo(1.272, 2);
    expect(geometry.eraFont / geometry.leafFont).toBeCloseTo(1.435, 2);
    expect(geometry.rootFont / geometry.leafFont).toBeCloseTo(1.618, 2);
  });
});
