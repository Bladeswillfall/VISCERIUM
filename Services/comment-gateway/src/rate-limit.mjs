import { createHmac } from 'node:crypto';
import { GatewayError } from './errors.mjs';

export class SlidingWindowRateLimiter {
  constructor({ secret, windowMs, max, maxIdentities = 5000 }) {
    this.secret = secret;
    this.windowMs = windowMs;
    this.max = max;
    this.maxIdentities = maxIdentities;
    this.entries = new Map();
    this.nextPruneAt = 0;
  }

  key(raw) {
    return createHmac('sha256', this.secret).update(raw || 'unknown').digest('base64url');
  }

  capacityError() {
    const error = new GatewayError(429, 'rate_limit_capacity', 'Too many comment submissions. Please try again shortly.');
    error.retryAfterSeconds = Math.max(1, Math.ceil(Math.min(this.windowMs, 5000) / 1000));
    return error;
  }

  check(raw, now = Date.now()) {
    const key = this.key(raw);

    // Keep identity cardinality strictly bounded. When the map is full, prune
    // at most once per short interval; rotating-address traffic therefore
    // cannot force an O(n) full-map scan on every request.
    if (!this.entries.has(key) && this.entries.size >= this.maxIdentities) {
      if (now >= this.nextPruneAt) {
        this.prune(now);
        this.nextPruneAt = now + Math.min(this.windowMs, 5000);
      }
      if (!this.entries.has(key) && this.entries.size >= this.maxIdentities) {
        throw this.capacityError();
      }
    }

    const floor = now - this.windowMs;
    const recent = (this.entries.get(key) || []).filter((timestamp) => timestamp > floor);
    if (recent.length >= this.max) {
      const retryAfterMs = Math.max(1000, recent[0] + this.windowMs - now);
      const error = new GatewayError(429, 'rate_limit', 'Too many comment submissions. Please try again shortly.');
      error.retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      throw error;
    }
    recent.push(now);
    this.entries.set(key, recent);
  }

  prune(now = Date.now()) {
    const floor = now - this.windowMs;
    for (const [key, timestamps] of this.entries) {
      const recent = timestamps.filter((timestamp) => timestamp > floor);
      if (recent.length === 0) this.entries.delete(key);
      else this.entries.set(key, recent);
    }
  }
}
