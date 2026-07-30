import { mkdirSync, writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const eras = ['citadel', 'smog', 'nearsight', 'entropy'];
mkdirSync('timeline-browser-diagnostics', { recursive: true });

function collectErrors(page, label) {
  const messages = [];
  page.on('console', (message) => {
    const entry = `console:${message.type()}: ${message.text()}`;
    messages.push(entry);
    console.log(`[${label}] ${entry}`);
  });
  page.on('pageerror', (error) => {
    const entry = `pageerror: ${error.stack || error.message}`;
    messages.push(entry);
    console.log(`[${label}] ${entry}`);
  });
  page.on('requestfailed', (request) => {
    const entry = `requestfailed: ${request.url()} — ${request.failure()?.errorText}`;
    messages.push(entry);
    console.log(`[${label}] ${entry}`);
  });
  return messages;
}

async function captureStartupLayout(page) {
  await page.waitForTimeout(350);
  const snapshot = await page.locator('[data-vc-canvas]').evaluate((canvas) => {
    const rectOf = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        display: style.display,
        visibility: style.visibility,
        overflow: style.overflow,
        transform: style.transform,
        position: style.position,
      };
    };

    return {
      canvas: rectOf(canvas),
      timeline: rectOf(canvas.querySelector(':scope > .vis-timeline')),
      topPanel: rectOf(canvas.querySelector('.vis-panel.vis-top')),
      leftPanel: rectOf(canvas.querySelector('.vis-panel.vis-left')),
      centerPanel: rectOf(canvas.querySelector('.vis-panel.vis-center')),
      itemset: rectOf(canvas.querySelector('.vis-itemset')),
      foreground: rectOf(canvas.querySelector('.vis-itemset > .vis-foreground')),
      groupRects: [...canvas.querySelectorAll('.vis-foreground > .vis-group')].map(rectOf),
      labels: [...canvas.querySelectorAll('.vis-labelset > .vis-label')].map((element) => ({
        text: element.textContent?.trim(),
        rect: rectOf(element),
      })),
      items: [...canvas.querySelectorAll('.vis-item.vc-timeline-item')].map((element) => ({
        id: element.getAttribute('data-id'),
        className: element.className,
        inlineStyle: element.getAttribute('style'),
        text: element.textContent?.trim(),
        rect: rectOf(element),
      })),
      allVisItems: canvas.querySelectorAll('.vis-item').length,
      eventItems: canvas.querySelectorAll('.vis-item.vc-timeline-item').length,
      foregroundAxis: rectOf(canvas.querySelector('.vis-time-axis.vis-foreground')),
      axisTexts: [...canvas.querySelectorAll('.vis-time-axis .vis-text')].map((element) => ({
        text: element.textContent?.trim(),
        rect: rectOf(element),
      })),
    };
  });
  const slug = new URL(page.url()).pathname.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'root';
  writeFileSync(`timeline-browser-diagnostics/startup-${slug}.json`, JSON.stringify(snapshot, null, 2));
  console.log(`[startup-layout:${slug}] ${JSON.stringify(snapshot)}`);
  return snapshot;
}

async function waitForTimeline(page) {
  await expect(page.locator('[data-vc-island-mounted="true"]')).toHaveCount(1, { timeout: 5_000 });
  await expect(page.locator('[data-vc-canvas]')).toBeVisible();
  await expect(page.locator('[data-vc-fallback]')).toBeHidden();
  await expect(page.locator('[data-vc-canvas] > .vis-timeline')).toHaveCount(1);
  await captureStartupLayout(page);
  await expect.poll(() => page.locator('[data-vc-canvas]').evaluate((canvas) => {
    const bounds = canvas.getBoundingClientRect();
    return [...canvas.querySelectorAll('.vis-item.vc-timeline-item')].some((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0
        && rect.height > 0
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && rect.right > bounds.left
        && rect.left < bounds.right
        && rect.bottom > bounds.top
        && rect.top < bounds.bottom;
    });
  })).toBe(true);
  await page.waitForTimeout(500);
}

async function openEra(page, era) {
  await page.goto(`http://127.0.0.1:4321/eras/${era}/`, { waitUntil: 'networkidle' });
  await waitForTimeline(page);
}

async function openGlobalTimeline(page) {
  await page.goto('http://127.0.0.1:4321/timelines/', { waitUntil: 'networkidle' });
  const globalLink = page.getByRole('link', { name: 'The VISCERIUM Timeline', exact: true }).first();
  await expect(globalLink).toBeVisible();
  await globalLink.click();
  await page.waitForLoadState('networkidle');
  await waitForTimeline(page);
}

async function installContinuityProbe(page) {
  await page.locator('[data-vc-canvas]').evaluate((canvas) => {
    const timeline = canvas.querySelector(':scope > .vis-timeline');
    if (!timeline) throw new Error('Chronos timeline is missing.');
    timeline.dataset.vcContinuityIdentity = 'original';

    const state = {
      replacements: 0,
      samples: 0,
      zeroVisibleSamples: 0,
      longestZeroStreak: 0,
      currentZeroStreak: 0,
      minimumVisibleItems: Number.POSITIVE_INFINITY,
    };

    const observer = new MutationObserver(() => {
      const current = canvas.querySelector(':scope > .vis-timeline');
      if (current && current.dataset.vcContinuityIdentity !== 'original') {
        state.replacements += 1;
        current.dataset.vcContinuityIdentity = 'original';
      }
    });
    observer.observe(canvas, { childList: true });

    const sample = () => {
      if (!document.documentElement.contains(canvas)) return;
      const canvasRect = canvas.getBoundingClientRect();
      const visible = [...canvas.querySelectorAll('.vis-item.vc-timeline-item')]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0
            && rect.height > 0
            && style.display !== 'none'
            && style.visibility !== 'hidden'
            && rect.right > canvasRect.left
            && rect.left < canvasRect.right
            && rect.bottom > canvasRect.top
            && rect.top < canvasRect.bottom;
        }).length;
      state.samples += 1;
      state.minimumVisibleItems = Math.min(state.minimumVisibleItems, visible);
      if (visible === 0) {
        state.zeroVisibleSamples += 1;
        state.currentZeroStreak += 1;
        state.longestZeroStreak = Math.max(state.longestZeroStreak, state.currentZeroStreak);
      } else {
        state.currentZeroStreak = 0;
      }
      window.requestAnimationFrame(sample);
    };
    window.requestAnimationFrame(sample);

    window.__vcTimelineContinuity = { state, observer };
  });
}

