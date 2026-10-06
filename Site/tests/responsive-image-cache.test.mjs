import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { materializeCachedResponsiveVariants } from '../scripts/lib/responsive-image-cache.mjs';
import { generateResponsiveImageVariants } from '../scripts/generate-image-variants.mjs';

async function setup(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'responsive-cache-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source.webp');
  const original = path.join(root, 'original.webp');
  const generatorFile = path.join(root, 'generator.mjs');
  const destination = path.join(root, 'public');
  await Promise.all([
    fs.writeFile(source, 'source-1'),
    fs.writeFile(original, 'public-1'),
    fs.writeFile(generatorFile, 'generator-1'),
  ]);
  let encodes = 0;
  let payload = 'valid';
  let delay = 0;
  let failGeneration = false;
  const run = async (sharp = { versions: { sharp: '1.0.0' } }) => materializeCachedResponsiveVariants({
    siteRoot: root, category: 'images', filename: 'example.webp', source, publicOriginal: original,
    sharp, generatorFile, files: ['example-480.jpg', 'example-480.webp'], destination,
    generate: async (directory) => {
      encodes++;
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      if (failGeneration) {
        await fs.writeFile(path.join(directory, 'example-480.jpg'), payload);
        throw new Error('Simulated derivative failure');
      }
      await Promise.all([
        fs.writeFile(path.join(directory, 'example-480.jpg'), payload),
        fs.writeFile(path.join(directory, 'example-480.webp'), payload),
      ]);
    },
  });
  return { root, source, original, generatorFile, destination, run, encodes: () => encodes, setPayload: s => { payload = s; }, setDelay: ms => { delay = ms; }, setFailGeneration: value => { failGeneration = value; } };
}

test('responsive cache reuses intact derivatives, regenerates on invalidation and rejects corruption', async t => {
  const v = await setup(t);
  assert.equal((await v.run()).reused, false);
  assert.equal((await v.run()).reused, true);
  assert.equal(v.encodes(), 1);
  await fs.rm(v.destination, { recursive: true });
  assert.equal((await v.run()).reused, true);
  assert.equal(await fs.readFile(path.join(v.destination, 'example-480.jpg'), 'utf8'), 'valid');
  await fs.writeFile(v.source, 'source-2');
  assert.equal((await v.run()).reused, false);
  await fs.writeFile(v.original, 'public-2');
  assert.equal((await v.run()).reused, false);
  await fs.writeFile(v.generatorFile, 'generator-2');
  assert.equal((await v.run()).reused, false);
  assert.equal((await v.run({ versions: { sharp: '2.0.0' } })).reused, false);
  const cacheRoot = path.join(v.root, 'node_modules/.astro/viscerium/image-variants');
  // Damage every matching cache entry to avoid depending on filesystem enumeration order.
  await Promise.all((await fs.readdir(cacheRoot)).filter(name => /^[a-f0-9]+-/.test(name)).map(name =>
    fs.writeFile(path.join(cacheRoot, name, 'files/example-480.webp'), 'corrupted')));
  v.setPayload('new-valid');
  assert.equal((await v.run({ versions: { sharp: '2.0.0' } })).reused, false);
  assert.equal(await fs.readFile(path.join(v.destination, 'example-480.webp'), 'utf8'), 'new-valid');
  assert.equal(v.encodes(), 6);
});

test('concurrent builders serialize cache writes and adopt the completed entry', async t => {
  const v = await setup(t);
  v.setDelay(80);
  const first = await Promise.all([v.run(), v.run()]);
  assert.deepEqual(first.map(result => result.reused).sort(), [false, true]);
  assert.equal(v.encodes(), 1);
  assert.equal(await fs.readFile(path.join(v.destination, 'example-480.webp'), 'utf8'), 'valid');

  const cacheRoot = path.join(v.root, 'node_modules/.astro/viscerium/image-variants');
  const entry = (await fs.readdir(cacheRoot)).find(name => /^[a-f0-9]+-/.test(name));
  await fs.writeFile(path.join(cacheRoot, entry, 'files/example-480.webp'), 'corrupted');
  v.setPayload('repaired');
  const repaired = await Promise.all([v.run(), v.run()]);
  assert.deepEqual(repaired.map(result => result.reused).sort(), [false, true]);
  assert.equal(v.encodes(), 2);
  assert.equal(await fs.readFile(path.join(v.destination, 'example-480.webp'), 'utf8'), 'repaired');
  assert.ok(!(await fs.readdir(cacheRoot)).some(name => name.endsWith('.lock')));
});


