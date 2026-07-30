import { test, expect } from '@playwright/test';

const storytellerDemoUrl = 'http://127.0.0.1:4321/demo/demo-trade-port/';
const okseDominionUrl = 'http://127.0.0.1:4321/eras/citadel/okse-dominion/';

const almostEqual = (left, right, tolerance = 1) => Math.abs(left - right) <= tolerance;

test.use({ viewport: { width: 1280, height: 900 } });

test('Lore is the default and Storyteller replaces the article body without becoming a second route', async ({ page }) => {
  await page.goto(storytellerDemoUrl, { waitUntil: 'networkidle' });

  const loreTab = page.getByRole('tab', { name: 'Lore' });
  const storytellerTab = page.getByRole('tab', { name: 'Storyteller' });
  const loreBody = page.locator('.sl-markdown-content');
  const storytellerPanel = page.locator('[data-codex-storyteller-panel]');
  const sidebar = page.locator('.right-sidebar-container');

  await expect(loreTab).toHaveAttribute('aria-selected', 'true');
  await expect(storytellerTab).toHaveAttribute('aria-selected', 'false');
  await expect(loreBody).toBeVisible();
  await expect(loreBody.getByRole('heading', { name: 'Port function' })).toBeVisible();
  await expect(storytellerPanel).toBeHidden();
  await expect(sidebar).toBeVisible();

  await storytellerTab.click();

  await expect(storytellerTab).toHaveAttribute('aria-selected', 'true');
  await expect(loreTab).toHaveAttribute('aria-selected', 'false');
  await expect(loreBody).toBeHidden();
  await expect(storytellerPanel).toBeVisible();
  await expect(storytellerPanel.getByRole('heading', { name: 'Experience' })).toBeVisible();
  await expect(storytellerPanel.getByRole('heading', { name: 'Use' })).toBeVisible();
  await expect(storytellerPanel.getByRole('heading', { name: 'Knowledge' })).toBeVisible();
  await expect(storytellerPanel.getByRole('heading', { name: 'Local pressure' })).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-codex-article-view', 'storyteller');
  await expect(page).toHaveURL(storytellerDemoUrl);

  await loreTab.click();
  await expect(loreBody).toBeVisible();
  await expect(storytellerPanel).toBeHidden();
  await expect(sidebar).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-codex-article-view', 'lore');
});

test('Lore and Storyteller tabs support keyboard navigation', async ({ page }) => {
  await page.goto(storytellerDemoUrl, { waitUntil: 'networkidle' });

  const loreTab = page.getByRole('tab', { name: 'Lore' });
  const storytellerTab = page.getByRole('tab', { name: 'Storyteller' });

  await loreTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(storytellerTab).toBeFocused();
  await expect(storytellerTab).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('Home');
  await expect(loreTab).toBeFocused();
  await expect(loreTab).toHaveAttribute('aria-selected', 'true');
});

