import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.mjs';

const baseEnv = {
  RATE_LIMIT_SECRET: 'rate-limit-secret-long-enough-for-tests',
  IDEMPOTENCY_SECRET: 'idempotency-secret-long-enough-for-tests',
  COMMENT_GATEWAY_PROXY_SECRET: 'proxy-shared-secret-long-enough-for-tests',
};

test('requires a high-entropy proxy shared secret', () => {
  assert.throws(
    () => loadConfig({ ...baseEnv, COMMENT_GATEWAY_PROXY_SECRET: '' }),
    /COMMENT_GATEWAY_PROXY_SECRET must contain at least 32 characters/,
  );
});

test('loads the proxy shared secret for client-address authentication', () => {
  const config = loadConfig(baseEnv);
  assert.equal(config.proxySharedSecret, baseEnv.COMMENT_GATEWAY_PROXY_SECRET);
});
