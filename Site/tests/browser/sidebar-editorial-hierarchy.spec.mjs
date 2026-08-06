import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

test.describe('desktop sidebar editorial hierarchy', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('uses Cinzel selectively, a 14px depth step, and larger structural icons', async ({ page }) => {
    await page.goto(`${preview}/eras/citadel/`, { waitUntil: 'networkidle' });

    const geometry = await page.evaluate(() => {
      const sidebar = document.querySelector('#starlight__sidebar');
      const rootRow = document.querySelector('[data-sidebar-row="Degel System"] > details > summary');
      const rootLabel = rootRow?.querySelector('.large');
      const rootIcon = rootRow?.querySelector('.codex-icon');
      const eraBranch = document.querySelector('[data-era-sidebar-branch="CITADEL"]');
      const eraRow = eraBranch?.querySelector(':scope > details > summary');
      const eraLabel = eraRow?.querySelector('.large');
      const eraIcon = eraRow?.querySelector('.codex-icon');
      const categoryRow = eraBranch?.querySelector('[data-sidebar-row="Events"] > details > summary');
      const categoryLabel = categoryRow?.querySelector('.large');
      const categoryIcon = categoryRow?.querySelector('.codex-icon');
      const leafRow = eraBranch?.querySelector('[data-sidebar-row="Relationships"] > a');
      const leafIcon = leafRow?.querySelector('.codex-icon');
      const eraList = eraBranch?.parentElement;
      const categoryList = categoryRow?.parentElement;
      const leafList = categoryRow?.querySelector(':scope + *');

      if (!(sidebar instanceof HTMLElement)
        || !(rootRow instanceof HTMLElement)
        || !(rootLabel instanceof HTMLElement)
        || !(rootIcon instanceof HTMLElement)
        || !(eraBranch instanceof HTMLElement)
        || !(eraRow instanceof HTMLElement)
        || !(eraLabel instanceof HTMLElement)
        || !(eraIcon instanceof HTMLElement)
        || !(categoryRow instanceof HTMLElement)
        || !(categoryLabel instanceof HTMLElement)
        || !(categoryIcon instanceof HTMLElement)
        || !(leafRow instanceof HTMLElement)
        || !(leafIcon instanceof HTMLElement)
        || !(eraList instanceof HTMLElement)
        || !(categoryList instanceof HTMLElement)) {
        throw new Error('Missing desktop sidebar hierarchy fixtures');
      }

      const style = (node) => getComputedStyle(node);
      const px = (value) => Number.parseFloat(value);
      const eventList = categoryRow.parentElement?.querySelector(':scope > details > .sidebar-list');

      if (!(eventList instanceof HTMLElement)) {
        throw new Error('Missing event article list');
      }

      return {
        sidebarWidth: sidebar.getBoundingClientRect().width,
        rootFontFamily: style(rootLabel).fontFamily,
        eraFontFamily: style(eraLabel).fontFamily,
        categoryFontFamily: style(categoryLabel).fontFamily,
        leafFontFamily: style(leafRow).fontFamily,
        rootFontSize: px(style(rootLabel).fontSize),
        eraFontSize: px(style(eraLabel).fontSize),
        categoryFontSize: px(style(categoryLabel).fontSize),
        leafFontSize: px(style(leafRow).fontSize),
        rootFontWeight: style(rootLabel).fontWeight,
        eraFontWeight: style(eraLabel).fontWeight,
        rootIconSize: rootIcon.getBoundingClientRect().width,
        eraIconSize: eraIcon.getBoundingClientRect().width,
        categoryIconSize: categoryIcon.getBoundingClientRect().width,
        leafIconSize: leafIcon.getBoundingClientRect().width,
        eraIndent: px(style(eraList).marginInlineStart),
        categoryIndent: px(style(categoryList).marginInlineStart),
        leafIndent: px(style(eventList).marginInlineStart),
      };
    });

    expect(geometry.sidebarWidth).toBeCloseTo(288, 0);
    expect(geometry.rootFontFamily.toLowerCase()).toContain('cinzel');
    expect(geometry.eraFontFamily.toLowerCase()).toContain('cinzel');
    expect(geometry.categoryFontFamily.toLowerCase()).not.toContain('cinzel');
    expect(geometry.leafFontFamily.toLowerCase()).not.toContain('cinzel');
    expect(geometry.rootFontSize).toBeCloseTo(20, 1);
    expect(geometry.eraFontSize).toBeCloseTo(18, 1);
    expect(geometry.categoryFontSize).toBeCloseTo(16, 1);
    expect(geometry.leafFontSize).toBeCloseTo(14, 1);
    expect(geometry.rootFontWeight).toBe('400');
    expect(geometry.eraFontWeight).toBe('400');
    expect(geometry.rootIconSize).toBeCloseTo(19, 1);
    expect(geometry.eraIconSize).toBeCloseTo(18, 1);
    expect(geometry.categoryIconSize).toBeCloseTo(17, 1);
    expect(geometry.leafIconSize).toBeCloseTo(14, 1);
    expect(geometry.eraIndent).toBeCloseTo(14, 1);
    expect(geometry.categoryIndent).toBeCloseTo(14, 1);
    expect(geometry.leafIndent).toBeCloseTo(14, 1);
  });
});
