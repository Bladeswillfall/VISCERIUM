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
