import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';
const centreSampleStep = 2;
const centreSamplingTolerance = centreSampleStep * 2;

async function findConnectedNodePoint(page, graph, canvas) {
  const box = await canvas.boundingBox();
  if (!box) return null;
  let seed = 41;
  for (let index = 0; index < 260; index += 1) {
    seed = (seed * 48_271) % 2_147_483_647;
    const x = box.x + 12 + (seed % Math.max(1, Math.floor(box.width - 24)));
    seed = (seed * 48_271) % 2_147_483_647;
    const y = box.y + 12 + (seed % Math.max(1, Math.floor(box.height - 24)));
    await page.mouse.move(x, y);
    const id = await graph.getAttribute('data-world-graph-active-id');
    const neighbours = Number(await graph.getAttribute('data-world-graph-neighbour-count') ?? 0);
    if (id && neighbours > 0) return { x, y, id };
  }
  return null;
}

async function approximateNodeCentre(page, graph, point) {
  const xs = [];
  for (let dx = -24; dx <= 24; dx += centreSampleStep) {
    await page.mouse.move(point.x + dx, point.y);
    if (await graph.getAttribute('data-world-graph-active-id') === point.id) xs.push(point.x + dx);
  }
  expect(xs.length).toBeGreaterThan(1);
  const x = (Math.min(...xs) + Math.max(...xs)) / 2;

  const ys = [];
  for (let dy = -24; dy <= 24; dy += centreSampleStep) {
    await page.mouse.move(x, point.y + dy);
    if (await graph.getAttribute('data-world-graph-active-id') === point.id) ys.push(point.y + dy);
  }
  expect(ys.length).toBeGreaterThan(1);
  return { x, y: (Math.min(...ys) + Math.max(...ys)) / 2, id: point.id };
}

test('World Graph wheel zoom keeps the graph point under the cursor', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${preview}/graph/`, { waitUntil: 'networkidle' });

  const graph = page.locator('[data-world-graph]');
  const canvas = graph.locator('[data-world-graph-canvas]');
  await expect(graph).toHaveAttribute('data-world-graph-ready', 'true');

  const acquired = await findConnectedNodePoint(page, graph, canvas);
  expect(acquired).not.toBeNull();
  const before = await approximateNodeCentre(page, graph, acquired);
  await page.mouse.move(before.x, before.y);
  await expect(graph).toHaveAttribute('data-world-graph-active-id', before.id);

  const initialZoom = Number(await graph.getAttribute('data-world-graph-zoom'));
  await page.mouse.wheel(0, -120);
  const nextZoom = Number(await graph.getAttribute('data-world-graph-zoom'));
  expect(nextZoom).toBeGreaterThan(initialZoom);
  expect(nextZoom / initialZoom).toBeLessThanOrEqual(1.22);

  const after = await approximateNodeCentre(page, graph, before);
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThanOrEqual(centreSamplingTolerance);
});
