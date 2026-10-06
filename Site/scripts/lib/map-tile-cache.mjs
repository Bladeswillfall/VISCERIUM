import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CACHE_VERSION = 1;

async function tileEntries(directory) {
  const entries = await fs.readdir(directory, { recursive: true, withFileTypes: true });
  if (!entries.length || entries.some((entry) =>
    entry.name.startsWith('.')
    || (!entry.isDirectory() && (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.webp')))) {
    throw new Error('Atlas tile cache is empty or has unexpected files.');
  }
  const files = entries.filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name)).sort();
  if (!files.length) throw new Error('Atlas tile cache has no tiles.');
  return Promise.all(files.map(async (file) => {
    const bytes = await fs.readFile(file);
    return {
      path: path.relative(directory, file).split(path.sep).join('/'),
      size: bytes.length,
      digest: createHash('sha256').update(bytes).digest('hex'),
    };
  }));
}

async function cachedCount(cacheDir) {
  try {
    const saved = JSON.parse(await fs.readFile(path.join(cacheDir, 'manifest.json'), 'utf8'));
    if (saved.version !== CACHE_VERSION || !Array.isArray(saved.tiles) || !saved.tiles.length) return 0;
    const tiles = await tileEntries(path.join(cacheDir, 'tiles'));
    return JSON.stringify(tiles) === JSON.stringify(saved.tiles) ? tiles.length : 0;
  } catch {
    return 0;
  }
}

export async function prepareCachedTiles({ siteRoot, mapId, source, sharp, generatorFile, generate }) {
  const root = path.join(siteRoot, 'node_modules', '.astro', 'viscerium', 'map-tiles');
  await fs.mkdir(root, { recursive: true });
  const fingerprint = createHash('sha256')
    .update(await fs.readFile(source))
    .update(await fs.readFile(generatorFile))
    .update(await fs.readFile(fileURLToPath(import.meta.url)))
    .update(JSON.stringify(sharp.versions))
    .digest('hex');
  const cacheDir = path.join(root, `${mapId}-${fingerprint}`);
  let count = await cachedCount(cacheDir);
  let regenerated = false;

  if (!count) {
    const temporary = await fs.mkdtemp(path.join(root, `${mapId}-staging-`));
    try {
      const tiles = path.join(temporary, 'tiles');
      await generate(tiles);
      const entries = await tileEntries(tiles);
      await fs.writeFile(path.join(temporary, 'manifest.json'),
        `${JSON.stringify({ version: CACHE_VERSION, tiles: entries })}\n`, 'utf8');

      // ponytail: builds sharing a cache directory must be serialized; CI jobs use separate workspaces.
      await fs.rm(cacheDir, { recursive: true, force: true });
      await fs.rename(temporary, cacheDir);
      count = entries.length;
      regenerated = true;
    } finally {
      await fs.rm(temporary, { recursive: true, force: true });
    }
  }

  return { cacheDir, count, regenerated };
}
