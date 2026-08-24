import test from 'node:test';
import assert from 'node:assert/strict';
import { WebRiskClient } from '../src/web-risk.mjs';
import { verifyTurnstile } from '../src/turnstile.mjs';

const webRiskConfig = {
  mode: 'required',
  apiKey: 'test-key',
  timeoutMs: 1000,
  negativeTtlMs: 60_000,
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('Web Risk permits a clean URL and caches the decision without storing a raw cache key', async () => {
  let calls = 0;
  const client = new WebRiskClient(webRiskConfig, async (url) => {
    calls += 1;
    assert.equal(url.searchParams.get('uri'), 'https://example.com/path');
    assert.deepEqual(url.searchParams.getAll('threatTypes'), ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE']);
    return jsonResponse({});
  });

  await client.assertSafe('https://example.com/path');
  await client.assertSafe('https://example.com/path');
  assert.equal(calls, 1);
  assert.equal([...client.cache.keys()].some((entry) => entry.includes('example.com')), false);
});

test('Web Risk rejects a matched threat and provider outages fail closed', async () => {
  const unsafe = new WebRiskClient(webRiskConfig, async () => jsonResponse({
    threat: { threatTypes: ['MALWARE'], expireTime: new Date(Date.now() + 60_000).toISOString() },
  }));
  await assert.rejects(unsafe.assertSafe('https://evil.example/'), (error) => error?.code === 'unsafe_url');

  const unavailable = new WebRiskClient(webRiskConfig, async () => {
    throw new Error('network unavailable');
  });
  await assert.rejects(unavailable.assertSafe('https://example.com/'), (error) => error?.code === 'web_risk_unavailable');
});

test('Web Risk and Turnstile can be disabled without network calls', async () => {
  const fetchImpl = async () => {
    throw new Error('should not be called');
  };
  await new WebRiskClient({ ...webRiskConfig, mode: 'off' }, fetchImpl).assertSafe('https://example.com/');
  await verifyTurnstile({ token: '', remoteIp: '', config: { mode: 'off' }, fetchImpl });
});

test('Turnstile verifies success, hostname and action', async () => {
  const config = {
    mode: 'required',
    secret: 'secret',
    expectedHostname: 'www.viscerium.co.uk',
    expectedAction: 'comment',
    timeoutMs: 1000,
  };
  let seenBody;
  await verifyTurnstile({
    token: 'token',
    remoteIp: '203.0.113.8',
    config,
    fetchImpl: async (_url, options) => {
      seenBody = options.body;
      return jsonResponse({ success: true, hostname: 'www.viscerium.co.uk', action: 'comment' });
    },
  });
  assert.equal(seenBody.get('secret'), 'secret');
  assert.equal(seenBody.get('response'), 'token');
  assert.equal(seenBody.get('remoteip'), '203.0.113.8');

  await assert.rejects(
    verifyTurnstile({
      token: 'token',
      remoteIp: '',
      config,
      fetchImpl: async () => jsonResponse({ success: true, hostname: 'attacker.example', action: 'comment' }),
    }),
    (error) => error?.code === 'turnstile_failed',
  );
});

test('Turnstile requires a token and fails closed when verification is unavailable', async () => {
  const config = {
    mode: 'required',
    secret: 'secret',
    expectedHostname: 'www.viscerium.co.uk',
    expectedAction: 'comment',
    timeoutMs: 1000,
  };
  await assert.rejects(verifyTurnstile({ token: '', remoteIp: '', config }), (error) => error?.code === 'turnstile_required');
  await assert.rejects(
    verifyTurnstile({ token: 'x', remoteIp: '', config, fetchImpl: async () => { throw new Error('down'); } }),
    (error) => error?.code === 'turnstile_unavailable',
  );
});
