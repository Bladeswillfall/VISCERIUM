import { mkdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';

mkdirSync('timeline-browser-diagnostics', { recursive: true });

const preview = 'http://127.0.0.1:4321';
const readyStatus = 'Interactive graph ready. Use pointer or arrow keys to explore pages.';

async function installTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem('starlight-theme', selectedTheme);
  }, theme);
}

async function selectRenderedNode(page, graph, canvas) {
  const box = await canvas.boundingBox();
  if (!box) return false;
  let seed = 17;
  for (let index = 0; index < 180; index += 1) {
    seed = (seed * 48_271) % 2_147_483_647;
    const x = box.x + 12 + (seed % Math.max(1, Math.floor(box.width - 24)));
    seed = (seed * 48_271) % 2_147_483_647;
    const y = box.y + 12 + (seed % Math.max(1, Math.floor(box.height - 24)));
    await page.mouse.click(x, y);
    if (await graph.getAttribute('data-world-graph-context') === 'selected') return true;
  }
  return false;
}

async function hoverConnectedNode(page, graph, canvas) {
  const box = await canvas.boundingBox();
  if (!box) return false;
  let seed = 29;
  for (let index = 0; index < 220; index += 1) {
    seed = (seed * 48_271) % 2_147_483_647;
    const x = box.x + 12 + (seed % Math.max(1, Math.floor(box.width - 24)));
    seed = (seed * 48_271) % 2_147_483_647;
    const y = box.y + 12 + (seed % Math.max(1, Math.floor(box.height - 24)));
    await page.mouse.move(x, y);
    const source = await graph.getAttribute('data-world-graph-context');
    const neighbours = Number(await graph.getAttribute('data-world-graph-neighbour-count') ?? 0);
    if (source === 'pointer' && neighbours > 0) return true;
  }
  return false;
}

