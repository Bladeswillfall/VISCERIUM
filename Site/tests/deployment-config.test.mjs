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

test('the replacement public configuration uses the new identity', () => {
  const publicConfiguration = [
    read('../site.config.mjs'),
    read('../astro.config.mjs'),
    read('../.env.example'),
    read('../public/_headers'),
    read('../public/.well-known/security.txt'),
  ].join('\n');

  assert.match(publicConfiguration, /Bladeswillfall\/VISCERIUM/);
  assert.match(publicConfiguration, /https:\/\/www\.viscerium\.co\.uk/);
  assert.match(publicConfiguration, /PUBLIC_GISCUS_ENABLED="1"/);
  assert.match(publicConfiguration, /PUBLIC_GISCUS_REPO_ID="R_kgDOTOiQ7g"/);
  assert.match(publicConfiguration, /PUBLIC_GISCUS_CATEGORY_ID="DIC_kwDOTOiQ7s4DCYjH"/);
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
