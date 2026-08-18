import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const headersUrl = new URL('../public/_headers', import.meta.url);

test('Cloudflare Pages ships the public-site security baseline', async () => {
  const headers = await fs.readFile(headersUrl, 'utf8');

  assert.match(headers, /Strict-Transport-Security:\s*max-age=31536000/);
  assert.match(headers, /X-Frame-Options:\s*DENY/);
  assert.match(headers, /X-Content-Type-Options:\s*nosniff/);
  assert.match(headers, /Referrer-Policy:\s*strict-origin-when-cross-origin/);
  assert.match(headers, /Permissions-Policy:/);
});

test('CSP remains report-only until the external-resource inventory is validated', async () => {
  const headers = await fs.readFile(headersUrl, 'utf8');

  assert.match(headers, /Content-Security-Policy-Report-Only:/);
  assert.doesNotMatch(headers, /^\s*Content-Security-Policy:/m);
  assert.match(headers, /default-src 'self'/);
  assert.match(headers, /object-src 'none'/);
  assert.match(headers, /frame-ancestors 'none'/);
});
