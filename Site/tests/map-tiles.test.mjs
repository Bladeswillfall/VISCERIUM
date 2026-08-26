import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MAP_TILE_FORMAT,
  MAP_TILE_SIZE,
  mapTileDescriptor,
  mapTileMaxLevel,
} from '../scripts/generate-map-tiles.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const repoRoot = path.resolve(siteRoot, '..');

async function readSite(relativePath) {
  return fs.readFile(path.join(siteRoot, relativePath), 'utf8');
}

async function readRepo(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

test('Atlas tile pyramid reaches one 512px overview tile without inventing higher source resolution', () => {
  assert.equal(MAP_TILE_SIZE, 512);
  assert.equal(MAP_TILE_FORMAT, 'webp');
  assert.equal(mapTileMaxLevel(480, 240), 0);
  assert.equal(mapTileMaxLevel(1000, 500), 1);
  assert.equal(mapTileMaxLevel(7680, 3840), 4);
  assert.equal(mapTileMaxLevel(16384, 8192), 5);
});

test('CITADEL map descriptor maps Leaflet zoom zero to full source detail', () => {
  assert.deepEqual(mapTileDescriptor({
    mapId: 'errack-citadel',
    width: 7680,
    height: 3840,
    tileCount: 163,
  }), {
    format: 'webp',
    tileSize: 512,
    width: 7680,
    height: 3840,
    maxLevel: 4,
    minNativeZoom: -4,
    maxNativeZoom: 0,
    zoomOffset: 4,
    urlTemplate: '/assets/map-tiles/errack-citadel/{z}/{y}/{x}.webp',
    tileCount: 163,
  });
});

test('map tile generator uses Sharp native Google-layout deep zoom with WebP only', async () => {
  const generator = await readSite('scripts/generate-map-tiles.mjs');
  assert.match(generator, /\.webp\(\{ quality: RESPONSIVE_WEBP_QUALITY, effort: 4 \}\)/);
  assert.match(generator, /\.tile\(\{/);
  assert.match(generator, /size:\s*MAP_TILE_SIZE/);
  assert.match(generator, /layout:\s*'google'/);
  assert.match(generator, /depth:\s*'onetile'/);
  assert.match(generator, /skipBlanks:\s*-1/);
  assert.doesNotMatch(generator, /\.jpe?g\(/i);
});

test('generated Atlas tiles are cleaned before source image validation', async () => {
  const buildContent = await readSite('scripts/build-content.mjs');
  const cleanupIndex = buildContent.indexOf('cleanMapTilePyramids()');
  const validationIndex = buildContent.indexOf('await validateRepositoryImages()');
  assert.ok(cleanupIndex >= 0);
  assert.ok(validationIndex > cleanupIndex);
});

test('map data attaches tile delivery before maps.json is written', async () => {
  const mapData = await readSite('scripts/generate-map-data.mjs');
  const tilesIndex = mapData.indexOf('await generateMapTilePyramids({ maps })');
  const writeIndex = mapData.indexOf('await fs.writeFile(outFile');
  assert.ok(tilesIndex >= 0);
  assert.ok(writeIndex > tilesIndex);
});

test('generated map tile artifacts stay out of Git', async () => {
  const gitignore = await readRepo('.gitignore');
  assert.match(gitignore, /Site\/src\/data\/map-tiles\.json/);
  assert.match(gitignore, /Site\/public\/assets\/map-tiles\//);
});

test('Atlas renderer prefers generated tiles and retains the original image overlay fallback', async () => {
  const renderer = await readSite('src/components/WorldMap.astro');
  assert.match(renderer, /L\.tileLayer\(tiles\.urlTemplate/);
  assert.match(renderer, /minNativeZoom:\s*Number\(tiles\.minNativeZoom\)/);
  assert.match(renderer, /maxNativeZoom:\s*Number\(tiles\.maxNativeZoom\)/);
  assert.match(renderer, /zoomOffset:\s*Number\(tiles\.zoomOffset\)/);
  assert.match(renderer, /L\.imageOverlay\(data\.image/);
  assert.match(renderer, /root\.dataset\.atlasRaster = 'tiles'/);
});
