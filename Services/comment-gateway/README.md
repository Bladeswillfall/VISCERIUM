# VISCERIUM comment gateway

The comment gateway is a deliberately small, dependency-free Node service placed only in the Remark42 **write** path. Caddy continues to send reads, authentication and the stock Remark42 frontend directly to Remark42. New comments and edits go through this service first. If the gateway is unavailable, comments remain readable but writes stop rather than bypassing the policy.

```text
browser
  -> Caddy
       -> reads/auth/config -> Remark42
       -> POST /api/v1/comment ----\
       -> PUT /api/v1/comment/:id --+-> comment-gateway -> Remark42
       -> POST /api/v1/picture -> 404
```

## What the gateway enforces

Requests must be bounded JSON containing valid UTF-8. Comment text is NFC-normalised, size-limited and checked for disruptive control characters, bidi overrides, excessive combining marks/Zalgo, pathological invisible-character runs, extreme grapheme complexity and extreme repetition while preserving ordinary international text.

Comment media is not accepted. Links must use HTTPS, cannot contain credentials or literal/private-style local destinations, and common shorteners/affiliate redirectors are rejected rather than resolved. The gateway never follows a commenter-supplied destination, which keeps arbitrary URL fetching out of the request path. Known tracking parameters such as `utm_*`, `fbclid`, `gclid` and common Amazon affiliate parameters are removed while functional query parameters are retained. This is a conservative VISCERIUM tracker-cleaning ruleset, **not a claim that the complete ClearURLs rule database is vendored**. If the full ClearURLs ruleset is incorporated later, its licence/attribution and update process must be handled explicitly.

At most three unique external URLs are accepted by default. When `WEB_RISK_MODE=required`, each uncached external URL is checked with Google Web Risk Lookup and posting fails closed if the reputation service cannot complete the decision. The lookup sends the URL being checked to Google; it does not send the surrounding comment or user identity.

A privacy-preserving sliding-window rate limiter stores only HMAC-derived client keys. Idempotency keys are also HMAC-derived and bind the request body, route and identity context. Identical successful retries reuse the previous result. If Remark42 may have stored a write but the gateway loses the upstream response, that uncertain outcome is retained briefly and the exact request is not blindly replayed; the reader is told to refresh before retrying.

## Turnstile

Server-side Turnstile verification is implemented but defaults to `off`. Stock cross-origin Remark42 does not currently supply the gateway's `X-Turnstile-Token` header, so setting `TURNSTILE_MODE=required` before a compatible client/edge integration would intentionally block every write. Cloudflare edge rate limits/WAF rules remain useful independently. When a compatible submission UI is introduced, set the secret only on the server and switch to `required`; the gateway then validates success, hostname and the `comment` action server-side.

## Configuration

Copy `.env.example` to a deployment-only environment file and generate independent high-entropy `RATE_LIMIT_SECRET`, `IDEMPOTENCY_SECRET` and `COMMENT_GATEWAY_PROXY_SECRET` values. Never commit the populated file. The same `COMMENT_GATEWAY_PROXY_SECRET` must be available to Caddy so it can authenticate the internal client-address header. `REMARK42_UPSTREAM_URL` should resolve only to the internal Remark42 service, not an arbitrary request-supplied host. `COMMENT_ORIGINS` is an explicit comma-separated allowlist of canonical thread origins.

The service logs compact structured events: outcome, method, status, rejection code, external-link count and duration. It does not log comment bodies, drafts, OAuth credentials, cookies or client addresses.

## Deployment

The provided container runs as the unprivileged Node user and needs no writable application filesystem. The compose baseline therefore adds a read-only root filesystem, drops Linux capabilities, enables `no-new-privileges`, uses a small tmpfs, and applies CPU/RAM/PID ceilings. The service has no Docker socket.

Caddy overwrites `X-Viscerium-Client-IP` and supplies `X-Viscerium-Proxy-Secret`. The gateway accepts the client address only when the proxy secret matches `COMMENT_GATEWAY_PROXY_SECRET`; otherwise it falls back to the immediate socket peer. The proxy secret is stripped before forwarding to Remark42. Keep the gateway bound to loopback at the host boundary as an additional control. When Cloudflare Tunnel becomes the public ingress, revisit the trusted-hop calculation so only Cloudflare/the local tunnel can supply the true client address. Do not simply trust a public `CF-Connecting-IP` header from any source.

## Tests

Run `npm test` in this directory. The suite includes legitimate Vietnamese, Arabic, Hindi, Japanese and emoji text as well as Zalgo, invisible controls, bidi abuse, oversized requests, URL smuggling classes, media rejection, provider failure, rate/idempotency behaviour, authenticated proxy-address handling and the ambiguous-response duplicate case.
