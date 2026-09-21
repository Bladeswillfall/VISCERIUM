import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';

test.use({ viewport: { width: 3018, height: 1698 } });

test('wide article pages keep the main, community, and footer lanes aligned', async ({ page }) => {
  await page.goto(`${preview}/degel-system/errack/`, { waitUntil: 'networkidle' });

  await expect(page.locator('html')).toHaveClass(/codex-sidebar-collapsed/);
  await expect(page.locator('.codex-discussions')).toBeVisible();

  const geometry = await page.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const { left, right, width } = element.getBoundingClientRect();
      return { left, right, width };
    };

    return {
      main: rect('.codex-two-column-content'),
      community: rect('.codex-discussions__inner'),
      footer: rect('.footer-grid'),
    };
  });

  expect(geometry.main).not.toBeNull();
  expect(geometry.community).not.toBeNull();
  expect(geometry.footer).not.toBeNull();
  expect(geometry.main.width).toBeCloseTo(1472, 0);
  expect(Math.abs(geometry.community.left - geometry.main.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.community.right - geometry.main.right)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.footer.left - geometry.main.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.footer.right - geometry.main.right)).toBeLessThanOrEqual(1);
});

test('World Graph fills the wide lane and grows with viewport height', async ({ page }) => {
  await page.goto(`${preview}/graph/`, { waitUntil: 'networkidle' });

  const graph = page.locator('[data-world-graph]');
  await expect(graph).toHaveAttribute('data-world-graph-ready', 'true');

  const geometry = await page.evaluate(() => {
    const graphRect = document.querySelector('[data-world-graph]')?.getBoundingClientRect();
    const frameRect = document.querySelector('.world-graph__frame')?.getBoundingClientRect();
    const canvasRect = document.querySelector('.world-graph__canvas')?.getBoundingClientRect();
    return {
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      graph: graphRect ? { left: graphRect.left, right: graphRect.right, width: graphRect.width } : null,
      frame: frameRect ? { height: frameRect.height } : null,
      canvas: canvasRect ? { height: canvasRect.height } : null,
    };
  });

  expect(geometry.graph).not.toBeNull();
  expect(geometry.frame).not.toBeNull();
  expect(geometry.canvas).not.toBeNull();
  expect(geometry.graph.left).toBeLessThanOrEqual(50);
  expect(geometry.viewportWidth - geometry.graph.right).toBeLessThanOrEqual(50);
  expect(geometry.frame.height).toBeGreaterThan(geometry.viewportHeight * 0.75);
  expect(Math.abs(geometry.canvas.height - geometry.frame.height)).toBeLessThanOrEqual(2);
});
