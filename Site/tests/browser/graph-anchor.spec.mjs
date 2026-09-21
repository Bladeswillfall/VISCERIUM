import { test, expect } from '@playwright/test';

const preview = 'http://127.0.0.1:4321';
const anchorTolerance = 8;

async function connectedNodePoint(canvas) {
  return canvas.evaluate((element) => {
    const cy = element._cyreg?.cy;
    const node = cy?.nodes()
      .filter((candidate) => candidate.connectedEdges().length === 1)
      .first();
    if (!node?.length) return null;
    const position = node.renderedPosition();
    const bounds = element.getBoundingClientRect();
    return {
      x: bounds.left + position.x,
      y: bounds.top + position.y,
      id: node.id(),
    };
  });
}

async function renderedNodePoint(canvas, id) {
  return canvas.evaluate((element, nodeId) => {
    const node = element._cyreg?.cy?.getElementById(nodeId);
    if (!node?.length) return null;
    const position = node.renderedPosition();
    const bounds = element.getBoundingClientRect();
    return {
      x: bounds.left + position.x,
      y: bounds.top + position.y,
    };
  }, id);
}

test('World Graph wheel zoom keeps the graph point under the cursor', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${preview}/graph/`, { waitUntil: 'networkidle' });

  const graph = page.locator('[data-world-graph]');
  const canvas = graph.locator('[data-world-graph-canvas]');
  await expect(graph).toHaveAttribute('data-world-graph-ready', 'true');

  const before = await connectedNodePoint(canvas);
  expect(before).not.toBeNull();
  await page.mouse.move(before.x, before.y);
  await expect(graph).toHaveAttribute('data-world-graph-active-id', before.id);

  const initialZoom = Number(await graph.getAttribute('data-world-graph-zoom'));
  await page.mouse.wheel(0, -120);
  await expect.poll(async () => Number(await graph.getAttribute('data-world-graph-zoom'))).toBeGreaterThan(initialZoom);
  const nextZoom = Number(await graph.getAttribute('data-world-graph-zoom'));
  expect(nextZoom / initialZoom).toBeLessThanOrEqual(1.22);

  const after = await renderedNodePoint(canvas, before.id);
  expect(after).not.toBeNull();
  expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(anchorTolerance);
  expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(anchorTolerance);
});