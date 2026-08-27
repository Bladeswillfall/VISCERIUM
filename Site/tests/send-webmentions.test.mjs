import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWebmentionRequestUrl } from '../scripts/send-webmentions.mjs';

test('builds an HTTPS webmention.app request for a canonical source URL', () => {
  const requestUrl = buildWebmentionRequestUrl('/degel-system/errack/', {
    token: 'test-token',
  });

  assert.equal(requestUrl.origin, 'https://webmention.app');
  assert.equal(
    requestUrl.searchParams.get('url'),
    'https://www.viscerium.co.uk/degel-system/errack/',
  );
  assert.equal(requestUrl.searchParams.get('token'), 'test-token');
});

test('rejects sources outside the canonical site', () => {
  assert.throws(
    () => buildWebmentionRequestUrl('https://example.com/article/'),
    /Refusing to send Webmentions for non-canonical origin/,
  );
});

test('rejects insecure sender endpoints', () => {
  assert.throws(
    () => buildWebmentionRequestUrl('/', { endpoint: 'http://webmention.app/check/' }),
    /must use HTTPS/,
  );
});