async function readContinuityProbe(page) {
  return page.evaluate(() => {
    const probe = window.__vcTimelineContinuity;
    const canvas = document.querySelector('[data-vc-canvas]');
    const timeline = canvas?.querySelector(':scope > .vis-timeline');
    return {
      ...probe?.state,
      identityPreserved: timeline?.dataset.vcContinuityIdentity === 'original',
      canvasHeight: canvas?.getBoundingClientRect().height ?? 0,
      timelineHeight: timeline?.getBoundingClientRect().height ?? 0,
      visibleItems: [...(canvas?.querySelectorAll('.vis-item.vc-timeline-item') ?? [])]
        .filter((element) => element.getClientRects().length > 0).length,
    };
  });
}

for (const era of eras) {
  test(`${era} hydrates and keeps the native Chronos canvas alive`, async ({ page }) => {
    const messages = collectErrors(page, era);
    await openEra(page, era);
    await installContinuityProbe(page);

    const canvas = page.locator('[data-vc-canvas]');
    const initialHeight = await canvas.evaluate((element) => element.getBoundingClientRect().height);

    await page.locator('[data-vc-zoom-in]').click();
    await page.waitForTimeout(250);
    await page.locator('[data-vc-zoom-out]').click();
    await page.waitForTimeout(250);
    await page.locator('[data-vc-lane]').selectOption('lane');
    await expect.poll(() => new URL(page.url()).searchParams.get('lane')).toBe('lane');
    await page.waitForTimeout(350);
    await page.locator('[data-vc-lane]').selectOption('category');
    await expect.poll(() => new URL(page.url()).searchParams.get('lane')).toBe('category');
    await page.waitForTimeout(350);
    await page.locator('[data-vc-lane]').selectOption('unified');
    await expect.poll(() => new URL(page.url()).searchParams.get('lane')).toBeNull();
    await page.waitForTimeout(350);
    await page.locator('[data-vc-reset]').click();
    await page.waitForTimeout(500);

    const result = await readContinuityProbe(page);
    const finalHeight = await canvas.evaluate((element) => element.getBoundingClientRect().height);
    writeFileSync(
      `timeline-browser-diagnostics/${era}-native-continuity.json`,
      JSON.stringify({ result, initialHeight, finalHeight, messages }, null, 2),
    );
    await page.screenshot({ path: `timeline-browser-diagnostics/${era}-native-continuity.png`, fullPage: true });

    expect(result.replacements).toBe(0);
    expect(result.identityPreserved).toBe(true);
    expect(result.visibleItems).toBeGreaterThan(0);
    expect(Math.abs(result.timelineHeight - result.canvasHeight)).toBeLessThanOrEqual(2);
    expect(Math.abs(finalHeight - initialHeight)).toBeLessThanOrEqual(2);
    expect(messages.filter((entry) => entry.startsWith('pageerror:'))).toEqual([]);
    expect(messages.filter((entry) => entry.includes('failed to mount'))).toEqual([]);
  });
}

test('global chronology survives the interaction sequence from the supplied recording', async ({ page }) => {
  const messages = collectErrors(page, 'global-interactions');
  await openGlobalTimeline(page);
  await installContinuityProbe(page);

  const canvas = page.locator('[data-vc-canvas]');
  await canvas.scrollIntoViewIfNeeded();

  for (let index = 0; index < 3; index += 1) {
    await page.locator('[data-vc-zoom-in]').click();
    await page.waitForTimeout(180);
  }
  await page.locator('[data-vc-lane]').selectOption('lane');
  await page.waitForTimeout(350);
  await page.locator('[data-vc-era="smog"]').click();
  await page.waitForTimeout(700);
  await page.locator('[data-vc-zoom-out]').click();
  await page.waitForTimeout(250);
  await page.locator('[data-vc-lane]').selectOption('category');
  await page.waitForTimeout(350);
  await page.locator('[data-vc-lane]').selectOption('unified');
  await page.waitForTimeout(350);
  await page.locator('[data-vc-reset]').click();
  await page.waitForTimeout(600);

  const result = await readContinuityProbe(page);
  writeFileSync(
    'timeline-browser-diagnostics/global-native-interactions.json',
    JSON.stringify({ result, messages, href: page.url() }, null, 2),
  );
  await page.screenshot({ path: 'timeline-browser-diagnostics/global-native-interactions.png', fullPage: true });

  expect(result.replacements).toBe(0);
  expect(result.identityPreserved).toBe(true);
  expect(result.visibleItems).toBeGreaterThan(0);
  expect(result.longestZeroStreak).toBeLessThanOrEqual(2);
  expect(messages.filter((entry) => entry.startsWith('pageerror:'))).toEqual([]);
  expect(messages.filter((entry) => entry.includes('failed to mount'))).toEqual([]);
});
