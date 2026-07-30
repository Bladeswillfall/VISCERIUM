import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Codex noise source decodes to a WebP image', () => {
  const encoded = read('../src/assets/images/codex-noise.webp.b64.txt').trim();
  const decoded = Buffer.from(encoded, 'base64');

  assert.equal(decoded.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(decoded.subarray(8, 12).toString('ascii'), 'WEBP');
});

test('Codex shell and build pipeline agree on the noise asset URL', () => {
  const build = read('../scripts/build-content.mjs');
  const header = read('../src/components/CodexHeader.astro');

  assert.match(build, /codex-noise-v2\.webp/);
  assert.match(header, /\/assets\/images\/codex-noise-v2\.webp/);
});
