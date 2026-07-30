import { mkdirSync, writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

mkdirSync('timeline-browser-diagnostics', { recursive: true });
test.use({ viewport: { width: 1326, height: 1184 } });

async function openEntropyTimeline(page) {
  await page.goto('http://127.0.0.1:4321/eras/entropy/', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-vc-island-mounted="true"]')).toHaveCount(1, { timeout: 5_000 });
  await expect(page.locator('[data-vc-canvas] > .vis-timeline')).toBeVisible();
  await expect(page.locator('[data-vc-canvas] .vis-item.vc-timeline-item').first()).toBeVisible();
}

function transparentColor(value) {
  return value === 'transparent'
    || /^rgba\([^,]+,[^,]+,[^,]+,\s*0(?:\.0+)?\)$/.test(value.replace(/\s+/g, ''));
}

test('declared lanes keep readable non-overlapping native group rows', async ({ page }) => {
  await openEntropyTimeline(page);
  await page.locator('[data-vc-lane]').selectOption('lane');
  await expect.poll(() => new URL(page.url()).searchParams.get('lane')).toBe('lane');
  await page.waitForTimeout(600);

  const metrics = await page.locator('[data-vc-canvas]').evaluate((canvas) => {
    const visibleRect = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 ? {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      } : null;
    };

    const labels = [...canvas.querySelectorAll('.vis-labelset > .vis-label')]
      .map((element) => ({
        text: element.textContent?.trim() ?? '',
        rect: visibleRect(element),
        innerHeight: element.querySelector(':scope > .vis-inner')?.getBoundingClientRect().height ?? 0,
      }))
      .filter((entry) => entry.rect);
    const groups = [...canvas.querySelectorAll('.vis-foreground > .vis-group')]
      .map(visibleRect)
      .filter(Boolean);

    const sortedLabels = [...labels].sort((a, b) => a.rect.top - b.rect.top);
    const overlaps = [];
    for (let index = 1; index < sortedLabels.length; index += 1) {
      const previous = sortedLabels[index - 1];
      const current = sortedLabels[index];
      if (current.rect.top < previous.rect.bottom - 1) {
        overlaps.push({ previous: previous.text, current: current.text, amount: previous.rect.bottom - current.rect.top });
      }
    }

    const alignment = labels.slice(0, Math.min(labels.length, groups.length)).map((label, index) => ({
      text: label.text,
      topDelta: Math.abs(label.rect.top - groups[index].top),
      heightDelta: Math.abs(label.rect.height - groups[index].height),
    }));

    return { labels, groups, overlaps, alignment };
  });

  writeFileSync(
    'timeline-browser-diagnostics/entropy-declared-lane-layout.json',
    JSON.stringify(metrics, null, 2),
  );
  await page.screenshot({
    path: 'timeline-browser-diagnostics/entropy-declared-lane-layout.png',
    fullPage: true,
  });

  expect(metrics.labels.length).toBeGreaterThan(2);
  expect(metrics.groups.length).toBe(metrics.labels.length);
  expect(metrics.overlaps).toEqual([]);
  expect(metrics.labels.every((label) => label.rect.height >= 31 && label.innerHeight >= 31)).toBe(true);
  expect(metrics.alignment.every((entry) => entry.topDelta <= 1.5 && entry.heightDelta <= 1.5)).toBe(true);
});

test('native fictional-calendar lines remain visible through the event canvas', async ({ page }) => {
  await openEntropyTimeline(page);
  await page.waitForTimeout(450);

  const metrics = await page.locator('[data-vc-canvas]').evaluate((canvas) => {
    const center = canvas.querySelector('.vis-panel.vis-center');
    const centerContent = center?.querySelector(':scope > .vis-content');
    const centerRect = center?.getBoundingClientRect();
    const bars = [...canvas.querySelectorAll('.vis-custom-time[data-vc-calendar-kind]')]
      .map((bar) => {
        const rect = bar.getBoundingClientRect();
        const style = getComputedStyle(bar);
        return {
          kind: bar.dataset.vcCalendarKind,
          unit: bar.dataset.unit,
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
          borderColor: style.borderInlineStartColor,
          borderWidth: style.borderInlineStartWidth,
        };
      })
      .filter((bar) => bar.height > 0);

    return {
      centerTop: centerRect?.top ?? 0,
      centerBottom: centerRect?.bottom ?? 0,
      centerBackground: center ? getComputedStyle(center).backgroundColor : '',
      contentBackground: centerContent ? getComputedStyle(centerContent).backgroundColor : '',
      bars,
    };
  });

  writeFileSync(
    'timeline-browser-diagnostics/entropy-native-grid-lines.json',
    JSON.stringify(metrics, null, 2),
  );

  expect(transparentColor(metrics.centerBackground)).toBe(true);
  expect(transparentColor(metrics.contentBackground)).toBe(true);
  expect(metrics.bars.length).toBeGreaterThan(3);
  expect(metrics.bars.some((bar) => bar.kind === 'primary')).toBe(true);
  expect(metrics.bars.some((bar) => bar.kind === 'secondary')).toBe(true);
  // vis-timeline insets its vertical-background component by the internal item
  // margin. The bars should begin inside that native inset and still cover the
  // complete event rows plus the bottom axis.
  expect(metrics.bars.every((bar) => bar.top <= metrics.centerTop + 24)).toBe(true);
  expect(metrics.bars.every((bar) => bar.bottom >= metrics.centerBottom - 2)).toBe(true);
  expect(metrics.bars.every((bar) => bar.borderWidth !== '0px' && !/rgba?\([^)]*,\s*0\)$/.test(bar.borderColor))).toBe(true);
});
