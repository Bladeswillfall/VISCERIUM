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
  if (!box) return null;
  let seed = 29;
  for (let index = 0; index < 220; index += 1) {
    seed = (seed * 48_271) % 2_147_483_647;
    const x = box.x + 12 + (seed % Math.max(1, Math.floor(box.width - 24)));
    seed = (seed * 48_271) % 2_147_483_647;
    const y = box.y + 12 + (seed % Math.max(1, Math.floor(box.height - 24)));
    await page.mouse.move(x, y);
    const source = await graph.getAttribute('data-world-graph-context');
    const neighbours = Number(await graph.getAttribute('data-world-graph-neighbour-count') ?? 0);
    const id = await graph.getAttribute('data-world-graph-active-id');
    if (source === 'pointer' && neighbours > 0 && id) return { x, y, id };
  }
  return null;
}

async function approximateNodeCentre(page, graph, hovered) {
  const xs = [];
  for (let dx = -26; dx <= 26; dx += 2) {
    await page.mouse.move(hovered.x + dx, hovered.y);
    if (await graph.getAttribute('data-world-graph-active-id') === hovered.id) xs.push(hovered.x + dx);
  }
  if (!xs.length) return hovered;
  const x = (Math.min(...xs) + Math.max(...xs)) / 2;

  const ys = [];
  for (let dy = -26; dy <= 26; dy += 2) {
    await page.mouse.move(x, hovered.y + dy);
    if (await graph.getAttribute('data-world-graph-active-id') === hovered.id) ys.push(hovered.y + dy);
  }
  if (!ys.length) return { x, y: hovered.y, id: hovered.id };
  return { x, y: (Math.min(...ys) + Math.max(...ys)) / 2, id: hovered.id };
}

async function emitSyntheticTouch(page, canvas, type, point, identifier = 91) {
  return canvas.evaluate((element, { type, point, identifier }) => {
    const target = element.querySelector('canvas') ?? element;
    const touch = {
      identifier,
      target,
      clientX: point.x,
      clientY: point.y,
      pageX: point.x + window.scrollX,
      pageY: point.y + window.scrollY,
      screenX: point.x,
      screenY: point.y,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    };
    const event = new Event(type, { bubbles: true, cancelable: true });
    const active = type === 'touchend' || type === 'touchcancel' ? [] : [touch];
    Object.defineProperties(event, {
      touches: { value: active },
      targetTouches: { value: active },
      changedTouches: { value: [touch] },
    });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  }, { type, point, identifier });
}

async function dispatchSyntheticWheel(page, canvas, deltaY, deltaMode) {
  const box = await canvas.boundingBox();
  if (!box) return false;
  return canvas.evaluate((element, { deltaY, deltaMode, x, y }) => {
    const target = element.querySelector('canvas') ?? element;
    const event = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY,
      deltaMode,
      clientX: x,
      clientY: y,
    });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  }, {
    deltaY,
    deltaMode,
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  });
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

  const edgeContrast = await graph.evaluate((element) => {
    const style = getComputedStyle(element);
    const raster = document.createElement('canvas');
    raster.width = 2;
    raster.height = 1;
    const context = raster.getContext('2d');
    if (!context) return 0;

    const resolveColour = (name) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${name})`;
      element.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    context.fillStyle = resolveColour('--world-graph-canvas');
    context.fillRect(0, 0, 2, 1);
    context.globalAlpha = Number(style.getPropertyValue('--world-graph-edge-opacity'));
    context.fillStyle = resolveColour('--world-graph-edge');
    context.fillRect(1, 0, 1, 1);

    const pixels = context.getImageData(0, 0, 2, 1).data;
    const linear = (value) => {
      const channel = value / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    };
    const luminance = (offset) => (
      .2126 * linear(pixels[offset])
      + .7152 * linear(pixels[offset + 1])
      + .0722 * linear(pixels[offset + 2])
    );
    const background = luminance(0);
    const edge = luminance(4);
    return (Math.max(background, edge) + .05) / (Math.min(background, edge) + .05);
  });
  expect(edgeContrast).toBeGreaterThanOrEqual(3);

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
  const hovered = await hoverConnectedNode(page, graph, canvasHost);
  expect(hovered).not.toBeNull();
  const centre = await approximateNodeCentre(page, graph, hovered);
  await page.mouse.move(centre.x, centre.y);
  await expect(graph).toHaveAttribute('data-world-graph-context', 'pointer');
  expect(Number(await graph.getAttribute('data-world-graph-neighbour-count'))).toBeGreaterThan(0);

  const zoom = Number(await graph.getAttribute('data-world-graph-zoom'));
  const visibleActiveRadius = 10 * zoom;
  let retainedExpandedTarget = false;
  for (const distance of [16, 15, 14, 13, 12]) {
    if (distance <= visibleActiveRadius + 1) continue;
    const diagonal = distance / Math.SQRT2;
    for (const [dx, dy] of [
      [distance, 0],
      [-distance, 0],
      [0, distance],
      [0, -distance],
      [diagonal, diagonal],
      [-diagonal, diagonal],
      [diagonal, -diagonal],
      [-diagonal, -diagonal],
    ]) {
      await page.mouse.move(centre.x + dx, centre.y + dy);
      if (
        await graph.getAttribute('data-world-graph-context') === 'pointer'
        && await graph.getAttribute('data-world-graph-active-id') === hovered.id
      ) {
        retainedExpandedTarget = true;
        break;
      }
    }
    if (retainedExpandedTarget) break;
  }
  expect(retainedExpandedTarget).toBe(true);

  await page.mouse.move(2, 2);
  await expect(graph).not.toHaveAttribute('data-world-graph-context', 'pointer');

  await canvasHost.focus();
  await expect(graph).toHaveAttribute('data-world-graph-context', 'keyboard');
  await expect(details.getByRole('heading')).toBeVisible();
  const firstId = await graph.getAttribute('data-world-graph-active-id');

  await page.keyboard.press('Enter');
  await expect(graph).toHaveAttribute('data-world-graph-context', 'selected');
  await expect(graph).toHaveAttribute('data-world-graph-active-id', firstId);

  await page.keyboard.press('ArrowRight');
  await expect(graph).toHaveAttribute('data-world-graph-context', 'keyboard');
  const secondId = await graph.getAttribute('data-world-graph-active-id');
  expect(secondId).not.toBe(firstId);

  await page.mouse.move(2, 2);
  await expect(graph).toHaveAttribute('data-world-graph-context', 'keyboard');
  await expect(graph).toHaveAttribute('data-world-graph-active-id', secondId);

  await page.keyboard.press('Enter');
  await expect(graph).toHaveAttribute('data-world-graph-context', 'selected');
  await expect(details.getByRole('link')).toHaveAttribute('href', /^\//);

  await page.keyboard.press('Escape');
  await expect(details).toHaveText('Select a page to inspect it.');
  await expect(graph).not.toHaveAttribute('data-world-graph-active-id', /.+/);
});

test('World Graph expanded touch target selects a node without becoming background pan', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${preview}/graph/`, { waitUntil: 'networkidle' });

  const graph = page.locator('[data-world-graph]');
  const canvasHost = graph.locator('[data-world-graph-canvas]');
  const reset = graph.getByRole('button', { name: 'Reset view' });
  await expect(graph).toHaveAttribute('data-world-graph-ready', 'true');

  const hovered = await hoverConnectedNode(page, graph, canvasHost);
  expect(hovered).not.toBeNull();
  const centre = await approximateNodeCentre(page, graph, hovered);
  const candidates = [];
  for (const distance of [20, 21, 22, 23]) {
    candidates.push(
      { x: centre.x + distance, y: centre.y },
      { x: centre.x - distance, y: centre.y },
      { x: centre.x, y: centre.y + distance },
      { x: centre.x, y: centre.y - distance },
    );
  }

  let selectedThroughTouchHalo = false;
  for (const candidate of candidates) {
    await page.mouse.move(candidate.x, candidate.y);
    if (await graph.getAttribute('data-world-graph-active-id') === hovered.id) continue;

    const startPrevented = await emitSyntheticTouch(page, canvasHost, 'touchstart', candidate);
    const endPrevented = await emitSyntheticTouch(page, canvasHost, 'touchend', candidate);
    if (
      startPrevented
      && endPrevented
      && await graph.getAttribute('data-world-graph-context') === 'selected'
      && await graph.getAttribute('data-world-graph-active-id') === hovered.id
    ) {
      selectedThroughTouchHalo = true;
      break;
    }
    await reset.click();
  }

  expect(selectedThroughTouchHalo).toBe(true);
});

