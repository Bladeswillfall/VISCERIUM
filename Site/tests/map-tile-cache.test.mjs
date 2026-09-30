import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareCachedTiles } from '../scripts/lib/map-tile-cache.mjs';

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
  await fs.writeFile(source, 'updated source image');
  const updated = await prepareCachedTiles(options);
  assert.equal(updated.regenerated, true);
  assert.notEqual(updated.cacheDir, initial.cacheDir);
});
