import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RESPONSIVE_IMAGE_WIDTHS,
  RESPONSIVE_JPEG_QUALITY,
  RESPONSIVE_WEBP_QUALITY,
  responsiveCandidateWidths,
  responsiveVariantFilename,
  responsiveVariantUrl,
} from '../scripts/generate-image-variants.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const repoRoot = path.resolve(siteRoot, '..');

async function readSite(relativePath) {
  return fs.readFile(path.join(siteRoot, relativePath), 'utf8');
}

async function readRepo(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

test('responsive image tiers never upscale small source artwork', () => {
  assert.deepEqual([...RESPONSIVE_IMAGE_WIDTHS], [480, 960, 1600]);
  assert.deepEqual(responsiveCandidateWidths(320), [320]);
  assert.deepEqual(responsiveCandidateWidths(800), [480, 800]);
  assert.deepEqual(responsiveCandidateWidths(1200), [480, 960, 1200]);
  assert.deepEqual(responsiveCandidateWidths(1600), [480, 960, 1600]);
  assert.deepEqual(responsiveCandidateWidths(16384), [480, 960, 1600]);
  assert.deepEqual(responsiveCandidateWidths(0), []);
});

test('variant names keep WebP preferred and JPEG available as the legacy fallback', () => {
  assert.equal(RESPONSIVE_WEBP_QUALITY, 75);
  assert.equal(RESPONSIVE_JPEG_QUALITY, 82);
  assert.equal(responsiveVariantFilename('errack.webp', 480, 'webp'), 'errack-480.webp');
  assert.equal(responsiveVariantFilename('errack.webp', 960, 'jpeg'), 'errack-960.jpg');
  assert.equal(
    responsiveVariantUrl('images', 'errack.webp', 480, 'webp'),
    '/assets/images/variants/errack-480.webp',
  );
  assert.equal(
    responsiveVariantUrl('maps', 'world.webp', 1600, 'jpeg'),
    '/assets/maps/variants/world-1600.jpg',
  );
});

test('content pipeline generates derivatives only after public asset sync', async () => {
  const buildContent = await readSite('scripts/build-content.mjs');
  const syncIndex = buildContent.indexOf("await import('./sync-public-notes.mjs')");
  const variantsIndex = buildContent.indexOf('await generateResponsiveImageVariants()');

  assert.ok(syncIndex >= 0, 'public note sync should remain in the shared pipeline');
  assert.ok(variantsIndex > syncIndex, 'variant generation must run after public assets are admitted/copied');
});

test('generated image derivatives and manifests stay out of Git', async () => {
  const gitignore = await readRepo('.gitignore');
  assert.match(gitignore, /Site\/src\/data\/image-variants\.json/);
  assert.match(gitignore, /Site\/public\/assets\/image-variants\.json/);
  assert.match(gitignore, /Site\/public\/assets\/images\/variants\//);
  assert.match(gitignore, /Site\/public\/assets\/maps\/variants\//);
});

test('the locked install provides Sharp for build-time derivative generation', async () => {
  const lock = JSON.parse(await readSite('package-lock.json'));
  const sharp = lock.packages?.['node_modules/sharp'];

  assert.ok(sharp, 'package-lock should contain the Sharp image engine used by Astro/build tooling');
  assert.match(sharp.version, /^0\.35\./);
});

test('compression policy documents WebP preference and JPEG legacy fallback', async () => {
  const docs = await readSite('COMPRESSION.md');
  assert.match(docs, /WebP at quality 75[^\n]*preferred\/default delivery format/i);
  assert.match(docs, /progressive JPEG at quality 82[^\n]*compatibility fallback/i);
  assert.match(docs, /public\/assets\/image-variants\.json/);
  assert.match(docs, /src\/data\/image-variants\.json/);
  assert.match(docs, /Images are never upscaled/i);
});
