import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import { compileMapData, loadPluginMarkerSources } from '../scripts/generate-map-data.mjs';

function record(relativePath, data) {
  return { relativePath, data };
}

test('TTRPG Maps sidecars own geometry while linked notes own public meaning', () => {
  const records = [
    record('maps/world.md', {
      type: 'map',
      mapId: 'world',
      title: 'World Map',
      description: 'The world.',
      image: '/assets/maps/world.webp',
      width: 2000,
      height: 1000,
      mapMarkers: 'Assets/Maps/world.webp.markers.json',
    }),
    record('lore/fort.md', {
      sourcePath: 'Lore/Fort.md',
      type: 'location',
      title: 'Black Fort',
      description: 'A fortified crossing.',
      era: 'CITADEL',
      faction: 'Krass Dominion',
      map: {
        id: 'world',
        x: 72.5,
        y: 35.25,
        marker: 'fortification',
        layer: ['military/forts'],
        minZoom: 2,
      },
    }),
  ];
  const warnings = [];
  const maps = compileMapData(records, {
    warnings,
    pluginSources: {
      world: {
        layers: [{ id: 'forts', name: 'civilisation/fortifications', visible: true }],
        markers: [{
          id: 'fort-marker',
          x: 0.255,
          y: 0.75,
          layer: 'forts',
          link: 'Lore/Fort.md',
          minZoom: 0.5,
        }],
      },
    },
  });

  assert.deepEqual(warnings, []);
  assert.equal(maps.world.markers.length, 1);
  const fort = maps.world.markers[0];
  assert.equal(fort.x, 25.5);
  assert.equal(fort.y, 75);
  assert.equal(fort.marker, 'fortification');
  assert.equal(fort.minZoom, 2, 'public zoom remains note-owned');
  assert.deepEqual(fort.layers, ['civilisation/fortifications', 'military/forts']);
  assert.equal(fort.page, '/lore/fort/');
});

test('TTRPG Maps marker sources load only from safe vault-relative paths', async () => {
  const vaultRoot = mkdtempSync(path.join(tmpdir(), 'viscerium-map-'));
  const markerDir = path.join(vaultRoot, 'Assets', 'Maps');
  mkdirSync(markerDir, { recursive: true });
  const sidecar = path.join(markerDir, 'world.webp.markers.json');
  writeFileSync(sidecar, JSON.stringify({ layers: [], markers: [] }));

  const records = [record('maps/world.md', {
    type: 'map',
    mapId: 'world',
    mapMarkers: 'Assets/Maps/world.webp.markers.json',
  })];
  const loaded = await loadPluginMarkerSources(records, { vaultRoot });
  assert.deepEqual(loaded.warnings, []);
  assert.deepEqual(loaded.pluginSources.world, { layers: [], markers: [] });

  const unsafe = await loadPluginMarkerSources([
    record('maps/unsafe.md', {
      type: 'map',
      mapId: 'unsafe',
      mapMarkers: '../outside.json',
    }),
  ], { vaultRoot });
  assert.equal(unsafe.pluginSources.unsafe, undefined);
  assert.match(unsafe.warnings[0], /unsafe/);
});

test('the real CITADEL demo is wired to a checked-in TTRPG Maps sidecar', () => {
  const noteFile = new URL('../../Vault/Lore/Demo/Exploration Demo World.md', import.meta.url);
  const { data, content } = matter(readFileSync(noteFile, 'utf8'));
  assert.equal(data.mapId, 'exploration-demo-world');
  assert.equal(data.mapMarkers, 'Assets/Maps/Errack-CITADEL.webp.markers.json');
  assert.match(content, /```zoommap/);
  assert.match(content, /render: canvas/);

  const markerFile = new URL(`../../Vault/${data.mapMarkers}`, import.meta.url);
  assert.equal(existsSync(markerFile), true);
  const sidecar = JSON.parse(readFileSync(markerFile, 'utf8'));
  assert.equal(sidecar.markers.length, 5);
  assert.equal(sidecar.layers.length, 5);
  for (const marker of sidecar.markers) {
    assert.equal(typeof marker.link, 'string');
    assert.ok(marker.x >= 0 && marker.x <= 1);
    assert.ok(marker.y >= 0 && marker.y <= 1);
  }
});
