import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { compileMapData } from '../scripts/generate-map-data.mjs';
import { compileRelationshipData } from '../scripts/generate-relationship-data.mjs';

function record(relativePath, data) {
  return { relativePath, data };
}

function readWebpDimensions(source) {
  assert.equal(source.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(source.subarray(8, 12).toString('ascii'), 'WEBP');

  const chunk = source.subarray(12, 16).toString('ascii');
  if (chunk === 'VP8 ') {
    assert.deepEqual([...source.subarray(23, 26)], [0x9d, 0x01, 0x2a]);
    return {
      width: source.readUInt16LE(26) & 0x3fff,
      height: source.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunk === 'VP8X') {
    return {
      width: source.readUIntLE(24, 3) + 1,
      height: source.readUIntLE(27, 3) + 1,
    };
  }

  if (chunk === 'VP8L') {
    assert.equal(source[20], 0x2f);
    const bits = source.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  assert.fail(`Unsupported WebP chunk type: ${JSON.stringify(chunk)}`);
}

test('Atlas compiler preserves semantic layers, zoom visibility and nested maps', () => {
  const records = [
    record('maps/world.md', {
      type: 'map',
      mapId: 'world',
      title: 'World Map',
      description: 'The world.',
      image: '/assets/maps/world.webp',
      width: 2000,
      height: 1000,
    }),
    record('maps/city.md', {
      type: 'map',
      mapId: 'city',
      title: 'City Map',
      description: 'A nested city map.',
      image: '/assets/maps/city.webp',
      map: {
        id: 'world',
        x: 50,
        y: 40,
        marker: 'map',
        layer: ['maps/settlements'],
      },
    }),
    record('locations/fort.md', {
      type: 'location',
      title: 'Black Fort',
      description: 'A fortified crossing.',
      faction: 'Krass Dominion',
      map: {
        id: 'world',
        x: '72.5',
        y: '35.25',
        marker: 'fortification',
        layer: ['military/forts'],
        minZoom: '2',
      },
    }),
  ];

  const maps = compileMapData(records);
  assert.equal(maps.world.markers.length, 2);

  const child = maps.world.markers.find((marker) => marker.title === 'City Map');
  assert.equal(child.childMapId, 'city');
  assert.equal(child.page, '/maps/city/');
  assert.deepEqual(child.layers, ['maps/settlements']);

  const fort = maps.world.markers.find((marker) => marker.title === 'Black Fort');
  assert.equal(fort.x, 72.5);
  assert.equal(fort.y, 35.25);
  assert.equal(fort.minZoom, 2);
  assert.deepEqual(fort.layers, ['military/forts']);
  assert.equal(fort.marker, 'fortification');
});

test('published Atlas demo uses a managed real WebP map with matching dimensions', () => {
  const sourceNote = new URL('../../Vault/Lore/Demo/Exploration Demo World.md', import.meta.url);
  const { data } = matter(readFileSync(sourceNote, 'utf8'));

  assert.equal(data.status, 'published');
  assert.equal(data.type, 'map');
  assert.equal(data.mapId, 'exploration-demo-world');
  assert.equal(data.image, '/assets/maps/Errack-CITADEL.webp');

  const filename = data.image.split('/').at(-1);
  const sourceMap = new URL(`../../Vault/Assets/Maps/${filename}`, import.meta.url);
  assert.equal(existsSync(sourceMap), true, `${filename} must exist in the managed map asset directory`);

  const dimensions = readWebpDimensions(readFileSync(sourceMap));
  assert.deepEqual(dimensions, { width: data.width, height: data.height });
  assert.deepEqual(dimensions, { width: 7680, height: 3840 });
});

test('relationship compiler deduplicates reciprocal edges and keeps directed metadata', () => {
  const records = [
    record('factions/a.md', {
      slug: 'factions/a',
      type: 'faction',
      title: 'A',
      relationships: {
        allies: ['[[B]]'],
        'member-of': [
          {
            target: '[[Union]]',
            since: '12 EC',
            era: 'CITADEL',
            description: 'Founding member.',
          },
        ],
      },
    }),
    record('factions/b.md', {
      slug: 'factions/b',
      type: 'faction',
      title: 'B',
      relationships: {
        allies: ['[[A]]'],
      },
    }),
    record('factions/union.md', {
      slug: 'factions/union',
      type: 'faction',
      title: 'Union',
    }),
  ];

  const { graph, warnings } = compileRelationshipData(records);
  assert.deepEqual(warnings, []);
  assert.equal(graph.nodes.length, 3);
  assert.equal(graph.edges.length, 2);

  const alliance = graph.edges.find((edge) => edge.type === 'allies');
  assert.equal(alliance.directed, false);

  const membership = graph.edges.find((edge) => edge.type === 'member-of');
  assert.equal(membership.directed, true);
  assert.equal(membership.since, '12 EC');
  assert.equal(membership.era, 'CITADEL');
  assert.equal(membership.description, 'Founding member.');
});

test('relationship compiler reports unresolved explicit targets without inventing nodes', () => {
  const records = [
    record('characters/a.md', {
      slug: 'characters/a',
      type: 'character',
      title: 'A',
      relationships: {
        rivals: ['[[Missing Person]]'],
      },
    }),
  ];

  const { graph, warnings } = compileRelationshipData(records);
  assert.equal(graph.nodes.length, 0);
  assert.equal(graph.edges.length, 0);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Missing Person/);
});
