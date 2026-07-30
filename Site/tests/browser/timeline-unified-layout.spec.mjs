import { mkdirSync, writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1174, height: 1320 } });

async function navigateToGlobalTimeline(page) {
  await page.goto('http://127.0.0.1:4321/timelines/', { waitUntil: 'networkidle' });
  const globalLink = page.getByRole('link', { name: 'The VISCERIUM Timeline', exact: true }).first();
  await expect(globalLink).toBeVisible();
  await globalLink.click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-vc-island-mounted="true"]')).toHaveCount(1, { timeout: 5_000 });
  await expect(page.locator('[data-vc-canvas]')).toBeVisible();
  await expect(page.locator('[data-vc-canvas] .vis-custom-time[data-vc-calendar-kind="primary"]').first()).toBeVisible();
  await expect(page.locator('[data-vc-canvas] .vis-item.vc-timeline-item').first()).toBeVisible();
}

async function openGlobalTimeline(page) {
  await navigateToGlobalTimeline(page);
  const sidebarToggle = page.getByRole('button', { name: 'Hide sidebar' });
  if (await sidebarToggle.isVisible()) await sidebarToggle.click();
  await page.waitForTimeout(600);
}

function visibleItemMetrics(canvas) {
  const canvasRect = canvas.getBoundingClientRect();
  const items = [...canvas.querySelectorAll('.vis-item.vc-timeline-item')]
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => (
      rect.width > 0
      && rect.height > 0
      && rect.right > canvasRect.left
      && rect.left < canvasRect.right
      && rect.bottom > canvasRect.top
      && rect.top < canvasRect.bottom
    ));
  return {
    canvasTop: canvasRect.top,
    canvasBottom: canvasRect.bottom,
    count: items.length,
    firstTop: items.length ? Math.min(...items.map((rect) => rect.top)) : null,
    lastBottom: items.length ? Math.max(...items.map((rect) => rect.bottom)) : null,
  };
}

test('unified chronology keeps exact fictional-calendar ticks inside one bottom Chronos axis', async ({ page }) => {
  await openGlobalTimeline(page);

  const canvas = page.locator('[data-vc-canvas]');
  const metrics = await canvas.evaluate((element) => {
    const canvasRect = element.getBoundingClientRect();
    const timeline = element.querySelector(':scope > .vis-timeline');
    const timelineRect = timeline?.getBoundingClientRect();
    const axis = element.querySelector('.vis-panel.vis-bottom');
    const axisRect = axis?.getBoundingClientRect();
    const items = [...element.querySelectorAll('.vis-item.vc-timeline-item')]
      .filter((item) => item.getClientRects().length > 0)
      .map((item) => item.getBoundingClientRect());
    const labels = [...element.querySelectorAll('.vis-labelset > .vis-label')]
      .filter((item) => item.getClientRects().length > 0)
      .map((item) => item.textContent?.trim() ?? '');
    const axisTicks = [...element.querySelectorAll('.vis-custom-time[data-vc-calendar-kind="primary"]')]
      .filter((item) => item.getClientRects().length > 0)
      .map((item) => {
        const labelElement = item.querySelector(':scope > .vc-calendar-time-label');
        const labelRect = labelElement?.getBoundingClientRect();
        return {
          label: item.dataset.vcCalendarLabel ?? '',
          renderedLabel: labelElement?.textContent?.trim() ?? '',
          labelTop: labelRect?.top ?? null,
          labelBottom: labelRect?.bottom ?? null,
          labelVisibility: labelElement ? getComputedStyle(labelElement).visibility : null,
          absoluteDay: Number(item.dataset.absoluteDay),
          unit: item.dataset.unit,
        };
      });

    return {
      canvasHeight: canvasRect.height,
      timelineHeight: timelineRect?.height ?? 0,
      eventCount: items.length,
      firstEventTop: items.length ? Math.min(...items.map((rect) => rect.top)) : null,
      lastEventBottom: items.length ? Math.max(...items.map((rect) => rect.bottom)) : null,
      axisTop: axisRect?.top ?? null,
      axisBottom: axisRect?.bottom ?? null,
      axisTicks,
      labels,
      primaryGridLines: element.querySelectorAll('.vis-custom-time[data-vc-calendar-kind="primary"]').length,
      secondaryGridLines: element.querySelectorAll('.vis-custom-time[data-vc-calendar-kind="secondary"]').length,
      externalAxisCount: document.querySelectorAll('[data-vc-axis], .vc-timeline-axis, .vc-calendar-axis-layer').length,
      nativeLabelsVisible: [...element.querySelectorAll('.vis-time-axis .vis-text')]
        .some((item) => getComputedStyle(item).visibility !== 'hidden'),
      rootVisibility: timeline ? getComputedStyle(timeline).visibility : null,
      hasPinnedHeight: element.hasAttribute('data-vc-pinned-row-height'),
      hasAdaptiveHeight: element.hasAttribute('data-vc-applied-adaptive-height'),
    };
  });
  const visible = await canvas.evaluate(visibleItemMetrics);
  const overview = await page.locator('[data-vc-minimap]').evaluate((element) => ({
    hostHeight: element.getBoundingClientRect().height,
    timelineHeight: element.querySelector(':scope > .vis-timeline')?.getBoundingClientRect().height ?? 0,
  }));

  mkdirSync('timeline-browser-diagnostics', { recursive: true });
  writeFileSync(
    'timeline-browser-diagnostics/unified-native-layout.json',
    JSON.stringify({ metrics, visible, overview }, null, 2),
  );
  await page.screenshot({
    path: 'timeline-browser-diagnostics/unified-native-layout.png',
    fullPage: true,
  });

  expect(metrics.eventCount).toBeGreaterThan(1);
  expect(metrics.labels).toContain('Chronology');
  expect(metrics.canvasHeight).toBeGreaterThanOrEqual(318);
  expect(metrics.canvasHeight).toBeLessThanOrEqual(642);
  expect(Math.abs(metrics.timelineHeight - metrics.canvasHeight)).toBeLessThanOrEqual(2);
  expect(metrics.externalAxisCount).toBe(0);
  expect(metrics.rootVisibility).toBe('visible');
  expect(metrics.nativeLabelsVisible).toBe(false);
  expect(metrics.axisTop).toBeGreaterThan(visible.canvasTop);
  expect(metrics.axisBottom).toBeLessThanOrEqual(visible.canvasBottom + 2);
  expect(metrics.axisTicks.length).toBeGreaterThan(1);
  expect(metrics.axisTicks.every((tick) => Number.isSafeInteger(tick.absoluteDay))).toBe(true);
  expect(metrics.axisTicks.every((tick) => ['year', 'month', 'week', 'day'].includes(tick.unit))).toBe(true);
  expect(metrics.axisTicks.some((tick) => /\d/.test(tick.label))).toBe(true);
  expect(metrics.axisTicks.every((tick) => tick.renderedLabel === tick.label)).toBe(true);
  expect(metrics.axisTicks.every((tick) => tick.labelVisibility === 'visible')).toBe(true);
  expect(metrics.axisTicks.every((tick) => tick.labelTop >= metrics.axisTop - 2)).toBe(true);
  expect(metrics.axisTicks.every((tick) => tick.labelBottom <= metrics.axisBottom + 2)).toBe(true);
  expect(metrics.primaryGridLines).toBeGreaterThan(1);
  expect(metrics.primaryGridLines + metrics.secondaryGridLines).toBeGreaterThan(2);
  expect(metrics.lastEventBottom).toBeLessThanOrEqual(metrics.axisTop + 2);
  expect(metrics.hasPinnedHeight).toBe(false);
  expect(metrics.hasAdaptiveHeight).toBe(false);
  expect(visible.count).toBeGreaterThan(0);
  expect(visible.lastBottom).toBeLessThanOrEqual(visible.canvasBottom + 2);
  expect(overview.hostHeight).toBeLessThanOrEqual(74);
  expect(overview.timelineHeight).toBeLessThanOrEqual(74);
});

