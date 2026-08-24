import test from 'node:test';
import assert from 'node:assert/strict';
import { processCommentUrls } from '../src/url-policy.mjs';

const internalOrigins = new Set(['https://www.viscerium.co.uk']);

function process(text, maxExternalLinks = 3) {
  return processCommentUrls(text, { internalOrigins, maxExternalLinks });
}

test('keeps functional parameters while stripping known trackers', () => {
  const result = process('See https://example.com/page?q=iron&utm_source=spam&fbclid=abc#section');
  assert.equal(result.text, 'See https://example.com/page?q=iron#section');
  assert.deepEqual(result.externalUrls, ['https://example.com/page?q=iron#section']);
});

test('strips common Amazon affiliate parameters without deleting product identity', () => {
  const result = process('https://www.amazon.co.uk/dp/ABC123?tag=affiliate-21&th=1');
  assert.equal(result.text, 'https://www.amazon.co.uk/dp/ABC123?th=1');
});

test('does not count VISCERIUM links as external', () => {
  const result = process('https://www.viscerium.co.uk/eras/citadel/ and https://example.com/a');
  assert.equal(result.externalUrls.length, 1);
});

test('rejects too many unique external links', () => {
  assert.throws(
    () => process('https://a.example/ https://b.example/ https://c.example/ https://d.example/'),
    (error) => error?.code === 'url_limit',
  );
});

test('rejects HTTP, credentialed, IP, local and redirector links', () => {
  for (const [text, code] of [
    ['http://example.com', 'url_scheme'],
    ['https://user:pass@example.com/', 'url_credentials'],
    ['https://127.0.0.1/', 'url_ip_literal'],
    ['https://169.254.169.254/latest/meta-data/', 'url_ip_literal'],
    ['https://[::1]/', 'url_ip_literal'],
    ['https://localhost/', 'url_local_host'],
    ['https://thing.local/', 'url_local_host'],
    ['https://bit.ly/example', 'url_redirector'],
    ['https://amzn.to/example', 'url_redirector'],
  ]) {
    assert.throws(() => process(text), (error) => error?.code === code, `${text} should fail with ${code}`);
  }
});

test('rejects non-HTTPS Markdown destinations and media embeds', () => {
  assert.throws(() => process('[click](javascript:alert(1))'), (error) => error?.code === 'url_scheme');
  assert.throws(() => process('![image](https://example.com/a.png)'), (error) => error?.code === 'media_not_allowed');
  assert.throws(() => process('<iframe src="https://example.com"></iframe>'), (error) => error?.code === 'media_not_allowed');
});

test('preserves punctuation around links', () => {
  assert.equal(process('Look (https://example.com/path).').text, 'Look (https://example.com/path).');
});
