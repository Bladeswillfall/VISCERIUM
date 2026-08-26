# Comments infrastructure baseline

This directory is the version-controlled reference for the public Remark42 service. It contains no production secrets. Copy examples to the VPS and supply secrets through a mode-`0600` environment file or an equivalent secret store.

## Security invariants

- Remark42 is published on `127.0.0.1` only. It must not have a public Docker port.
- Caddy is the only local HTTP entry point until Cloudflare Tunnel becomes the public ingress.
- User-uploaded comment images are not supported. `POST /api/v1/picture` is blocked before Remark42, the backend image limit is set to one byte as a second backstop, and the served comment iframe removes the upload affordance plus image paste/drop handling.
- Public request bodies are bounded before application parsing.
- Client-supplied forwarding headers are replaced. Caddy derives `{client_ip}` only through explicitly trusted proxy hops; untrusted direct peers fall back to their actual remote address.
- Caddy authenticates its internal `X-Viscerium-Client-IP` value with `COMMENT_GATEWAY_PROXY_SECRET`; the gateway ignores that client-address header when the secret does not match.
- The Remark42 image is pinned to a tested release and manifest digest. Do not return to `latest`.
- The container has no Docker socket. Logs are rotated and resource usage is bounded.
- Secrets, comment databases and backups never belong in Git.

The example trusts only loopback as the reverse-proxy source because the target Cloudflare Tunnel process runs on the same host. If `cloudflared` is later moved into a container or onto another machine, replace those loopback CIDRs with only the exact network(s) that can legitimately reach Caddy; do not broaden this to arbitrary private ranges. `trusted_proxies_strict` is enabled so appended proxy chains are interpreted from the trusted side, and `CF-Connecting-IP`/`X-Forwarded-For` are considered only when the immediate peer is trusted.

Generate one high-entropy `COMMENT_GATEWAY_PROXY_SECRET` of at least 32 characters. Supply the same value to the comment gateway environment and the Caddy process environment before loading `Caddyfile.example`. Rotate both sides together. A missing or incorrect value causes the gateway to ignore `X-Viscerium-Client-IP` and use the immediate socket peer instead.

The stock Remark42 image rewrites files under `/srv/web` during container startup and attempts to adjust ownership under `/srv/var`. Because of that upstream behaviour, `read_only: true` and `cap_drop: [ALL]` are not asserted in the example: enabling them blindly can break startup. Revisit those controls only with a tested wrapper/custom image that makes the startup filesystem immutable after initialisation. `no-new-privileges` remains enabled.

## Comment iframe UI policy

Remark42 v1.16.4 still renders the image-attachment control for authenticated users even when the backend image size is effectively unusable; toolbar visibility is driven by the frontend upload handler rather than `IMAGE_MAX_SIZE`. VISCERIUM therefore serves `remark42-ui/iframe.html` for `/web/iframe.html` while continuing to proxy the stock version-pinned Remark42 JS and CSS assets.

The override removes dynamically-created file inputs and blocks image paste/drop at the iframe boundary. This is a usability layer, not the security boundary: `POST /api/v1/picture` remains blocked by Caddy and `IMAGE_MAX_SIZE=1` remains the backend backstop.

At deployment, copy `remark42-ui/iframe.html` to `/srv/remark42/ui/iframe.html` before reloading the accompanying Caddy configuration. The override is intentionally coupled to the pinned Remark42 frontend shell. Whenever Remark42 is upgraded, compare the upstream `frontend/apps/remark42/templates/iframe.ejs` for the new release, refresh this file as needed, and re-test theme switching, OAuth, comment loading, reply/edit forms and iframe resizing before deployment.

## Deliberate upgrades

Before changing the pinned Remark42 release, read the upstream release notes, update the tag and digest together, take an independent backup, deploy, verify `/ping`, anonymous and GitHub sign-in, create/edit/delete a disposable comment, verify admin controls, confirm the image-attachment UI remains absent, and confirm the public image-upload endpoint is still blocked. Keep the previous known-good image reference until the new version has survived validation.

## Backups

Remark42's built-in daily exports are useful but are not an independent backup if they live on the same VPS. Production should also send `/srv/remark42/var` to an encrypted off-host repository using credentials that cannot administer the VPS. The remote repository should have retention/versioning that prevents a compromised application host from silently destroying the only history.

A restore test is part of the backup, not an optional extra: restore a recent copy into an isolated directory/container and verify that comments and identities are readable before declaring the backup healthy.

## Monitoring

External monitoring should cover `https://comments.viscerium.co.uk/ping`, TLS validity and the main Codex separately. Host monitoring should alert on disk pressure, repeated container restarts, sustained CPU/RAM pressure, backup failure, unusual 4xx/5xx rates and comment-write rejection spikes. Logs must not contain OAuth secrets, session cookies, drafts or full request bodies, and network identifiers should not be retained indefinitely.

## Cloudflare/origin isolation

The target ingress is Cloudflare Tunnel: public DNS terminates at Cloudflare and the VPS makes the outbound tunnel connection. Once verified, close public web ports at the VPS firewall and remove any direct-origin route. Administration should move to a private management path such as Tailscale or Cloudflare Zero Trust rather than leaving SSH broadly exposed.
