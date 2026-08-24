import http from 'node:http';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import { GatewayError, badRequest } from './errors.mjs';
import { loadConfig } from './config.mjs';
import { normalizeCommentText } from './unicode-policy.mjs';
import { processCommentUrls } from './url-policy.mjs';
import { SlidingWindowRateLimiter } from './rate-limit.mjs';
import { buildIdempotencyKey, IdempotencyStore } from './idempotency.mjs';
import { verifyTurnstile } from './turnstile.mjs';
import { WebRiskClient } from './web-risk.mjs';

const editPath = /^\/api\/v1\/comment\/[^/]+$/u;
const blockedForwardHeaders = new Set([
  'connection',
  'content-length',
  'host',
  'idempotency-key',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
  'x-turnstile-token',
  'x-viscerium-client-ip',
]);

function publicHeaders(contentType = 'text/plain; charset=utf-8') {
  return {
    'cache-control': 'no-store',
    'content-type': contentType,
    'x-content-type-options': 'nosniff',
  };
}

function writeText(response, status, text, extraHeaders = {}) {
  response.writeHead(status, { ...publicHeaders(), ...extraHeaders });
  response.end(text);
}

function writeJson(response, status, value) {
  response.writeHead(status, publicHeaders('application/json; charset=utf-8'));
  response.end(JSON.stringify(value));
}

async function readRequestBody(request, maxBytes) {
  const contentLength = Number.parseInt(String(request.headers['content-length'] || '0'), 10);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new GatewayError(413, 'request_too_large', 'Comment request is too large.');
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new GatewayError(413, 'request_too_large', 'Comment request is too large.');
    chunks.push(chunk);
  }

  const bytes = Buffer.concat(chunks);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw badRequest('invalid_utf8', 'Comment request must contain valid UTF-8.');
  }
}

function parseJson(source) {
  try {
    return JSON.parse(source);
  } catch {
    throw badRequest('invalid_json', 'Comment request must contain valid JSON.');
  }
}

function ensureJsonRequest(request) {
  const contentType = String(request.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    throw new GatewayError(415, 'content_type', 'Comment requests must use application/json.');
  }
}

function validateThreadUrl(raw, config) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw badRequest('thread_url', 'Comment thread URL is invalid.');
  }
  if (!config.commentOrigins.has(url.origin) || url.username || url.password || url.search || url.hash) {
    throw badRequest('thread_url', 'Comment thread URL is not allowed.');
  }
  return url.href;
}

function validateCreateLocator(payload, config) {
  if (!payload?.locator || typeof payload.locator !== 'object') throw badRequest('locator', 'Comment locator is missing.');
  if (payload.locator.site !== config.siteId) throw badRequest('site', 'Comment site identifier is not allowed.');
  payload.locator = { ...payload.locator, site: config.siteId, url: validateThreadUrl(payload.locator.url, config) };
}

function validateEditLocator(requestUrl, config) {
  if (requestUrl.searchParams.get('site') !== config.siteId) throw badRequest('site', 'Comment site identifier is not allowed.');
  const target = requestUrl.searchParams.get('url');
  if (!target) throw badRequest('thread_url', 'Comment thread URL is missing.');
  validateThreadUrl(target, config);
}

function normalizeMetadata(value, label, maxBytes) {
  if (value === undefined || value === null || value === '') return value;
  if (typeof value !== 'string') throw badRequest(`${label}_type`, `${label} must be text.`);
  const normalized = value.normalize('NFC');
  if (Buffer.byteLength(normalized, 'utf8') > maxBytes) throw badRequest(`${label}_size`, `${label} is too long.`);
  if (/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(normalized)) {
    throw badRequest(`${label}_controls`, `${label} contains unsupported control characters.`);
  }
  return normalized;
}

function sanitizePayload(payload, requestUrl, method, config) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw badRequest('payload', 'Comment request body must be an object.');

  const copy = structuredClone(payload);
  let externalUrls = [];

  if (method === 'POST') {
    validateCreateLocator(copy, config);
    copy.title = normalizeMetadata(copy.title, 'title', 512);
    const normalized = normalizeCommentText(copy.text, { maxBytes: config.maxCommentBytes });
    const processed = processCommentUrls(normalized, {
      internalOrigins: config.commentOrigins,
      maxExternalLinks: config.maxExternalLinks,
    });
    copy.text = processed.text;
    externalUrls = processed.externalUrls;
  } else {
    validateEditLocator(requestUrl, config);
    copy.summary = normalizeMetadata(copy.summary, 'summary', 256);
    if (copy.delete !== true) {
      const normalized = normalizeCommentText(copy.text, { maxBytes: config.maxCommentBytes });
      const processed = processCommentUrls(normalized, {
        internalOrigins: config.commentOrigins,
        maxExternalLinks: config.maxExternalLinks,
      });
      copy.text = processed.text;
      externalUrls = processed.externalUrls;
    }
  }

  return { payload: copy, externalUrls };
}

function clientIp(request) {
  const header = request.headers['x-viscerium-client-ip'];
  if (typeof header === 'string' && header.length <= 64) return header;
  return request.socket.remoteAddress || 'unknown';
}

function identityHint(request, fallback) {
  const cookie = request.headers.cookie;
  const authorization = request.headers.authorization;
  if (typeof cookie === 'string' && cookie) return cookie;
  if (typeof authorization === 'string' && authorization) return authorization;
  return fallback;
}

