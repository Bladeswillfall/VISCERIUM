import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the Astro island mounts the local Chronos renderer fork without host patches', () => {
  const island = read('../src/components/timeline/TimelineIsland.tsx');
  const renderer = read('../src/lib/timeline/chronos-native-renderer.mjs');
  const fork = read('../src/lib/chronos-fork/VisceriumChronosTimeline.mjs');

  assert.match(renderer, /export function mountTimeline/);
  assert.match(renderer, /VisceriumChronosTimeline/);
  assert.match(fork, /orientation: \{ axis: 'bottom', item: 'top' \}/);
  assert.match(fork, /groupHeightMode: 'fitItems'/);
  assert.match(fork, /rtl: false/);
  assert.match(fork, /#installCalendarAxis\(\)/);
  assert.match(fork, /this\.axis\.getTicks/);
  assert.match(fork, /timeline\.addCustomTime\(tick\.date, id\)/);
  assert.match(fork, /timeline\.removeCustomTime\(id\)/);
  assert.match(fork, /timeline\.on\('rangechanged', sync\)/);
  assert.doesNotMatch(fork, /timeline\.on\('rangechange', sync\)/);
  assert.match(fork, /setOptions\(\{ queue: queueOptions \}\)/);
  assert.doesNotMatch(renderer, /ChronosTimeline\.prototype|_handleZoomWorkaround|MutationObserver|ResizeObserver/);

  assert.match(island, /const cleanupTimeline = mountTimeline\(root, dataset, options\)/);
  assert.match(island, /const cleanupHovercard = installTimelineHovercard\(root, dataset\)/);
  assert.doesNotMatch(island, /prepareTimelineViewportGuard/);
  assert.doesNotMatch(island, /installAdaptiveTimelineGrid/);
  assert.doesNotMatch(island, /installTimelineTooltipContentSync/);
  assert.doesNotMatch(island, /installCalendarYearAxisSync/);
});

test('unified chronology keeps one canonical Chronos group without host remounting', () => {
  const adapter = read('../src/lib/timeline/chronos-adapter.mjs');

  assert.match(adapter, /if \(laneMode === 'unified'\)[\s\S]*const chronology = \{ key: 'chronology', label: 'Chronology' \}/);
  assert.match(adapter, /groups: \[chronology\]/);
  assert.match(adapter, /groupFor: \(\) => chronology/);
  assert.match(adapter, /\{\$\{cleanChronosText\(group\.label\)/);
  assert.match(adapter, /parsed\.groups = parsed\.groups\.map\(\(group\) => \(\{ \.\.\.group, heightMode: 'auto' \}\)\)/);
});

test('the exact fictional-calendar axis and event rows share one stable fixed-height viewport', () => {
  const styles = read('../src/styles/timeline-viewport.css');
  const stackingStyles = read('../src/styles/timeline-stacking.css');
  const axisStyles = read('../src/styles/chronos-calendar-axis.css');
  const renderer = read('../src/lib/timeline/chronos-native-renderer.mjs');
  const fork = read('../src/lib/chronos-fork/VisceriumChronosTimeline.mjs');

  assert.match(styles, /block-size: 27rem/);
  assert.match(styles, /block-size: 22rem/);
  assert.match(styles, /min-height: 4\.5rem/);
  assert.match(styles, /> \.vis-timeline \{[\s\S]*block-size: 100% !important/);
  assert.match(styles, /\.vis-labelset > \.vis-label > \.vis-inner[\s\S]*min-block-size: 2rem/);
  assert.match(renderer, /height: options\.compact \? '22rem' : '24rem'/);
  assert.doesNotMatch(fork, /delete this\.hostTimelineOptions\.height/);
  assert.match(fork, /maxHeight: '40rem'/);
  assert.match(axisStyles, /\.vc-timeline-canvas \.vis-time-axis[\s\S]*display: block/);
  assert.match(axisStyles, /\.vis-panel\.vis-bottom/);
  assert.match(axisStyles, /\.vis-panel\.vis-center > \.vis-content[\s\S]*background: transparent !important/);
  assert.match(axisStyles, /\.vis-custom-time\[data-vc-calendar-kind="secondary"\]/);
  assert.match(axisStyles, /\.vc-calendar-time-label/);
  assert.match(stackingStyles, /Native calendar boundaries live in vis-timeline's vertical background panel/);
  assert.doesNotMatch(stackingStyles, /vc-calendar-grid-layer/);
  assert.match(fork, /label\.className = 'vc-calendar-time-label'/);
  assert.doesNotMatch(axisStyles, /\.vc-calendar-axis-layer|\.vc-calendar-grid-layer/);
  assert.doesNotMatch(fork, /appendChild\(axisLayer\)|appendChild\(gridLayer\)/);
  assert.doesNotMatch(renderer, /data-vc-axis|vc-timeline-axis|axisTicks|renderAxis/);
  assert.doesNotMatch(styles, /vc-pinned-row-height|data-vc-adaptive-height/);
});
