import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const headersUrl = new URL('../public/_headers', import.meta.url);

function getHeaderValue(source, name) {
  const target = name.toLowerCase();
  for (const line of source.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    if (line.slice(0, separator).trim().toLowerCase() !== target) continue;
    return line.slice(separator + 1).trim();
  }
  return undefined;
}

test('Cloudflare Pages ships the public-site security baseline', async () => {
  const headers = await fs.readFile(headersUrl, 'utf8');

  assert.match(headers, /Strict-Transport-Security:\s*max-age=31536000/i);
  assert.match(headers, /X-Frame-Options:\s*DENY/i);
  assert.match(headers, /X-Content-Type-Options:\s*nosniff/i);
  assert.match(headers, /X-Permitted-Cross-Domain-Policies:\s*none/i);
  assert.match(headers, /Referrer-Policy:\s*strict-origin-when-cross-origin/i);

  const permissionsPolicy = getHeaderValue(headers, 'Permissions-Policy');
  assert.ok(permissionsPolicy, 'expected a Permissions-Policy header');
  for (const capability of [
    'accelerometer',
    'camera',
    'geolocation',
    'gyroscope',
    'magnetometer',
    'microphone',
    'payment',
    'usb',
  ]) {
    assert.match(
      permissionsPolicy,
      new RegExp(`(?:^|,\\s*)${capability}=\\(\\)(?:,|$)`, 'i'),
      `expected ${capability} to remain denied`,
    );
  }
});

test('CSP inventory has no retired Giscus or CDN permissions', async () => {
  const headers = await fs.readFile(headersUrl, 'utf8');
  const reportOnlyCsp = getHeaderValue(headers, 'Content-Security-Policy-Report-Only');

  assert.ok(reportOnlyCsp, 'expected a report-only CSP header');
  assert.match(reportOnlyCsp, /default-src 'self'/);
  assert.match(reportOnlyCsp, /object-src 'none'/);
  assert.match(reportOnlyCsp, /frame-ancestors 'none'/);
  assert.match(reportOnlyCsp, /https:\/\/comments\.viscerium\.co\.uk/);
  assert.match(
    reportOnlyCsp,
    /script-src[^;]*https:\/\/analytics\.viscerium\.co\.uk/,
  );
  assert.match(
    reportOnlyCsp,
    /connect-src[^;]*https:\/\/analytics\.viscerium\.co\.uk/,
  );
  assert.doesNotMatch(reportOnlyCsp, /giscus\.app/i);
  assert.doesNotMatch(reportOnlyCsp, /cdnjs\.cloudflare\.com/i);
  assert.doesNotMatch(reportOnlyCsp, /upgrade-insecure-requests/i);
});

test('CSP remains report-only until inline scripts and the contact endpoint are narrowed', async () => {
  const headers = await fs.readFile(headersUrl, 'utf8');

  assert.equal(
    getHeaderValue(headers, 'Content-Security-Policy'),
    undefined,
    'enforcing CSP must not be enabled while known broad inline/contact exceptions remain',
  );
});
