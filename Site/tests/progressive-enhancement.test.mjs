import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const worldMapUrl = new URL('../src/components/WorldMap.astro', import.meta.url);
const timelineUrl = new URL('../src/components/timeline/TimelineApp.astro', import.meta.url);
const relationshipUrl = new URL('../src/components/RelationshipGraph.astro', import.meta.url);

test('Atlas keeps a readable marker index outside the Leaflet canvas', async () => {
  const source = await fs.readFile(worldMapUrl, 'utf8');

  assert.match(source, /class="atlas__marker-index"/);
  assert.match(source, /t\('viscerium\.map\.markerIndex'/);
  assert.match(source, /<a href=\{marker\.page\}>\{marker\.title\}<\/a>/);
});

test('timeline keeps its HTML fallback visible until enhanced mounting succeeds', async () => {
  const source = await fs.readFile(timelineUrl, 'utf8');

  assert.match(source, /class="vc-timeline-fallback"/);
  assert.match(source, /t\('viscerium\.timeline\.fallbackTitle'\)/);
  assert.match(source, /t\('viscerium\.timeline\.fallbackDescription'\)/);

  const importIndex = source.indexOf("await import('../../lib/timeline/renderer.mjs')");
  const mountIndex = source.indexOf('state.cleanups.push(mountTimeline(');
  const mountedIndex = source.indexOf("mount.setAttribute('data-vc-island-mounted', 'true')");
  const hideFallbackIndex = source.indexOf('fallback.hidden = true');
  const restoreFallbackIndex = source.indexOf('fallback.hidden = false');

  for (const [label, index] of [
    ['renderer import', importIndex],
    ['timeline mount', mountIndex],
    ['mounted marker', mountedIndex],
    ['fallback hide', hideFallbackIndex],
    ['fallback restore', restoreFallbackIndex],
  ]) {
    assert.notEqual(index, -1, `expected ${label} to remain in the timeline enhancement flow`);
  }

  assert.ok(importIndex < mountIndex, 'renderer must load before mounting');
  assert.ok(mountIndex < mountedIndex, 'successful mount must precede the mounted marker');
  assert.ok(mountedIndex < hideFallbackIndex, 'fallback must stay visible until mounting succeeds');
  assert.ok(hideFallbackIndex < restoreFallbackIndex, 'failure path must restore the fallback after enhancement work');
  assert.equal(
    source.indexOf('fallback.hidden = true', hideFallbackIndex + 1),
    -1,
    'fallback must not be hidden anywhere else in the enhancement flow',
  );
});

test('relationship explorer exposes entity links until graph mounting succeeds', async () => {
  const source = await fs.readFile(relationshipUrl, 'utf8');
  assert.match(source, /class="relationship-explorer__list" data-relationship-list aria-label=/);
  assert.match(source, /<a href=\{source\.page\} data-relationship-list-node=\{source\.id\}>/);
  assert.match(source, /<a href=\{target\.page\} data-relationship-list-node=\{target\.id\}>/);
  const ready = source.lastIndexOf("root.dataset.relationshipReady = 'true'");
  const switchToGraph = source.lastIndexOf("setViewMode('graph')");
  assert.ok(ready > source.indexOf('const cy = cytoscape('));
  assert.ok(switchToGraph > ready, 'canvas replaces the fallback only after mounting');
  assert.ok(source.indexOf('link.replaceWith(button)') > ready,
    'entity links become graph-selection buttons only after mounting');
});
