function boundedInteger(env, name, fallback, min, max) {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function enumValue(env, name, fallback, allowed) {
  const value = (env[name] || fallback).toLowerCase();
  if (!allowed.includes(value)) throw new Error(`${name} must be one of: ${allowed.join(', ')}`);
  return value;
}

function requiredSecret(env, name) {
  const value = env[name] || '';
  if (value.length < 32) throw new Error(`${name} must contain at least 32 characters`);
  return value;
}

function parseOrigins(value) {
  const origins = new Set();
  for (const item of value.split(',')) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const url = new URL(trimmed);
    if (url.pathname !== '/' || url.search || url.hash) throw new Error(`COMMENT_ORIGINS entry must be an origin: ${trimmed}`);
    origins.add(url.origin);
  }
  if (origins.size === 0) throw new Error('COMMENT_ORIGINS must contain at least one origin');
  return origins;
}

export function loadConfig(env = process.env) {
  const upstream = new URL(env.REMARK42_UPSTREAM_URL || 'http://remark42:8080');
  if (!['http:', 'https:'].includes(upstream.protocol) || upstream.username || upstream.password) {
    throw new Error('REMARK42_UPSTREAM_URL must be an http(s) URL without credentials');
  }

  const webRiskMode = enumValue(env, 'WEB_RISK_MODE', 'off', ['off', 'required']);
  const turnstileMode = enumValue(env, 'TURNSTILE_MODE', 'off', ['off', 'required']);
  if (webRiskMode === 'required' && !env.WEB_RISK_API_KEY) throw new Error('WEB_RISK_API_KEY is required when WEB_RISK_MODE=required');
  if (turnstileMode === 'required' && !env.TURNSTILE_SECRET_KEY) throw new Error('TURNSTILE_SECRET_KEY is required when TURNSTILE_MODE=required');

  return {
    host: env.HOST || '0.0.0.0',
    port: boundedInteger(env, 'PORT', 8080, 1, 65535),
    upstream,
    siteId: env.REMARK42_SITE_ID || 'viscerium',
    commentOrigins: parseOrigins(env.COMMENT_ORIGINS || 'https://www.viscerium.co.uk'),
    maxRequestBytes: boundedInteger(env, 'MAX_REQUEST_BYTES', 65536, 4096, 262144),
    maxCommentBytes: boundedInteger(env, 'MAX_COMMENT_BYTES', 2048, 128, 8192),
    maxExternalLinks: boundedInteger(env, 'MAX_EXTERNAL_LINKS', 3, 0, 10),
    rateLimitWindowMs: boundedInteger(env, 'RATE_LIMIT_WINDOW_MS', 60000, 1000, 3600000),
    rateLimitMax: boundedInteger(env, 'RATE_LIMIT_MAX', 6, 1, 1000),
    rateLimitSecret: requiredSecret(env, 'RATE_LIMIT_SECRET'),
    idempotencySecret: requiredSecret(env, 'IDEMPOTENCY_SECRET'),
    idempotencyTtlMs: boundedInteger(env, 'IDEMPOTENCY_TTL_MS', 300000, 10000, 3600000),
    turnstile: {
      mode: turnstileMode,
      secret: env.TURNSTILE_SECRET_KEY || '',
      expectedHostname: env.TURNSTILE_EXPECTED_HOSTNAME || 'www.viscerium.co.uk',
      expectedAction: env.TURNSTILE_EXPECTED_ACTION || 'comment',
      timeoutMs: boundedInteger(env, 'TURNSTILE_TIMEOUT_MS', 1500, 250, 5000),
    },
    webRisk: {
      mode: webRiskMode,
      apiKey: env.WEB_RISK_API_KEY || '',
      timeoutMs: boundedInteger(env, 'WEB_RISK_TIMEOUT_MS', 1500, 250, 5000),
      negativeTtlMs: boundedInteger(env, 'WEB_RISK_NEGATIVE_TTL_MS', 900000, 60000, 86400000),
    },
  };
}