test('failed generation removes partial outputs and the lock, then a later build succeeds', async t => {
  const v = await setup(t);
  v.setFailGeneration(true);
  await assert.rejects(v.run(), /Simulated derivative failure/);

  const cacheRoot = path.join(v.root, 'node_modules/.astro/viscerium/image-variants');
  assert.deepEqual(await fs.readdir(cacheRoot), [], 'partial entries and locks must be removed');

  v.setFailGeneration(false);
  assert.equal((await v.run()).reused, false);
  assert.equal((await v.run()).reused, true);
  assert.equal(v.encodes(), 2);
  assert.equal(await fs.readFile(path.join(v.destination, 'example-480.webp'), 'utf8'), 'valid');
});

test('invalid cache metadata and unexpected derivatives trigger regeneration', async t => {
  const v = await setup(t);
  await v.run();
  const cacheRoot = path.join(v.root, 'node_modules/.astro/viscerium/image-variants');
  const entry = (await fs.readdir(cacheRoot)).find(name => /^[a-f0-9]+-/.test(name));
  assert.ok(entry);
  const cacheDir = path.join(cacheRoot, entry);

  await fs.writeFile(path.join(cacheDir, 'manifest.json'), '{"version":0,"files":[]}');
  assert.equal((await v.run()).reused, false, 'an outdated manifest cannot authorize reuse');

  const unexpected = path.join(cacheDir, 'files/foreign.jpg');
  await fs.writeFile(unexpected, 'not a requested derivative');
  assert.equal((await v.run()).reused, false, 'the cache must reject extra files');
  await assert.rejects(fs.access(unexpected), { code: 'ENOENT' });
  assert.equal(v.encodes(), 3);
});

test('generator only reuses derivatives when their originals remain public', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'responsive-public-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const siteRoot = path.join(root, 'Site');
  const sourceDir = path.join(root, 'Vault/Assets/Images');
  const publicDir = path.join(siteRoot, 'public/assets/images');
  await Promise.all([fs.mkdir(sourceDir, { recursive: true }), fs.mkdir(publicDir, { recursive: true })]);
  await Promise.all([
    fs.writeFile(path.join(sourceDir, 'visible.webp'), 'visible-source'),
    fs.writeFile(path.join(sourceDir, 'private.webp'), 'private-source'),
    fs.writeFile(path.join(publicDir, 'visible.webp'), 'visible-public-original'),
  ]);
  let encodes = 0;
  const sharp = (source) => ({
    metadata: async () => ({ width: 700, height: 350 }),
    rotate() { return this; },
    resize({ width }) { this.width = width; return this; },
    webp() { this.format = 'webp'; return this; },
    jpeg() { this.format = 'jpg'; return this; },
    async toBuffer() { encodes++; return Buffer.from(`${source}:${this.format}:${this.width}`); },
  });
  sharp.versions = { sharp: 'test-version' };
  const initial = await generateResponsiveImageVariants({ siteRoot, sharp });
  assert.deepEqual(Object.keys(initial.images), ['/assets/images/visible.webp']);
  assert.equal(encodes, 3);
  assert.equal((await generateResponsiveImageVariants({ siteRoot, sharp })).images['/assets/images/visible.webp'].jpeg.length, 2);
  assert.equal(encodes, 3, 'second run should restore only the approved asset from cache');
  await fs.rm(path.join(publicDir, 'visible.webp'));
  const unpublished = await generateResponsiveImageVariants({ siteRoot, sharp });
  assert.deepEqual(Object.keys(unpublished.images), []);
  assert.equal(encodes, 3);
  await assert.rejects(() => fs.access(path.join(publicDir, 'variants/visible-480.webp')));
});

test('CI restores responsive derivatives for both full-build jobs', async () => {
  const workflow = await fs.readFile(new URL('../../.github/workflows/checks.yml', import.meta.url), 'utf8');
  const build = workflow.split(/^  build:\n/m)[1]?.split(/^  obsidian_plugin:\n/m)[0];
  const contact = workflow.split(/^  contact:\n/m)[1]?.split(/^  verify:\n/m)[0];
  assert.ok(build && contact, 'both full-build jobs must exist');
  assert.equal([...workflow.matchAll(/name: Restore responsive variant cache/g)].length, 2);
  for (const job of [build, contact]) {
    assert.match(job, /name: Restore responsive variant cache/);
    assert.match(job, /path: Site\/node_modules\/\.astro\/viscerium\/image-variants/);
    assert.match(job, /key: responsive-variants-v1-/);
    assert.match(job, /id: responsive_cache/);
    assert.match(job, /Build time: \$\(\(SECONDS - start\)\) seconds/);
    assert.match(job, /Local responsive cache size:/);
    assert.match(job, /steps\.responsive_cache\.outputs\.cache-hit/);
    assert.match(job, /Vault\/Lore\/\*\*\/\*\.md/);
    assert.ok(job.indexOf('name: Restore responsive variant cache') < job.indexOf('npm run build'),
      'cache must restore before the site build');
  }
});
