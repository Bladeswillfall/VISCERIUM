import { test, expect } from '@playwright/test';

const okseDominionUrl = 'http://127.0.0.1:4321/eras/citadel/okse-dominion/';

test.use({ viewport: { width: 1280, height: 900 } });

test('structural chrome is borderless while article callouts retain their borders', async ({ page }) => {
  await page.goto(okseDominionUrl, { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const borderWidths = (selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) return null;
      const style = getComputedStyle(element);
      return [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
    };

    return {
      header: borderWidths('header.header'),
      breadcrumbs: borderWidths('.codex-breadcrumbs'),
      contentPanel: borderWidths('.content-panel'),
      heading: borderWidths('.sl-markdown-content h2'),
      blockquote: borderWidths('.sl-markdown-content blockquote'),
      callout: borderWidths('.sl-markdown-content .starlight-aside'),
    };
  });

  for (const key of ['header', 'breadcrumbs', 'contentPanel', 'heading']) {
    expect(result[key], `${key} should exist`).not.toBeNull();
    expect(result[key]).toEqual(['0px', '0px', '0px', '0px']);
  }

  expect(result.blockquote, 'blockquote should exist').not.toBeNull();
  expect(result.blockquote.some((width) => width !== '0px')).toBe(true);
  expect(result.callout, 'callout should exist').not.toBeNull();
  expect(result.callout.some((width) => width !== '0px')).toBe(true);
});

test('Okse editorial columns sit side by side on desktop and stack on small screens', async ({ page }) => {
  await page.goto(okseDominionUrl, { waitUntil: 'networkidle' });

  const firstColumns = page.locator('.sl-markdown-content .cx-cols').first();
  await expect(firstColumns).toBeVisible();

  const desktop = await firstColumns.locator(':scope > .cx-col').evaluateAll((columns) =>
    columns.map((column) => {
      const rect = column.getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width };
    }),
  );

  expect(desktop).toHaveLength(2);
  expect(desktop[1].left).toBeGreaterThan(desktop[0].left + desktop[0].width - 2);
  expect(Math.abs(desktop[1].top - desktop[0].top)).toBeLessThan(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });

  const mobileColumns = page.locator('.sl-markdown-content .cx-cols').first().locator(':scope > .cx-col');
  const mobile = await mobileColumns.evaluateAll((columns) =>
    columns.map((column) => {
      const rect = column.getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }),
  );

  expect(mobile).toHaveLength(2);
  expect(Math.abs(mobile[1].left - mobile[0].left)).toBeLessThan(2);
  expect(mobile[1].top).toBeGreaterThanOrEqual(mobile[0].top + mobile[0].height - 2);
});

test('Okse uses one full-page raised deck with the global footer rail revealed only at the end', async ({ page }) => {
  await page.goto(okseDominionUrl, { waitUntil: 'networkidle' });

  const pageShell = page.locator('.page');
  const footerRail = page.locator('.ion-codex-footer');
  await expect(pageShell).toHaveCount(1);
  await expect(footerRail).toHaveCount(1);

  const structure = await page.evaluate(() => {
    const shell = document.querySelector('.page');
    const rail = document.querySelector('.ion-codex-footer');
    if (!(shell instanceof HTMLElement) || !(rail instanceof HTMLElement)) return null;

    const shellRect = shell.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const sampleX = Math.max(1, Math.min(window.innerWidth - 2, railRect.left + railRect.width / 2));
    const sampleY = Math.max(1, Math.min(window.innerHeight - 2, railRect.top + railRect.height / 2));
    const topElement = document.elementFromPoint(sampleX, sampleY);

    return {
      railIsNextSibling: shell.nextElementSibling === rail,
      shellLeft: shellRect.left,
      shellWidth: shellRect.width,
      railLeft: railRect.left,
      railWidth: railRect.width,
      pageCoversRailBeforeEnd: topElement === shell || shell.contains(topElement),
      railZIndex: getComputedStyle(rail).zIndex,
      railMarginTop: getComputedStyle(rail).marginTop,
    };
  });

  expect(structure).not.toBeNull();
  expect(structure.railIsNextSibling).toBe(true);
  expect(Math.abs(structure.railLeft - structure.shellLeft)).toBeLessThan(1);
  expect(Math.abs(structure.railWidth - structure.shellWidth)).toBeLessThan(1);
  expect(structure.pageCoversRailBeforeEnd).toBe(true);
  expect(structure.railZIndex).toBe('-1');
  expect(structure.railMarginTop).toBe('-20px');

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(100);

  const revealed = await footerRail.evaluate((rail) => {
    const rect = rail.getBoundingClientRect();
    const sampleX = Math.max(1, Math.min(window.innerWidth - 2, rect.left + rect.width / 2));
    const sampleY = Math.max(1, Math.min(window.innerHeight - 2, rect.top + rect.height / 2));
    const topElement = document.elementFromPoint(sampleX, sampleY);
    return {
      top: rect.top,
      bottom: rect.bottom,
      viewportHeight: window.innerHeight,
      railOwnsSamplePoint: topElement === rail || rail.contains(topElement),
    };
  });

  expect(revealed.top).toBeLessThan(revealed.viewportHeight);
  expect(revealed.bottom).toBeLessThanOrEqual(revealed.viewportHeight + 1);
  expect(revealed.railOwnsSamplePoint).toBe(true);
});
