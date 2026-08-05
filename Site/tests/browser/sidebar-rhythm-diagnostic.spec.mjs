import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

test.use({ viewport: { width: 390, height: 844 } });

test('reports the exact owner of the remaining mobile sidebar row gap', async ({ page }) => {
  await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });
  const menuButton = page.locator('.sidebar > starlight-menu-button button');
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const diagnostic = await page.evaluate(() => {
    const citadel = document.querySelector('[data-era-sidebar-branch="CITADEL"]');
    if (!(citadel instanceof HTMLElement)) throw new Error('Missing CITADEL branch');

    const rows = [...citadel.querySelectorAll(':scope > details > .sidebar-list > li')]
      .filter((row) => row instanceof HTMLElement && getComputedStyle(row).display !== 'none')
      .map((row) => {
        const control = row.querySelector(':scope > a, :scope > details > summary, :scope > .empty-group');
        const details = row.querySelector(':scope > details');
        if (!(row instanceof HTMLElement) || !(control instanceof HTMLElement)) return null;
        const rowStyle = getComputedStyle(row);
        const controlStyle = getComputedStyle(control);
        const detailsStyle = details instanceof HTMLElement ? getComputedStyle(details) : null;
        return {
          label: row.dataset.sidebarRow,
          rowRect: row.getBoundingClientRect().toJSON(),
          controlRect: control.getBoundingClientRect().toJSON(),
          rowStyle: {
            display: rowStyle.display,
            marginTop: rowStyle.marginTop,
            marginBottom: rowStyle.marginBottom,
            paddingTop: rowStyle.paddingTop,
            paddingBottom: rowStyle.paddingBottom,
          },
          controlStyle: {
            display: controlStyle.display,
            marginTop: controlStyle.marginTop,
            marginBottom: controlStyle.marginBottom,
            paddingTop: controlStyle.paddingTop,
            paddingBottom: controlStyle.paddingBottom,
          },
          detailsStyle: detailsStyle ? {
            display: detailsStyle.display,
            marginTop: detailsStyle.marginTop,
            marginBottom: detailsStyle.marginBottom,
            paddingTop: detailsStyle.paddingTop,
            paddingBottom: detailsStyle.paddingBottom,
          } : null,
          detailsOpen: details instanceof HTMLDetailsElement ? details.open : null,
        };
      })
      .filter(Boolean);

    const pairs = rows.slice(1).map((row, index) => ({
      from: rows[index].label,
      to: row.label,
      gap: row.controlRect.top - rows[index].controlRect.bottom,
      previousRowBottom: rows[index].rowRect.bottom,
      currentRowTop: row.rowRect.top,
      wrapperGap: row.rowRect.top - rows[index].rowRect.bottom,
    }));
    pairs.sort((a, b) => b.gap - a.gap);

    const list = citadel.querySelector(':scope > details > .sidebar-list');
    const listStyle = list instanceof HTMLElement ? getComputedStyle(list) : null;
    return {
      listStyle: listStyle ? {
        display: listStyle.display,
        rowGap: listStyle.rowGap,
        gap: listStyle.gap,
        marginTop: listStyle.marginTop,
        marginBottom: listStyle.marginBottom,
      } : null,
      largestPairs: pairs.slice(0, 4),
      rows,
    };
  });

  throw new Error(`SIDEBAR_RHYTHM_DIAGNOSTIC ${JSON.stringify(diagnostic)}`);
});
