import assert from 'node:assert/strict';
import test from 'node:test';
import { compileMapData } from '../scripts/generate-map-data.mjs';
import { compileRelationshipData } from '../scripts/generate-relationship-data.mjs';

function record(relativePath, data) {
  return { relativePath, data };
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