test('calendar lines remain locked to event geometry throughout a horizontal drag', async ({ page }) => {
  await openGlobalTimeline(page);
  const canvas = page.locator('[data-vc-canvas]');
  await canvas.scrollIntoViewIfNeeded();

  await canvas.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const centre = bounds.left + bounds.width / 2;
    const nearest = (selector) => [...element.querySelectorAll(selector)]
      .filter((node) => node.getClientRects().length > 0)
      .sort((left, right) => (
        Math.abs(left.getBoundingClientRect().left - centre)
        - Math.abs(right.getBoundingClientRect().left - centre)
      ))[0];
    const eventItem = nearest('.vis-item.vc-timeline-item');
    const calendarLine = nearest('.vis-custom-time[data-vc-calendar-kind="primary"]');
    if (!eventItem || !calendarLine) throw new Error('A visible event and calendar line are required.');

    const samples = [];
    let active = true;
    const sample = () => {
      if (!active) return;
      samples.push(eventItem.getBoundingClientRect().left - calendarLine.getBoundingClientRect().left);
      requestAnimationFrame(sample);
    };
    window.__vcCalendarPanProbe = {
      samples,
      stop() { active = false; },
    };
    requestAnimationFrame(sample);
  });

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Timeline canvas has no bounding box.');
  const startX = box.x + box.width * 0.58;
  const y = box.y + box.height * 0.55;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - 180, y, { steps: 24 });
  const samples = await page.evaluate(() => {
    window.__vcCalendarPanProbe.stop();
    return window.__vcCalendarPanProbe.samples;
  });
  await page.mouse.up();

  const spread = samples.length ? Math.max(...samples) - Math.min(...samples) : Number.POSITIVE_INFINITY;
  writeFileSync(
    'timeline-browser-diagnostics/calendar-pan-lockstep.json',
    JSON.stringify({ samples, spread }, null, 2),
  );
  await page.screenshot({ path: 'timeline-browser-diagnostics/calendar-pan-lockstep.png', fullPage: true });

  expect(samples.length).toBeGreaterThan(5);
  expect(spread).toBeLessThanOrEqual(2);
});

test('the forked grouped renderer does not perform a delayed animated zoom jiggle', async ({ page }) => {
  await navigateToGlobalTimeline(page);

  const samples = await page.locator('[data-vc-canvas]').evaluate((canvas) => new Promise((resolve) => {
    const positions = [];
    const started = performance.now();

    function sample() {
      const canvasRect = canvas.getBoundingClientRect();
      const item = [...canvas.querySelectorAll('.vis-item.vc-timeline-item')].find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0
          && rect.height > 0
          && rect.right > canvasRect.left
          && rect.left < canvasRect.right;
      });
      if (item) positions.push(item.getBoundingClientRect().left);
      if (performance.now() - started < 850) window.requestAnimationFrame(sample);
      else resolve(positions);
    }

    window.requestAnimationFrame(sample);
  }));

  const drift = samples.length ? Math.max(...samples) - Math.min(...samples) : Number.POSITIVE_INFINITY;
  writeFileSync(
    'timeline-browser-diagnostics/unified-idle-drift.json',
    JSON.stringify({ samples, drift }, null, 2),
  );

  expect(samples.length).toBeGreaterThan(20);
  expect(drift).toBeLessThanOrEqual(3);
});
