import { mkdirSync, writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

mkdirSync('timeline-browser-diagnostics', { recursive: true });
test.use({ viewport: { width: 1174, height: 1320 } });

async function openGlobalTimeline(page) {
  await page.goto('http://127.0.0.1:4321/timelines/', { waitUntil: 'networkidle' });
  const globalLink = page.getByRole('link', { name: 'The VISCERIUM Timeline', exact: true }).first();
  await expect(globalLink).toBeVisible();
  await globalLink.click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-vc-island-mounted="true"]')).toHaveCount(1, { timeout: 5_000 });
  await expect(page.locator('[data-vc-canvas] > .vis-timeline')).toHaveCount(1);
  await expect(page.locator('[data-vc-canvas] .vis-item.vc-timeline-item').first()).toBeVisible();
  await page.waitForTimeout(400);
}

async function installFrameProbe(page) {
  await page.locator('[data-vc-canvas]').evaluate((canvas) => {
    const state = {
      active: true,
      samples: 0,
      zeroVisibleSamples: 0,
      longestZeroStreak: 0,
      currentZeroStreak: 0,
      minimumVisibleItems: Number.POSITIVE_INFINITY,
      minimumHeight: Number.POSITIVE_INFINITY,
      maximumHeight: 0,
    };

    const sample = () => {
      if (!state.active || !document.documentElement.contains(canvas)) return;
      const viewport = canvas.querySelector('.vis-panel.vis-center') ?? canvas;
      const bounds = viewport.getBoundingClientRect();
      const visible = [...canvas.querySelectorAll('.vis-item.vc-timeline-item')]
        .filter((element) => {
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
        }).length;
      const height = canvas.getBoundingClientRect().height;

      state.samples += 1;
      state.minimumVisibleItems = Math.min(state.minimumVisibleItems, visible);
      state.minimumHeight = Math.min(state.minimumHeight, height);
      state.maximumHeight = Math.max(state.maximumHeight, height);
      if (visible === 0) {
        state.zeroVisibleSamples += 1;
        state.currentZeroStreak += 1;
        state.longestZeroStreak = Math.max(state.longestZeroStreak, state.currentZeroStreak);
      } else {
        state.currentZeroStreak = 0;
      }
      window.requestAnimationFrame(sample);
    };

    window.__vcInteractionProbe = state;
    window.requestAnimationFrame(sample);
  });
}

async function finishFrameProbe(page) {
  return page.evaluate(() => {
    const state = window.__vcInteractionProbe;
    state.active = false;
    return {
      ...state,
      heightSpread: state.maximumHeight - state.minimumHeight,
    };
  });
}

test('group changes and era jumps never collapse or empty the Chronos viewport', async ({ page }) => {
  await openGlobalTimeline(page);
  await installFrameProbe(page);

  await page.locator('[data-vc-lane]').selectOption('category');
  await page.waitForTimeout(450);
  await page.locator('[data-vc-lane]').selectOption('unified');
  await page.waitForTimeout(450);
  await page.locator('[data-vc-era="smog"]').click();
  await page.waitForTimeout(800);

  const result = await finishFrameProbe(page);
  writeFileSync(
    'timeline-browser-diagnostics/interaction-frame-continuity.json',
    JSON.stringify(result, null, 2),
  );
  await page.screenshot({
    path: 'timeline-browser-diagnostics/interaction-frame-continuity.png',
    fullPage: true,
  });

  expect(result.samples).toBeGreaterThan(60);
  expect(result.minimumVisibleItems).toBeGreaterThan(0);
  expect(result.zeroVisibleSamples).toBe(0);
  expect(result.longestZeroStreak).toBe(0);
  expect(result.heightSpread).toBeLessThanOrEqual(2);
});