test('World Graph wheel zoom is responsive, pointer-centred, and bounded', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${preview}/graph/`, { waitUntil: 'networkidle' });

  const graph = page.locator('[data-world-graph]');
  const canvasHost = graph.locator('[data-world-graph-canvas]');
  await expect(graph).toHaveAttribute('data-world-graph-ready', 'true');

  const hovered = await hoverConnectedNode(page, graph, canvasHost);
  expect(hovered).not.toBeNull();
  const centre = await approximateNodeCentre(page, graph, hovered);
  await page.mouse.move(centre.x, centre.y);
  await expect(graph).toHaveAttribute('data-world-graph-active-id', hovered.id);
  const initialZoom = Number(await graph.getAttribute('data-world-graph-zoom'));
  expect(initialZoom).toBeGreaterThan(0);

  await page.mouse.wheel(0, -120);
  const zoomedIn = Number(await graph.getAttribute('data-world-graph-zoom'));
  expect(zoomedIn).toBeGreaterThan(initialZoom);
  expect(zoomedIn / initialZoom).toBeLessThanOrEqual(1.22);
  await expect(graph).toHaveAttribute('data-world-graph-active-id', hovered.id);

  await page.mouse.wheel(0, -5_000);
  const boundedZoomIn = Number(await graph.getAttribute('data-world-graph-zoom'));
  expect(boundedZoomIn).toBeGreaterThanOrEqual(zoomedIn);
  expect(boundedZoomIn / zoomedIn).toBeLessThanOrEqual(1.22);

  await page.mouse.wheel(0, 5_000);
  const boundedZoomOut = Number(await graph.getAttribute('data-world-graph-zoom'));
  expect(boundedZoomOut).toBeLessThan(boundedZoomIn);
  expect(boundedZoomOut / boundedZoomIn).toBeGreaterThanOrEqual(.82);

  const beforeLineMode = Number(await graph.getAttribute('data-world-graph-zoom'));
  expect(await dispatchSyntheticWheel(page, canvasHost, -3, 1)).toBe(true);
  const afterLineMode = Number(await graph.getAttribute('data-world-graph-zoom'));
  expect(afterLineMode).toBeGreaterThan(beforeLineMode);
  expect(afterLineMode / beforeLineMode).toBeLessThanOrEqual(1.22);

  const beforePageMode = Number(await graph.getAttribute('data-world-graph-zoom'));
  expect(await dispatchSyntheticWheel(page, canvasHost, 1, 2)).toBe(true);
  const afterPageMode = Number(await graph.getAttribute('data-world-graph-zoom'));
  expect(afterPageMode).toBeLessThan(beforePageMode);
  expect(afterPageMode / beforePageMode).toBeGreaterThanOrEqual(.82);
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
