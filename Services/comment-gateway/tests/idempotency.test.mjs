import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIdempotencyKey, IdempotencyStore } from '../src/idempotency.mjs';

const secret = 'test-secret-that-is-long-enough-for-hmac-use';

function key(overrides = {}) {
  return buildIdempotencyKey({
    explicitKey: '',
    secret,
    method: 'POST',
    path: '/api/v1/comment',
    body: '{"text":"hello"}',
    identityHint: 'anonymous-cookie',
    ...overrides,
  });
}

test('derived keys are stable but do not expose request content', () => {
  assert.equal(key(), key());
  assert.doesNotMatch(key(), /hello|anonymous-cookie/);
});

test('explicit keys are still bound to body and identity', () => {
  const first = key({ explicitKey: 'submission-1234' });
  assert.notEqual(first, key({ explicitKey: 'submission-1234', body: '{"text":"changed"}' }));
  assert.notEqual(first, key({ explicitKey: 'submission-1234', identityHint: 'someone-else' }));
  assert.doesNotMatch(first, /submission-1234/);
});

test('rejects malformed explicit keys', () => {
  assert.throws(() => key({ explicitKey: 'tiny' }), /invalid idempotency key/);
});

test('coalesces concurrent and repeated successful submissions', async () => {
  const store = new IdempotencyStore({ ttlMs: 60_000 });
  let calls = 0;
  const action = async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { id: 'comment-1' };
  };

  const [a, b] = await Promise.all([store.run(key(), action), store.run(key(), action)]);
  const c = await store.run(key(), action);
  assert.equal(calls, 1);
  assert.deepEqual(a, b);
  assert.deepEqual(b, c);
});

test('ordinary failures may retry but uncertain upstream writes remain cached', async () => {
  const ordinary = new IdempotencyStore({ ttlMs: 60_000 });
  let ordinaryCalls = 0;
  const ordinaryFailure = async () => {
    ordinaryCalls += 1;
    throw new Error('definite failure');
  };
  await assert.rejects(ordinary.run(key(), ordinaryFailure));
  await assert.rejects(ordinary.run(key(), ordinaryFailure));
  assert.equal(ordinaryCalls, 2);

  const uncertain = new IdempotencyStore({ ttlMs: 60_000 });
  let uncertainCalls = 0;
  const uncertainFailure = async () => {
    uncertainCalls += 1;
    const error = new Error('response lost');
    error.cacheIdempotency = true;
    throw error;
  };
  await assert.rejects(uncertain.run(key(), uncertainFailure));
  await assert.rejects(uncertain.run(key(), uncertainFailure));
  assert.equal(uncertainCalls, 1);
});
