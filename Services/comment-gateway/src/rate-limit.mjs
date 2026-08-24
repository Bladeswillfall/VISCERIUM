import { createHmac } from 'node:crypto';
import { GatewayError } from './errors.mjs';

export class SlidingWindowRateLimiter {
  constructor({ secret, windowMs, max }) {
    this.secret = secret;
    this.windowMs = windowMs;
    this.max = max;
    this.entries = new Map();
  }

  key(raw) {
    return createHmac('sha256', this.secret).update(raw || 'unknown').digest('base64url');
  }

  check(raw, now = Date.now()) {
    const key = this.key(raw);
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

    if (this.entries.size > 5000) this.prune(now);
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
