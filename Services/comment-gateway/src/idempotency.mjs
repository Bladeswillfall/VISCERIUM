import { createHmac } from 'node:crypto';

const explicitKeyPattern = /^[A-Za-z0-9._:-]{8,128}$/u;

export function buildIdempotencyKey({ explicitKey, secret, method, path, body, identityHint = '' }) {
  if (explicitKey && !explicitKeyPattern.test(explicitKey)) throw new Error('invalid idempotency key');

  const hmac = createHmac('sha256', secret)
    .update(explicitKey || 'derived')
    .update('\0')
    .update(method)
    .update('\0')
    .update(path)
    .update('\0')
    .update(identityHint)
    .update('\0')
    .update(body)
    .digest('base64url');

  return `${explicitKey ? 'client' : 'derived'}:${hmac}`;
}

export class IdempotencyStore {
  constructor({ ttlMs, maxEntries = 5000 }) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  async run(key, action, now = Date.now()) {
    this.prune(now);
    const existing = this.entries.get(key);
    if (existing && existing.expiresAt > now) return existing.promise;

    const promise = Promise.resolve().then(action);
    this.entries.set(key, { expiresAt: now + this.ttlMs, promise });

    try {
      return await promise;
    } catch (error) {
      const current = this.entries.get(key);
      if (current?.promise === promise) this.entries.delete(key);
      throw error;
    }
  }

  prune(now = Date.now()) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }
}
