import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeSafeFloatingPosition } from '../src/lib/ui/floating-position.mjs';

const rect = (left, top, width, height) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height,
});

const viewport = rect(0, 0, 1200, 800);

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('edge triggers keep the preferred top side but choose a safe horizontal alignment', () => {
  const position = computeSafeFloatingPosition({
    anchorRect: rect(145, 420, 110, 32),
    floatingRect: rect(0, 0, 304, 78),
    viewportRect: viewport,
    boundaryRect: rect(74, 300, 1052, 340),
    safeArea: 12,
  });

  assert.equal(position.placement, 'top');
  assert.equal(position.alignment, 'start');
  assert.ok(position.x >= 86);
  assert.ok(position.x + 304 <= 1114);
});

test('a tooltip flips below the trigger when the upper safe zone is unavailable', () => {
  const position = computeSafeFloatingPosition({
    anchorRect: rect(500, 18, 100, 32),
    floatingRect: rect(0, 0, 280, 90),
    viewportRect: viewport,
    safeArea: 12,
  });

  assert.equal(position.placement, 'bottom');
  assert.ok(position.y >= 60);
});

test('right-edge triggers use end alignment instead of clamping a centred tooltip', () => {
  const position = computeSafeFloatingPosition({
    anchorRect: rect(1080, 420, 80, 32),
    floatingRect: rect(0, 0, 300, 78),
    viewportRect: viewport,
    safeArea: 12,
  });

  assert.equal(position.placement, 'top');
  assert.equal(position.alignment, 'end');
  assert.equal(position.x, 860);
});

test('the era primer opts into the reusable system and the page frame installs it globally', () => {
  const primer = read('../src/components/era/EraPrimer.astro');
  const frame = read('../src/components/CodexPageFrame.astro');
  const timeline = read('../src/lib/timeline/hovercard.mjs');

  assert.match(primer, /data-smart-tooltip-boundary/);
  assert.match(primer, /data-smart-tooltip=\{trait\.tip\}/);
  assert.match(primer, /data-smart-tooltip=\{term\.tip\}/);
  assert.match(frame, /installSmartTooltips/);
  assert.match(timeline, /computeSafeFloatingPosition/);
});
