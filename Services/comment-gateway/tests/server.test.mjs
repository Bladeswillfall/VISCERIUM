import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createGatewayServer } from '../src/server.mjs';
import { GatewayError } from '../src/errors.mjs';

const proxySharedSecret = 'proxy-shared-secret-long-enough-for-tests';

function config(overrides = {}) {
  return {
    upstream: new URL('http://remark42.internal:8080'),
    upstreamTimeoutMs: 5000,
    siteId: 'viscerium',
    commentOrigins: new Set(['https://www.viscerium.co.uk']),
    maxRequestBytes: 65536,
    maxCommentBytes: 2048,
    maxExternalLinks: 3,
    rateLimitWindowMs: 60_000,
    rateLimitMax: 100,
    rateLimitSecret: 'rate-limit-secret-long-enough-for-tests',
    idempotencySecret: 'idempotency-secret-long-enough-for-tests',
    idempotencyTtlMs: 60_000,
    proxySharedSecret,
    turnstile: { mode: 'off' },
    webRisk: { mode: 'off' },
    ...overrides,
  };
}

async function withGateway(t, options = {}) {
  const calls = [];
  const fetchImpl = options.fetchImpl || (async (url, requestOptions) => {
    calls.push({ url: String(url), options: requestOptions });
    return new Response(JSON.stringify({ id: 'comment-1', text: JSON.parse(requestOptions.body).text }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  });
  const server = createGatewayServer(config(options.config), { fetchImpl, ...options.dependencies });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const address = server.address();
  return { origin: `http://127.0.0.1:${address.port}`, calls };
}

function createPayload(text = 'hello') {
  return {
    locator: { site: 'viscerium', url: 'https://www.viscerium.co.uk/eras/citadel/' },
    text,
  };
}

async function post(origin, payload, headers = {}) {
  return fetch(`${origin}/api/v1/comment`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });
}

test('forwards a sanitized create once and deduplicates an identical retry', async (t) => {
  const { origin, calls } = await withGateway(t);
  const payload = createPayload('Read https://example.com/a?q=1&utm_source=spam');

  const first = await post(origin, payload);
  const second = await post(origin, payload);
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal(calls.length, 1);

  const forwarded = JSON.parse(calls[0].options.body);
  assert.equal(forwarded.text, 'Read https://example.com/a?q=1');
  assert.equal(calls[0].url, 'http://remark42.internal:8080/api/v1/comment');
  assert.ok(calls[0].options.headers.get('x-real-ip'));
});

test('trusts the client address only when Caddy authenticates the proxy header', async (t) => {
  const seenIps = [];
  const { origin, calls } = await withGateway(t, {
    dependencies: {
      rateLimiter: {
        check(ip) {
          seenIps.push(ip);
        },
      },
    },
  });

  const response = await post(origin, createPayload('trusted proxy'), {
    'x-viscerium-client-ip': '203.0.113.42',
    'x-viscerium-proxy-secret': proxySharedSecret,
  });

  assert.equal(response.status, 201);
  assert.deepEqual(seenIps, ['203.0.113.42']);
  assert.equal(calls[0].options.headers.get('x-real-ip'), '203.0.113.42');
  assert.equal(calls[0].options.headers.get('x-viscerium-proxy-secret'), null);
});

test('ignores a spoofed client address without the proxy shared secret', async (t) => {
  const seenIps = [];
  const { origin, calls } = await withGateway(t, {
    dependencies: {
      rateLimiter: {
        check(ip) {
          seenIps.push(ip);
        },
      },
    },
  });

  const response = await post(origin, createPayload('untrusted proxy'), {
    'x-viscerium-client-ip': '203.0.113.99',
  });

  assert.equal(response.status, 201);
  assert.equal(seenIps.length, 1);
  assert.notEqual(seenIps[0], '203.0.113.99');
  assert.notEqual(calls[0].options.headers.get('x-real-ip'), '203.0.113.99');
});

test('accepts an edit only for the configured site and canonical VISCERIUM thread', async (t) => {
  const { origin, calls } = await withGateway(t);
  const target = encodeURIComponent('https://www.viscerium.co.uk/eras/citadel/');
  const response = await fetch(`${origin}/api/v1/comment/abc123?site=viscerium&url=${target}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'edited' }),
  });
  assert.equal(response.status, 201);
  assert.equal(calls.length, 1);

  const wrongOrigin = await fetch(`${origin}/api/v1/comment/abc123?site=viscerium&url=${encodeURIComponent('https://evil.example/page')}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'edited' }),
  });
  assert.equal(wrongOrigin.status, 400);
  assert.equal(calls.length, 1);
});

