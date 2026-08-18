import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const worldMapUrl = new URL('../src/components/WorldMap.astro', import.meta.url);
const timelineUrl = new URL('../src/components/timeline/TimelineApp.astro', import.meta.url);

test('Atlas keeps a readable marker index outside the Leaflet canvas', async () => {
  const source = await fs.readFile(worldMapUrl, 'utf8');

  assert.match(source, /class="atlas__marker-index"/);
  assert.match(source, /Marker index/);
  assert.match(source, /<a href=\{marker\.page\}>\{marker\.title\}<\/a>/);
});

test('timeline ships a chronological HTML fallback and restores it on mount failure', async () => {
  const source = await fs.readFile(timelineUrl, 'utf8');

  assert.match(source, /class="vc-timeline-fallback"/);
  assert.match(source, /aria-label="Chronological list"/);
  assert.match(source, /This list remains available when the interactive timeline cannot run\./);
  assert.match(source, /fallback\.hidden = false/);
});
