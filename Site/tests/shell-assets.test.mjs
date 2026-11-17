import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readBinary = (path) => readFileSync(new URL(path, import.meta.url));

test('committed Codex shell images are WebP files', () => {
  for (const path of [
    '../public/assets/images/codex-noise-v2.webp',
    '../public/assets/images/era-placeholder-sigil.webp',
    '../public/assets/images/citadel-era-map.webp',
  ]) {
    const image = readBinary(path);
    assert.equal(image.subarray(0, 4).toString('ascii'), 'RIFF', path);
    assert.equal(image.subarray(8, 12).toString('ascii'), 'WEBP', path);
  }
});
