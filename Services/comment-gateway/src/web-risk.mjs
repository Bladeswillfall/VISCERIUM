import { createHash } from 'node:crypto';
import { GatewayError } from './errors.mjs';

const threatTypes = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'];

export class WebRiskClient {
  constructor(config, fetchImpl = fetch) {
    this.config = config;
    this.fetchImpl = fetchImpl;
    this.cache = new Map();
  }

  cacheKey(url) {
    return createHash('sha256').update(url).digest('base64url');
  }

  async assertSafe(url) {
    if (this.config.mode === 'off') return;

    const key = this.cacheKey(url);
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) {
      if (cached.unsafe) throw new GatewayError(422, 'unsafe_url', 'That link is currently classified as unsafe and cannot be posted.');
      return;
    }

    const endpoint = new URL('https://webrisk.googleapis.com/v1/uris:search');
    for (const type of threatTypes) endpoint.searchParams.append('threatTypes', type);
    endpoint.searchParams.set('uri', url);
    endpoint.searchParams.set('key', this.config.apiKey);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    let response;
    try {
      response = await this.fetchImpl(endpoint, { signal: controller.signal });
    } catch {
      throw new GatewayError(503, 'web_risk_unavailable', 'Link safety checks are temporarily unavailable. Your draft has not been posted.');
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) throw new GatewayError(503, 'web_risk_unavailable', 'Link safety checks are temporarily unavailable. Your draft has not been posted.');

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new GatewayError(503, 'web_risk_invalid_response', 'Link safety checks are temporarily unavailable. Your draft has not been posted.');
    }

    const matched = Array.isArray(payload?.threat?.threatTypes) && payload.threat.threatTypes.length > 0;
    let expiresAt = now + this.config.negativeTtlMs;
    if (matched && payload.threat.expireTime) {
      const serviceExpiry = Date.parse(payload.threat.expireTime);
      if (Number.isFinite(serviceExpiry) && serviceExpiry > now) expiresAt = serviceExpiry;
    }
    this.cache.set(key, { unsafe: matched, expiresAt });
    if (this.cache.size > 5000) this.prune(now);

    if (matched) throw new GatewayError(422, 'unsafe_url', 'That link is currently classified as unsafe and cannot be posted.');
  }

  async assertAllSafe(urls) {
    await Promise.all([...new Set(urls)].map((url) => this.assertSafe(url)));
  }

  prune(now = Date.now()) {
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) this.cache.delete(key);
    }
  }
}
