import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the Chronos fork owns timeline stacking without an injected SVG layer', () => {
  const app = read('../src/components/timeline/TimelineApp.astro');
  const renderer = read('../src/lib/timeline/chronos-native-renderer.mjs');
  const fork = read('../src/lib/chronos-fork/VisceriumChronosTimeline.mjs');
  const styles = read('../src/styles/timeline-stacking.css');

  assert.match(app, /import '\.\.\/\.\.\/styles\/timeline-stacking\.css'/);
  assert.match(renderer, /export function mountTimeline/);
  assert.match(fork, /stack: true/);
  assert.match(fork, /stackSubgroups: true/);
  assert.match(fork, /groupHeightMode: 'fitItems'/);
  assert.doesNotMatch(renderer, /data-vc-year-grid|createYearGridSvg|itemset\.append|MutationObserver|ResizeObserver/);
  assert.match(styles, /\.vis-itemset > \.vis-background[\s\S]*z-index:\s*0 !important/);
  assert.match(styles, /\.vis-itemset > \.vis-foreground[\s\S]*z-index:\s*2 !important/);
  assert.match(styles, /\.vis-foreground \.vis-item\.vc-timeline-item[\s\S]*z-index:\s*3 !important/);
  assert.match(styles, /\.vis-item\.vc-timeline-item\.vis-selected[\s\S]*z-index:\s*5 !important/);
});