async function inspectGraph(page, viewport, theme) {
  await installTheme(page, theme);
  await page.setViewportSize(viewport);
  const pageErrors = [];
  const firstPartyFailures = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().startsWith(`${preview}/`)) {
      firstPartyFailures.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(`${preview}/`)) firstPartyFailures.push(request.url());
  });

  await page.goto(`${preview}/graph/`, { waitUntil: 'networkidle' });

  const graph = page.locator('[data-world-graph]');
  const canvasHost = graph.locator('[data-world-graph-canvas]');
  const canvas = canvasHost.locator('canvas').first();
  const details = graph.locator('[data-world-graph-details]');
  const reset = graph.getByRole('button', { name: 'Reset view' });
  const fallback = graph.locator('[data-world-graph-fallback]');

  await expect(graph).toHaveAttribute('data-world-graph-ready', 'true');
  await expect(canvasHost).toHaveAttribute('aria-busy', 'false');
  await expect(canvas).toBeVisible();
  await expect(reset).toBeEnabled();
  await expect(graph.locator('[data-world-graph-status]')).toHaveText(readyStatus);
  await expect(fallback).not.toHaveAttribute('open', '');
  await expect(fallback.locator('a')).not.toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

  const graphData = await page.evaluate(async () => {
    const response = await fetch('/sitegraph/sitemap.json');
    return response.json();
  });
  expect(graphData.nodes.length).toBeGreaterThan(1);
  expect(graphData.nodes.every((node) => node.kind === 'page')).toBe(true);
  expect(graphData.edges.every((edge) => edge.kind === 'link')).toBe(true);
  expect(graphData.nodes.some((node) => String(node.id).startsWith('tag:'))).toBe(false);

  const colours = await graph.evaluate((element) => {
    const style = getComputedStyle(element);
    return ['--world-graph-canvas', '--world-graph-text', '--world-graph-node', '--world-graph-edge']
      .map((name) => style.getPropertyValue(name).trim());
  });
  expect(colours.every(Boolean)).toBe(true);
  expect(colours[0]).not.toBe(colours[1]);
  expect(colours[0]).not.toBe(colours[2]);

  expect(await selectRenderedNode(page, graph, canvasHost)).toBe(true);
  await expect(graph).toHaveAttribute('data-world-graph-context', 'selected');
  await expect(details.getByRole('heading')).toBeVisible();
  await expect(details.getByRole('link')).toHaveAttribute('href', /^\//);
  await reset.click();
  await expect(details).toHaveText('Select a page to inspect it.');
  await expect(graph.locator('[data-world-graph-status]')).toHaveText(readyStatus);
  await expect(graph).not.toHaveAttribute('data-world-graph-active-id', /.+/);

  const geometry = await canvasHost.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const renderedCanvas = element.querySelector('canvas');
    return {
      width: rect.width,
      height: rect.height,
      bitmapWidth: renderedCanvas?.width ?? 0,
      bitmapHeight: renderedCanvas?.height ?? 0,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  expect(geometry.width).toBeGreaterThan(240);
  expect(geometry.height).toBeGreaterThan(180);
  expect(geometry.bitmapWidth).toBeGreaterThan(240);
  expect(geometry.bitmapHeight).toBeGreaterThan(180);
  expect(geometry.overflow).toBe(false);
  expect(pageErrors).toEqual([]);
  expect(firstPartyFailures).toEqual([]);

  await page.screenshot({
    path: `timeline-browser-diagnostics/world-graph-${theme}-${viewport.width}.png`,
    fullPage: true,
  });
}

test('World Graph works in the dark desktop layout', async ({ page }) => {
  await inspectGraph(page, { width: 1440, height: 1000 }, 'dark');
});

test('World Graph works in the light mobile layout', async ({ page }) => {
  await inspectGraph(page, { width: 390, height: 844 }, 'light');
});

test('World Graph restores Obsidian-like hover and keyboard exploration', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${preview}/graph/`, { waitUntil: 'networkidle' });

  const graph = page.locator('[data-world-graph]');
  const canvasHost = graph.locator('[data-world-graph-canvas]');
  const details = graph.locator('[data-world-graph-details]');

  await expect(graph).toHaveAttribute('data-world-graph-ready', 'true');
  expect(await hoverConnectedNode(page, graph, canvasHost)).toBe(true);
  await expect(graph).toHaveAttribute('data-world-graph-context', 'pointer');
  expect(Number(await graph.getAttribute('data-world-graph-neighbour-count'))).toBeGreaterThan(0);

  await page.mouse.move(2, 2);
  await expect(graph).not.toHaveAttribute('data-world-graph-context', 'pointer');

  await canvasHost.focus();
  await expect(graph).toHaveAttribute('data-world-graph-context', 'keyboard');
  await expect(details.getByRole('heading')).toBeVisible();
  const firstId = await graph.getAttribute('data-world-graph-active-id');

  await page.keyboard.press('ArrowRight');
  await expect(graph).toHaveAttribute('data-world-graph-context', 'keyboard');
  const secondId = await graph.getAttribute('data-world-graph-active-id');
  expect(secondId).not.toBe(firstId);

  await page.keyboard.press('Enter');
  await expect(graph).toHaveAttribute('data-world-graph-context', 'selected');
  await expect(details.getByRole('link')).toHaveAttribute('href', /^\//);

  await page.keyboard.press('Escape');
  await expect(details).toHaveText('Select a page to inspect it.');
  await expect(graph).not.toHaveAttribute('data-world-graph-active-id', /.+/);
});

test('World Graph keeps the page list when interactive data fails', async ({ page }) => {
  await page.route('**/sitegraph/sitemap.json', (route) => route.abort());
  await page.goto(`${preview}/graph/`, { waitUntil: 'domcontentloaded' });
  const graph = page.locator('[data-world-graph]');
  await expect(graph.locator('[data-world-graph-status]')).toHaveText(
    'The interactive graph is unavailable. Use the page list below.',
  );
  await expect(graph.locator('[data-world-graph-fallback]')).toHaveAttribute('open', '');
  await expect(graph.locator('[data-world-graph-fallback] a').first()).toBeVisible();
  await expect(graph.getByRole('button', { name: 'Reset view' })).toBeDisabled();
});
