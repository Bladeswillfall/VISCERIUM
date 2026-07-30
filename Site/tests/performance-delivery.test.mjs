import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const siteRoot = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, siteRoot), 'utf8');
}

test('web fonts are discovered from the document head rather than a CSS import chain', async () => {
  const [config, typography] = await Promise.all([
    read('astro.config.mjs'),
    read('src/styles/typography.css'),
  ]);

  assert.doesNotMatch(typography, /@import\s+url\([^)]*fonts\.googleapis\.com/i);
  assert.match(config, /rel:\s*'preconnect',[\s\S]*fonts\.googleapis\.com/);
  assert.match(config, /rel:\s*'preconnect',[\s\S]*fonts\.gstatic\.com/);
  assert.match(config, /media:\s*'print',[\s\S]*onload:/);
  assert.match(config, /head:\s*\[\.\.\.feedHead,\s*\.\.\.fontHead,/);
});

test('static assets receive a useful repeat-visit cache lifetime', async () => {
  const headers = await read('public/_headers');

  assert.match(
    headers,
    /\/assets\/\*\s+Cache-Control:\s+public,\s+max-age=2592000/,
  );
  assert.match(
    headers,
    /\/_astro\/\*\s+Cache-Control:\s+public,\s+max-age=31536000,\s+immutable/,
  );
});
