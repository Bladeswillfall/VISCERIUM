import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
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

test('Codex shell uses the committed noise asset without reconstruction', () => {
  const build = read('../scripts/build-content.mjs');
  const header = read('../src/components/CodexHeader.astro');

  assert.match(header, /\/assets\/images\/codex-noise-v2\.webp/);
  assert.doesNotMatch(build, /base64|decodeShellAsset|syncShellAssets/);
});