function copyForwardHeaders(request, ip) {
  const headers = new Headers();
  for (const [name, raw] of Object.entries(request.headers)) {
    if (blockedForwardHeaders.has(name.toLowerCase()) || raw === undefined) continue;
    const value = Array.isArray(raw) ? raw.join(', ') : String(raw);
    headers.set(name, value);
  }
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('x-real-ip', ip);
  headers.set('x-forwarded-for', ip);
  return headers;
}

function copyResponseHeaders(source) {
  const headers = {};
  for (const [name, value] of source.entries()) {
    if (['connection', 'content-length', 'keep-alive', 'transfer-encoding', 'upgrade'].includes(name.toLowerCase())) continue;
    headers[name] = value;
  }
  headers['cache-control'] = 'no-store';
  headers['x-content-type-options'] = 'nosniff';
  return headers;
}

async function forwardWrite({ request, requestUrl, body, ip, config, fetchImpl }) {
  const upstream = new URL(`${requestUrl.pathname}${requestUrl.search}`, config.upstream);
  let result;
  try {
    result = await fetchImpl(upstream, {
      method: request.method,
      headers: copyForwardHeaders(request, ip),
      body,
      redirect: 'manual',
    });
  } catch (cause) {
    const error = new GatewayError(
      503,
      'upstream_uncertain',
      'The posting result is uncertain. Refresh the comments before retrying this exact submission.',
      { cause },
    );
    error.cacheIdempotency = true;
    throw error;
  }

  return {
    status: result.status,
    headers: copyResponseHeaders(result.headers),
    body: Buffer.from(await result.arrayBuffer()),
  };
}

function logEvent(event) {
  process.stdout.write(`${JSON.stringify({ time: new Date().toISOString(), ...event })}\n`);
}

export function createGatewayServer(config, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl || fetch;
  const limiter = dependencies.rateLimiter || new SlidingWindowRateLimiter({
    secret: config.rateLimitSecret,
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
  });
  const idempotency = dependencies.idempotency || new IdempotencyStore({ ttlMs: config.idempotencyTtlMs });
  const webRisk = dependencies.webRisk || new WebRiskClient(config.webRisk, fetchImpl);

  return http.createServer(async (request, response) => {
    const started = Date.now();
    const requestUrl = new URL(request.url || '/', 'http://gateway.internal');
    const isCreate = request.method === 'POST' && requestUrl.pathname === '/api/v1/comment';
    const isEdit = request.method === 'PUT' && editPath.test(requestUrl.pathname);

    if (request.method === 'GET' && requestUrl.pathname === '/healthz') {
      writeJson(response, 200, { ok: true });
      return;
    }
    if (request.method === 'POST' && requestUrl.pathname === '/api/v1/picture') {
      writeText(response, 404, 'Not found.');
      return;
    }
    if (!isCreate && !isEdit) {
      writeText(response, 404, 'Not found.');
      return;
    }

    try {
      ensureJsonRequest(request);
      const rawBody = await readRequestBody(request, config.maxRequestBytes);
      const parsed = parseJson(rawBody);
      const { payload, externalUrls } = sanitizePayload(parsed, requestUrl, request.method, config);
      const normalizedBody = JSON.stringify(payload);
      const ip = clientIp(request);
      const key = buildIdempotencyKey({
        explicitKey: typeof request.headers['idempotency-key'] === 'string' ? request.headers['idempotency-key'] : '',
        secret: config.idempotencySecret,
        method: request.method,
        path: `${requestUrl.pathname}${requestUrl.search}`,
        body: normalizedBody,
        identityHint: identityHint(request, ip),
      });

      const upstreamResult = await idempotency.run(key, async () => {
        limiter.check(ip);
        await verifyTurnstile({
          token: typeof request.headers['x-turnstile-token'] === 'string' ? request.headers['x-turnstile-token'] : '',
          remoteIp: ip,
          config: config.turnstile,
          fetchImpl,
        });
        await webRisk.assertAllSafe(externalUrls);
        return forwardWrite({ request, requestUrl, body: normalizedBody, ip, config, fetchImpl });
      });

      response.writeHead(upstreamResult.status, upstreamResult.headers);
      response.end(upstreamResult.body);
      logEvent({ event: 'comment_write', method: request.method, status: upstreamResult.status, links: externalUrls.length, duration_ms: Date.now() - started });
    } catch (error) {
      if (error instanceof GatewayError) {
        const extraHeaders = error.retryAfterSeconds ? { 'retry-after': String(error.retryAfterSeconds) } : {};
        writeText(response, error.status, error.publicMessage, extraHeaders);
        logEvent({ event: 'comment_rejected', method: request.method, status: error.status, code: error.code, duration_ms: Date.now() - started });
        return;
      }

      if (error?.message === 'invalid idempotency key') {
        writeText(response, 400, 'Idempotency-Key is invalid.');
        logEvent({ event: 'comment_rejected', method: request.method, status: 400, code: 'idempotency_key', duration_ms: Date.now() - started });
        return;
      }

      console.error('comment gateway internal error', error);
      writeText(response, 500, 'Comment could not be processed. Your draft has not been posted.');
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const config = loadConfig();
  const server = createGatewayServer(config);
  server.listen(config.port, config.host, () => {
    logEvent({ event: 'gateway_started', host: config.host, port: config.port });
  });
}
