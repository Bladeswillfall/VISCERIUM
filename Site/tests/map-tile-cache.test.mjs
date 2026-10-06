import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareCachedTiles } from '../scripts/lib/map-tile-cache.mjs';
import { mapDefinitionFingerprint } from '../scripts/map-cache-key.mjs';
import { generateMapTilePyramids } from '../scripts/generate-map-tiles.mjs';

test('Atlas cache reuses complete output', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'atlas-cache-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source.webp');
  await fs.writeFile(source, 'source image');
  const options = {
    siteRoot: root,
    mapId: 'test',
    source,
    sharp: { versions: { sharp: 'test' } },
    generatorFile: fileURLToPath(new URL('../scripts/generate-map-tiles.mjs', import.meta.url)),
    generate: async (directory) => {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(path.join(directory, '0.webp'), 'tile');
    },
  };
  const initial = await prepareCachedTiles(options);
  assert.equal(initial.regenerated, true);
  assert.equal((await prepareCachedTiles(options)).regenerated, false);

  const tile = path.join(initial.cacheDir, 'tiles', '0.webp');
  await fs.writeFile(tile, 'modified');
  assert.equal((await prepareCachedTiles(options)).regenerated, true);
  assert.equal(await fs.readFile(tile, 'utf8'), 'tile');

  await fs.rm(tile);
  assert.equal((await prepareCachedTiles(options)).regenerated, true);

  await fs.writeFile(path.join(initial.cacheDir, 'tiles', '.unexpected'), 'private data');
  assert.equal((await prepareCachedTiles(options)).regenerated, true, 'unexpected files invalidate cache');
  await assert.rejects(fs.access(path.join(initial.cacheDir, 'tiles', '.unexpected')));

  await fs.writeFile(source, 'updated source image');
  const updated = await prepareCachedTiles(options);
  assert.equal(updated.regenerated, true);
  assert.notEqual(updated.cacheDir, initial.cacheDir);
});

test('Atlas definition key changes when map membership or frontmatter changes', () => {
  const map = {
    relativePath: 'Eras/CITADEL/Atlas.md',
    data: { type: 'map', mapId: 'citadel' },
    raw: 'type: map\nmapId: citadel\nimage: /assets/maps/atlas.webp\n',
  };
  const next = {
    relativePath: 'Eras/SMOG/Atlas.md',
    data: { type: 'map', mapId: 'smog' },
    raw: 'type: map\nmapId: smog\nimage: /assets/maps/atlas.webp\n',
  };
  const ordinaryNote = { relativePath: 'Notes/Note.md', data: { type: 'article' }, raw: 'edited lore' };
  const original = mapDefinitionFingerprint([map]);

  assert.notEqual(mapDefinitionFingerprint([map, next]), original, 'new map with existing raster changes key');
  assert.notEqual(mapDefinitionFingerprint([{ ...map, raw: map.raw.replace('citadel', 'new-id') }]), original);
  assert.equal(mapDefinitionFingerprint([ordinaryNote, map]), original, 'ordinary lore edits do not bust tile cache');
  assert.equal(mapDefinitionFingerprint([next, map]), mapDefinitionFingerprint([map, next]));
});

test('Atlas generation removes superseded cache entries and unpublished maps', async (t) => {
  const siteRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'atlas-cache-prune-'));
  t.after(() => fs.rm(siteRoot, { recursive: true, force: true }));
  const sharp = (await import('sharp')).default;
  const mapsDir = path.join(siteRoot, 'public', 'assets', 'maps');
  const source = path.join(mapsDir, 'atlas.webp');
  await fs.mkdir(mapsDir, { recursive: true });
  const writeImage = (colour) => sharp({
    create: { width: 600, height: 400, channels: 3, background: colour },
  }).webp({ lossless: true }).toFile(source);
  const cacheRoot = path.join(siteRoot, 'node_modules', '.astro', 'viscerium', 'map-tiles');
  const build = (maps) => generateMapTilePyramids({ siteRoot, maps });

  await writeImage('#a1b2c3');
  await build({ atlas: { image: '/assets/maps/atlas.webp' } });
  const [first] = await fs.readdir(cacheRoot);
  assert.ok(first?.startsWith('atlas-'));

  await writeImage('#c3b2a1');
  await build({ atlas: { image: '/assets/maps/atlas.webp' } });
  const [second] = await fs.readdir(cacheRoot);
  assert.notEqual(second, first);
  assert.equal((await fs.readdir(cacheRoot)).length, 1, 'only current fingerprint remains');

  await build({});
  assert.deepEqual(await fs.readdir(cacheRoot), [], 'unpublished maps leave no stale tiles');
});
