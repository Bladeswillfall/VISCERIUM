import { test, expect } from '@playwright/test';
import { findVaultNoteRoute } from '../helpers/vault-note.mjs';

const okseDominionPath = await findVaultNoteRoute({
  title: 'Okse Dominion',
  type: 'faction',
  era: 'CITADEL',
});
const okseDominionUrl = new URL(okseDominionPath, 'http://127.0.0.1:4321').href;

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

test('Okse prose-led faction hub remains readable without horizontal overflow', async ({ page }) => {
  await page.goto(okseDominionUrl, { waitUntil: 'networkidle' });

  const loreBody = page.locator('#codex-lore-panel');
  await expect(loreBody).toBeVisible();
  await expect(loreBody.getByRole('heading', { name: 'A Dominion of Several Weathers' })).toBeVisible();
  await expect(loreBody.getByRole('heading', { name: 'Faces of the Dominion' })).toBeVisible();

  const desktop = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(desktop.scrollWidth).toBeLessThanOrEqual(desktop.clientWidth + 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });

  const mobileLoreBody = page.locator('#codex-lore-panel');
  await expect(mobileLoreBody).toBeVisible();
  await expect(mobileLoreBody.getByRole('heading', { name: 'A Dominion of Several Weathers' })).toBeVisible();

  const mobile = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.clientWidth + 1);
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