test('Okse uses the same public switch with canon-grounded faction sections', async ({ page }) => {
  await page.goto(okseDominionUrl, { waitUntil: 'networkidle' });

  const loreTab = page.getByRole('tab', { name: 'Lore' });
  const storytellerTab = page.getByRole('tab', { name: 'Storyteller' });
  const storytellerPanel = page.locator('[data-codex-storyteller-panel]');
  const sidebar = page.locator('.right-sidebar-container');

  await expect(loreTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.sl-markdown-content')).toContainText('Iron roots, blood fruit.');

  await storytellerTab.click();

  await expect(storytellerPanel).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(storytellerPanel.getByRole('heading', { name: 'Presence' })).toBeVisible();
  await expect(storytellerPanel.getByRole('heading', { name: 'Agenda' })).toBeVisible();
  await expect(storytellerPanel.getByRole('heading', { name: 'Reach' })).toBeVisible();
  await expect(storytellerPanel.getByRole('heading', { name: 'Internal friction' })).toBeVisible();
  await expect(storytellerPanel.getByRole('heading', { name: 'Consequences of involvement' })).toBeVisible();
  await expect(storytellerPanel).toContainText('defensive self-sufficiency');
  await expect(storytellerPanel).toContainText('Leysingi');
  await expect(page).toHaveURL(okseDominionUrl);
});

test('CITADEL presents anchored chronicle tabs on a deliberate era-coloured page edge', async ({ page }) => {
  await page.goto(okseDominionUrl, { waitUntil: 'networkidle' });

  const root = page.locator('[data-codex-view-root]');
  const loreTab = page.getByRole('tab', { name: 'Lore' });
  const storytellerTab = page.getByRole('tab', { name: 'Storyteller' });

  await expect(root).toHaveAttribute('data-era-style', 'e1');
  await page.waitForTimeout(180);

  const geometry = await page.evaluate(() => {
    const tabs = document.querySelector('.codex-article-view-tabs');
    const lore = document.querySelector('[data-codex-view-tab="lore"]');
    const storyteller = document.querySelector('[data-codex-view-tab="storyteller"]');
    if (!(tabs instanceof HTMLElement) || !(lore instanceof HTMLElement) || !(storyteller instanceof HTMLElement)) return null;
    const tabsRect = tabs.getBoundingClientRect();
    const loreRect = lore.getBoundingClientRect();
    const storytellerRect = storyteller.getBoundingClientRect();
    const tabStyle = getComputedStyle(tabs);
    return {
      baselineBorder: tabStyle.borderBottomWidth,
      baselineStyle: tabStyle.borderBottomStyle,
      loreClip: getComputedStyle(lore).clipPath,
      storytellerClip: getComputedStyle(storyteller).clipPath,
      loreShadow: getComputedStyle(lore).boxShadow,
      storytellerShadow: getComputedStyle(storyteller).boxShadow,
      overlap: loreRect.right - storytellerRect.left,
      edgeExtension: tabsRect.right - Math.max(loreRect.right, storytellerRect.right),
      loreTop: loreRect.top,
      storytellerTop: storytellerRect.top,
      loreBottom: loreRect.bottom,
      storytellerBottom: storytellerRect.bottom,
      loreHeight: loreRect.height,
      storytellerHeight: storytellerRect.height,
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry.baselineBorder).toBe('1px');
  expect(geometry.baselineStyle).toBe('solid');
  expect(geometry.loreClip).not.toBe('none');
  expect(geometry.storytellerClip).not.toBe('none');
  expect(geometry.loreShadow).toBe('none');
  expect(geometry.storytellerShadow).toBe('none');
  expect(geometry.overlap).toBeGreaterThan(0);
  expect(geometry.edgeExtension).toBeGreaterThan(32);
  expect(almostEqual(geometry.loreBottom, geometry.storytellerBottom)).toBe(true);
  expect(geometry.loreHeight).toBeGreaterThan(geometry.storytellerHeight);
  expect(geometry.loreTop).toBeLessThan(geometry.storytellerTop);

  await storytellerTab.click();
  await expect(storytellerTab).toHaveAttribute('aria-selected', 'true');
  await expect(loreTab).toHaveAttribute('aria-selected', 'false');
  await page.waitForTimeout(180);

  const switched = await page.evaluate(() => {
    const lore = document.querySelector('[data-codex-view-tab="lore"]');
    const storyteller = document.querySelector('[data-codex-view-tab="storyteller"]');
    if (!(lore instanceof HTMLElement) || !(storyteller instanceof HTMLElement)) return null;
    const loreRect = lore.getBoundingClientRect();
    const storytellerRect = storyteller.getBoundingClientRect();
    return {
      loreTop: loreRect.top,
      storytellerTop: storytellerRect.top,
      loreBottom: loreRect.bottom,
      storytellerBottom: storytellerRect.bottom,
      loreHeight: loreRect.height,
      storytellerHeight: storytellerRect.height,
    };
  });

  expect(switched).not.toBeNull();
  expect(almostEqual(switched.loreBottom, switched.storytellerBottom)).toBe(true);
  expect(switched.storytellerHeight).toBeGreaterThan(switched.loreHeight);
  expect(switched.storytellerTop).toBeLessThan(switched.loreTop);
});