test('rejects media, Zalgo and the public picture endpoint before upstream', async (t) => {
  const { origin, calls } = await withGateway(t);
  assert.equal((await post(origin, createPayload('![x](https://example.com/x.png)'))).status, 422);
  assert.equal((await post(origin, createPayload(`Z${'\u0301'.repeat(30)}`))).status, 422);
  assert.equal((await fetch(`${origin}/api/v1/picture`, { method: 'POST', body: 'x' })).status, 404);
  assert.equal(calls.length, 0);
});

test('rejects an oversized body before upstream parsing', async (t) => {
  const { origin, calls } = await withGateway(t);
  const response = await post(origin, createPayload('x'.repeat(70_000)));
  assert.equal(response.status, 413);
  assert.equal(calls.length, 0);
});

test('rejects invalid UTF-8', async (t) => {
  const { origin, calls } = await withGateway(t);
  const url = new URL('/api/v1/comment', origin);

  const status = await new Promise((resolve, reject) => {
    const request = http.request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': 2 },
    }, (response) => {
      response.resume();
      response.on('end', () => resolve(response.statusCode));
    });
    request.on('error', reject);
    request.end(Buffer.from([0xc3, 0x28]));
  });

  assert.equal(status, 400);
  assert.equal(calls.length, 0);
});

test('never reflects exception text into a public gateway response', async (t) => {
  const maliciousMessage = '<img src=x onerror=alert(1)>';
  const { origin, calls } = await withGateway(t, {
    dependencies: {
      rateLimiter: {
        check() {
          throw new GatewayError(422, 'unexpected_policy', maliciousMessage);
        },
      },
    },
  });

  const response = await post(origin, createPayload('safe draft'));
  const body = await response.text();
  assert.equal(response.status, 422);
  assert.doesNotMatch(body, /<img|onerror/i);
  assert.match(body, /cannot be posted/i);
  assert.equal(calls.length, 0);
});

test('caches an uncertain upstream result so an immediate identical retry is not forwarded twice', async (t) => {
  let calls = 0;
  const { origin } = await withGateway(t, {
    fetchImpl: async () => {
      calls += 1;
      throw new Error('response lost');
    },
  });
  const payload = createPayload('uncertain write');

  const first = await post(origin, payload);
  const second = await post(origin, payload);
  assert.equal(first.status, 503);
  assert.equal(second.status, 503);
  assert.match(await first.text(), /result is uncertain/i);
  assert.equal(calls, 1);
});

test('strips stale content-encoding after an upstream response has been decoded', async (t) => {
  const { origin } = await withGateway(t, {
    fetchImpl: async () => new Response(JSON.stringify({ id: 'comment-1' }), {
      status: 201,
      headers: {
        'content-type': 'application/json',
        'content-encoding': 'gzip',
      },
    }),
  });

  const response = await post(origin, createPayload('encoding test'));
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('content-encoding'), null);
  assert.deepEqual(await response.json(), { id: 'comment-1' });
});

test('aborts an upstream response whose body stalls beyond the gateway deadline', async (t) => {
  let calls = 0;
  const { origin } = await withGateway(t, {
    config: { upstreamTimeoutMs: 25 },
    fetchImpl: async (_url, requestOptions) => {
      calls += 1;
      return {
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        arrayBuffer: () => new Promise((resolve, reject) => {
          requestOptions.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
        }),
      };
    },
  });

  const response = await post(origin, createPayload('timeout test'));
  assert.equal(response.status, 503);
  assert.match(await response.text(), /result is uncertain/i);
  assert.equal(calls, 1);
});

test('health endpoint is minimal and all non-write application routes stay out of the gateway', async (t) => {
  const { origin } = await withGateway(t);
  const health = await fetch(`${origin}/healthz`);
  assert.deepEqual(await health.json(), { ok: true });
  assert.equal((await fetch(`${origin}/api/v1/config`)).status, 404);
});
