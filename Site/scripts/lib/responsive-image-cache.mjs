import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const CACHE_VERSION = 1;

async function fileDigest(file) {
  return createHash('sha256').update(await fs.readFile(file)).digest();
}

async function inventory(directory, expected) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  if (entries.some((entry) => !entry.isFile())) {
    throw new Error('Cached responsive derivatives include unexpected entries.');
  }
  const names = entries.map((entry) => entry.name).sort();
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    throw new Error('Cached responsive derivatives do not match the expected files.');
  }
  return Promise.all(names.map(async (name) => {
    const bytes = await fs.readFile(path.join(directory, name));
    return { name, size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  }));
}

async function cachedSizes(cacheDir, names) {
  try {
    const saved = JSON.parse(await fs.readFile(path.join(cacheDir, 'manifest.json'), 'utf8'));
    if (saved.version !== CACHE_VERSION) return null;
    const files = await inventory(path.join(cacheDir, 'files'), names);
    if (JSON.stringify(saved.files) !== JSON.stringify(files)) return null;
    return new Map(files.map(({ name, size }) => [name, size]));
  } catch {
    return null;
  }
}

export async function materializeCachedResponsiveVariants({
  siteRoot, category, filename, source, publicOriginal, sharp, generatorFile, files, destination, generate,
}) {
  // Only approved originals reach this function; never restore a cache before public-asset sync.
  if (!['images', 'maps'].includes(category) || path.basename(filename) !== filename) {
    throw new Error('Unexpected responsive image identity.');
  }
  const names = [...files].sort();
  if (!names.length || new Set(names).size !== names.length
    || names.some((name) => path.basename(name) !== name || !/^[^/\\]+\.(?:webp|jpg)$/.test(name))) {
    throw new Error('Unexpected responsive derivative filenames.');
  }

  const fingerprint = createHash('sha256')
    .update(await fileDigest(source))
    .update(await fileDigest(publicOriginal))
    .update(await fileDigest(generatorFile))
    .update(await fileDigest(fileURLToPath(import.meta.url)))
    .update(JSON.stringify(sharp.versions))
    .digest('hex');
  const assetId = createHash('sha256').update(`${category}/${filename}`).digest('hex').slice(0, 16);
  const root = path.join(siteRoot, 'node_modules', '.astro', 'viscerium', 'image-variants');
  const cacheDir = path.join(root, `${assetId}-${fingerprint}`);
  await fs.mkdir(root, { recursive: true });
  let sizes = await cachedSizes(cacheDir, names);
  const reused = sizes !== null;

  if (!sizes) {
    // A directory lock also serializes builds running in separate Node processes.
    const lock = `${cacheDir}.lock`;
    let acquired = false;
    for (let attempt = 0; attempt < 600; attempt++) {
      try {
        await fs.mkdir(lock);
        acquired = true;
        break;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        await sleep(50);
      }
    }
    if (!acquired) throw new Error(`Timed out waiting for responsive cache lock: ${lock}`);
    try {
      // A second builder may have filled the entry while we waited.
      sizes = await cachedSizes(cacheDir, names);
      if (sizes) {
        await fs.mkdir(destination, { recursive: true });
        await Promise.all(names.map((name) => fs.copyFile(
          path.join(cacheDir, 'files', name), path.join(destination, name),
        )));
        return { sizes, reused: true };
      }
      const staging = await fs.mkdtemp(path.join(root, 'staging-'));
      try {
        const output = path.join(staging, 'files');
        await fs.mkdir(output);
        await generate(output);
        const generated = await inventory(output, names);
        await fs.writeFile(path.join(staging, 'manifest.json'),
          `${JSON.stringify({ version: CACHE_VERSION, files: generated })}\n`, 'utf8');
        await fs.rm(cacheDir, { recursive: true, force: true });
        await fs.rename(staging, cacheDir);
        sizes = new Map(generated.map(({ name, size }) => [name, size]));
      } finally {
        await fs.rm(staging, { recursive: true, force: true });
      }
    } finally {
      await fs.rmdir(lock);
    }
  }

  await fs.mkdir(destination, { recursive: true });
  await Promise.all(names.map((name) => fs.copyFile(
    path.join(cacheDir, 'files', name), path.join(destination, name),
  )));
  return { sizes, reused };
}
