import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('responsive header mode is set before the header markup renders', () => {
  const header = read('../src/components/CodexHeader.astro');
  const bootstrapIndex = header.indexOf('<script is:inline>');
  const headerIndex = header.indexOf('<div class="header codex-header">');

  assert.ok(bootstrapIndex >= 0 && bootstrapIndex < headerIndex);
  assert.match(header, /window\.matchMedia\('\(min-width: 800px\)'\)\.matches/);
  assert.match(header, /toggleAttribute\('data-codex-wide-header', desktop\)/);
  assert.match(header, /toggleAttribute\('data-codex-mobile-header', !desktop\)/);
});

test('reader media preparation is not duplicated during custom-element connection', () => {
  const script = read('../src/scripts/reader-settings.js');
  const directCalls = script.match(/prepareSensitiveMedia\(\);/g) ?? [];

  assert.equal(directCalls.length, 2);
  assert.match(script, /document\.addEventListener\('astro:page-load', prepareSensitiveMedia\)/);
});
