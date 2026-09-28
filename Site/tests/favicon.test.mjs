import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import test from 'node:test';

function inspectPng(bytes, expectedSize) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  let width, height, palette, alpha;
  const idats = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const tag = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (tag === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, '8-bit indexed PNG expected');
      assert.equal(data[9], 3, 'PNG must have an indexed palette');
    }
    if (tag === 'PLTE') palette = data;
    if (tag === 'tRNS') alpha = data;
    if (tag === 'IDAT') idats.push(data);
    offset += length + 12;
    if (tag === 'IEND') break;
  }
  assert.equal(width, expectedSize);
  assert.equal(height, expectedSize);
  assert.ok(palette && alpha && idats.length, 'transparent paletted PNG required');
  for (let offset = 0; offset < palette.length; offset += 3) {
    assert.equal(palette.subarray(offset, offset + 3).toString('hex'), 'c8bfa8', 'Every pixel must be brand gold, without an outline');
  }
  const pixels = inflateSync(Buffer.concat(idats));
  assert.equal(pixels.length, height * (width + 1));
  let left = width, right = -1;
  for (let y = 0; y < height; y += 1) {
    const start = y * (width + 1);
    assert.equal(pixels[start], 0, 'Expected unfiltered palette scanlines');
    for (let x = 0; x < width; x += 1) {
      if ((alpha[pixels[start + x + 1]] ?? 255) === 0) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
  }
  assert.equal(left, 1, 'Exactly 1px left margin');
  assert.equal(right, width - 2, 'Exactly 1px right margin');
}

test('favicon family retains transparent gold 1px margins at each resolution', async () => {
  const sizes = new Map([
    ['favicon-16x16.png', 16],
    ['favicon-32x32.png', 32],
    ['favicon-48x48.png', 48],
    ['favicon-96x96.png', 96],
    ['apple-touch-icon.png', 180],
    ['android-chrome-192x192.png', 192],
    ['android-chrome-512x512.png', 512],
  ]);
  for (const [name, size] of sizes) {
    inspectPng(await readFile('public/favicons/' + name), size);
  }
  inspectPng(await readFile('public/favicons/viscerium-favicon-96.png'), 96);

  const ico = await readFile('public/favicon.ico');
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  for (let index = 0; index < 3; index += 1) {
    const pos = 6 + 16 * index;
    const size = [16, 32, 48][index];
    assert.equal(ico[pos], size);
    assert.equal(ico[pos + 1], size);
    const length = ico.readUInt32LE(pos + 8);
    const offset = ico.readUInt32LE(pos + 12);
    inspectPng(ico.subarray(offset, offset + length), size);
  }
});

test('all favicon aliases, metadata, and manifest point at the new transparent assets', async () => {
  const [svg, alias, mark, mask, config, manifest] = await Promise.all([
    readFile('public/favicon.svg', 'utf8'),
    readFile('public/favicons/viscerium-favicon.svg', 'utf8'),
    readFile('public/favicons/viscerium-mark.svg', 'utf8'),
    readFile('public/favicons/safari-pinned-tab.svg', 'utf8'),
    readFile('astro.config.mjs', 'utf8'),
    readFile('public/site.webmanifest', 'utf8'),
  ]);
  assert.equal(alias, svg, 'Legacy favicon URL should remain equivalent');
  assert.equal(mark, svg, 'Legacy mark should use the same tight SVG geometry');
  assert.doesNotMatch(svg, /<rect\b|\bstroke=/i, 'Logo must have no background or stroke');
  assert.match(svg, /prefers-color-scheme:\s*dark/);
  assert.match(svg, /scale\(1\.139156\)/);
  assert.doesNotMatch(mask, /<rect\b|prefers-color-scheme/i);
  for (const asset of ['favicon.ico', 'favicon.svg', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon-48x48.png', 'favicon-96x96.png', 'apple-touch-icon.png', 'safari-pinned-tab.svg', 'site.webmanifest']) {
    assert.ok(config.includes(asset), 'Head config missing ' + asset);
  }
  const icons = JSON.parse(manifest).icons;
  for (const size of [192, 512]) {
    const icon = icons.find((entry) => entry.sizes === size + 'x' + size);
    assert.ok(icon && icon.src.endsWith(size + 'x' + size + '.png') && icon.purpose === 'any');
  }
  assert.ok(icons.every((entry) => entry.purpose !== 'maskable'), 'Wide logo must not be cropped as maskable');
});
