import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { degelSystemMap } from '../src/data/degel-system-map.mjs';

test('Degel map objects use lightweight WebP placeholder paths', () => {
  for (const object of degelSystemMap.objects) {
    assert.match(
      object.image,
      /^\/assets\/images\/degel-system\/[a-z0-9-]+\.webp$/,
      `${object.slug} should use a Degel System WebP asset`,
    );
  }
});

test('The Shards are Errack ring fortresses rather than an asteroid belt', () => {
  const errack = degelSystemMap.objects.find(({ slug }) => slug === 'degel-system/errack');
  const shards = degelSystemMap.objects.find(({ slug }) => slug === 'degel-system/the-shards');

  assert.ok(errack);
  assert.ok(shards);
  assert.equal(shards.kind, 'Planetary ring fortresses');
  assert.equal(shards.visual, 'ring');
  assert.equal(shards.x, errack.x);
  assert.equal(shards.y, errack.y);
  assert.equal(shards.mobileX, errack.mobileX);
  assert.equal(shards.mobileY, errack.mobileY);
});

test('Degel placeholder artwork is committed as valid WebP assets', async () => {
  for (const filename of [
    'degel.webp',
    'crucibus.webp',
    'errack.webp',
    'eye-of-vordr.webp',
    'eye-of-visi.webp',
    'the-shards.webp',
  ]) {
    const asset = await readFile(
      new URL(`../public/assets/images/degel-system/${filename}`, import.meta.url),
    );
    assert.ok(asset.length > 12, `${filename} should not be empty`);
    assert.equal(asset.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(asset.subarray(8, 12).toString('ascii'), 'WEBP');
  }
});
