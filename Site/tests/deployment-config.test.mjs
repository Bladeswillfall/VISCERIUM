import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('font CDN origins are allowed by the report-only content security policy', () => {
  const headers = read('../public/_headers');

  assert.match(headers, /style-src[^;]*https:\/\/fonts\.googleapis\.com/);
  assert.match(headers, /font-src[^;]*https:\/\/fonts\.gstatic\.com/);
});

test('optional third-party origins are declared by the report-only content security policy', () => {
  const headers = read('../public/_headers');

  assert.match(headers, /script-src[^;]*https:\/\/static\.cloudflareinsights\.com/);
  assert.match(headers, /script-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(headers, /frame-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(headers, /connect-src[^;]*https:\/\/cloudflareinsights\.com/);
});

test('the public comments configuration targets the self-hosted Remark42 service', () => {
  const siteConfig = read('../site.config.mjs');
  const envExample = read('../.env.example');
  const headers = read('../public/_headers');

  assert.match(siteConfig, /https:\/\/comments\.viscerium\.co\.uk/);
  assert.match(siteConfig, /PUBLIC_COMMENTS_ENABLED/);
  assert.match(envExample, /PUBLIC_COMMENTS_ENABLED="1"/);
  assert.match(envExample, /PUBLIC_COMMENTS_HOST="https:\/\/comments\.viscerium\.co\.uk"/);
  assert.match(envExample, /PUBLIC_COMMENTS_SITE_ID="viscerium"/);
  assert.match(headers, /script-src[^;]*https:\/\/comments\.viscerium\.co\.uk/);
  assert.match(headers, /frame-src[^;]*https:\/\/comments\.viscerium\.co\.uk/);
  assert.match(headers, /connect-src[^;]*https:\/\/comments\.viscerium\.co\.uk/);
  assert.doesNotMatch(envExample, /PUBLIC_GISCUS_/);
  assert.doesNotMatch(headers, /https:\/\/giscus\.app/);
});

test('public site code cannot read Worker-only contact secrets', () => {
  const publicContactCode = [
    read('../site.config.mjs'),
    read('../astro.config.mjs'),
    read('../src/pages/contact.astro'),
  ].join('\n');

  assert.doesNotMatch(publicContactCode, /RESEND_API_KEY|TURNSTILE_SECRET_KEY/);
});

test('the checks workflow cannot create a follow-up repository commit', () => {
  const workflow = read('../../.github/workflows/checks.yml');

  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /\bgit push\b/);
  assert.match(workflow, /cmp --silent dist\/main\.js/);
});

test('aggregated changelog headings have unique IDs', () => {
  const changelog = read('../CHANGELOG.md');
  const headings = [...changelog.matchAll(/^###\s+(.+)$/gm)].map((match) => match[1].toLowerCase());

  assert.equal(new Set(headings).size, headings.length);
});

test('browser CI image versions match the locked Playwright package', () => {
  const lock = JSON.parse(read('../package-lock.json'));
  const version = lock.packages['node_modules/@playwright/test'].version;
  const workflow = read('../../.github/workflows/checks.yml');
  const images = [...workflow.matchAll(/image: mcr\\.microsoft\\.com\\/playwright:v(\\d+\\.\\d+\\.\\d+)-noble@sha256:([a-f0-9]{64})/g)];

  assert.equal(images.length, 2, 'both browser and Axe jobs must use pinned images');
  for (const image of images) assert.equal(image[1], version);
});
