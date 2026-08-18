# Public-site security contract

VISCERIUM is primarily a static Codex, but it loads or integrates third-party services including analytics, comments, fonts, Webmentions and contact-form infrastructure. Security headers should make those trust boundaries explicit.

## Baseline

- Serve production content over HTTPS only.
- Define a Content Security Policy from the resources the site actually needs.
- Introduce CSP in report-only mode first; enforce only after violations have been reviewed and required sources are documented.
- Prefer nonces/hashes or external static scripts over broad `unsafe-inline` allowances where the deployed platform permits it.
- Set `X-Content-Type-Options: nosniff`.
- Set a deliberate `Referrer-Policy` rather than relying on platform defaults.
- Set a narrow `Permissions-Policy`; the Codex should not silently acquire camera, microphone, geolocation or other powerful capabilities.
- Prevent unintended framing unless a documented embed use case requires it.
- Use HSTS on the production HTTPS origin once subdomain implications have been reviewed.
- External endpoints and tokens stay environment-configured; secrets must never enter the public bundle or repository.

## CSP rollout

1. Inventory first-party and third-party script/style/font/image/frame/connect sources.
2. Deploy `Content-Security-Policy-Report-Only`.
3. Exercise comments, analytics, maps, feeds, contact forms and interactive article pages.
4. Remove unnecessary sources and document justified exceptions.
5. Promote the tested policy to enforcing CSP.

Security policy should be generated or configured in one deployment-owned location so local development, preview and production differences remain explicit.
