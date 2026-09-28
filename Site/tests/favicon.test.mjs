import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('favicon has no square background and provides a raster fallback', async () => {
  const [svg, png, config, manifest] = await Promise.all([
    readFile('public/favicons/viscerium-favicon.svg', 'utf8'),
    readFile('public/favicons/viscerium-favicon-96.png'),
    readFile('astro.config.mjs', 'utf8'),
    readFile('public/site.webmanifest', 'utf8'),
  ]);

  assert.doesNotMatch(svg, /<rect\b/i);
  assert.match(svg, /prefers-color-scheme:\s*dark/);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 96);
  assert.equal(png.readUInt32BE(20), 96);
  assert.ok(png.includes(Buffer.from('tRNS')), 'PNG must retain transparency');
  assert.match(config, /viscerium-favicon-96\.png/);
  assert.match(config, /viscerium-favicon\.svg/);
  assert.equal(JSON.parse(manifest).icons[0].purpose, 'any');
});
