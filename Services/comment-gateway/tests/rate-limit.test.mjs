import test from 'node:test';
import assert from 'node:assert/strict';
import { SlidingWindowRateLimiter } from '../src/rate-limit.mjs';

test('rate limiter stores only opaque HMAC keys and emits retry guidance', () => {
  const limiter = new SlidingWindowRateLimiter({
    secret: 'rate-limit-test-secret-that-is-long-enough',
    windowMs: 1000,
    max: 2,
  });
  limiter.check('203.0.113.5', 1000);
  limiter.check('203.0.113.5', 1100);
  assert.equal([...limiter.entries.keys()].some((key) => key.includes('203.0.113.5')), false);
  assert.throws(
    () => limiter.check('203.0.113.5', 1200),
    (error) => error?.status === 429 && error?.retryAfterSeconds === 1,
  );
});

test('rate limiter allows a client again after the window expires', () => {
  const limiter = new SlidingWindowRateLimiter({
    secret: 'rate-limit-test-secret-that-is-long-enough',
    windowMs: 1000,
    max: 1,
  });
  limiter.check('client', 1000);
  assert.doesNotThrow(() => limiter.check('client', 2001));
});

test('rate limiter never grows beyond the configured identity cap', () => {
  const limiter = new SlidingWindowRateLimiter({
    secret: 'rate-limit-test-secret-that-is-long-enough',
    windowMs: 1000,
    max: 10,
    maxIdentities: 2,
  });

  limiter.check('client-a', 1000);
  limiter.check('client-b', 1000);
  assert.equal(limiter.entries.size, 2);
  assert.throws(
    () => limiter.check('client-c', 1000),
    (error) => error?.status === 429 && error?.code === 'rate_limit_capacity',
  );
  assert.equal(limiter.entries.size, 2);

  // Once the existing identities have expired, the bounded prune frees space.
  assert.doesNotThrow(() => limiter.check('client-c', 2001));
  assert.equal(limiter.entries.size, 1);
});
