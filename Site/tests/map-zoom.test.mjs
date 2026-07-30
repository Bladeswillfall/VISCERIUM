import assert from 'node:assert/strict';
import test from 'node:test';
import { compileMapData } from '../scripts/generate-map-data.mjs';

function mapRecord(data) {
  return {
    relativePath: 'maps/example.md',
    data: {
      type: 'map',
      mapId: 'example',
      title: 'Example Map',
      description: 'Example.',
      image: '/assets/maps/example.webp',
      ...data,
    },
  };
}

test('high-resolution maps get a compact-safe zoom-out floor', () => {
  const maps = compileMapData([
    mapRecord({
      width: 7680,
      height: 3840,
      minZoom: -1,
    }),
  ]);

  assert.equal(maps.example.minZoom, -6);
});

test('map zoom floors remain permissive when an author explicitly allows more zoom-out', () => {
  const maps = compileMapData([
    mapRecord({
      width: 7680,
      height: 3840,
      minZoom: -8,
    }),
  ]);

  assert.equal(maps.example.minZoom, -8);
});

test('marker zoom thresholds are not rewritten by the map zoom floor', () => {
  const maps = compileMapData([
    mapRecord({ width: 1200, height: 900 }),
    {
      relativePath: 'locations/fort.md',
      data: {
        type: 'location',
        title: 'Example Fort',
        map: {
          id: 'example',
          x: 50,
          y: 50,
          minZoom: 2,
        },
      },
    },
  ]);

  assert.equal(maps.example.minZoom, -3);
  assert.equal(maps.example.markers[0].minZoom, 2);
});
