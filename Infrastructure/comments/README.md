# Comments infrastructure baseline

This directory is the version-controlled reference for the public Remark42 service. It contains no production secrets. Copy examples to the VPS and supply secrets through a mode-`0600` environment file or an equivalent secret store.

## Security invariants

- Remark42 is published on `127.0.0.1` only. It must not have a public Docker port.
- Caddy is the only local HTTP entry point until Cloudflare Tunnel becomes the public ingress.
- User-uploaded comment images are not supported. `POST /api/v1/picture` is blocked before Remark42 and the backend image limit is set to one byte as a second backstop.
- Public request bodies are bounded before application parsing.
- Client-supplied forwarding headers are replaced. Only known proxy hops may influence the client address used for abuse controls.
- The Remark42 image is pinned to a tested release and manifest digest. Do not return to `latest`.
- The container has no Docker socket. Logs are rotated and resource usage is bounded.
- Secrets, comment databases and backups never belong in Git.

The stock Remark42 image rewrites files under `/srv/web` during container startup and attempts to adjust ownership under `/srv/var`. Because of that upstream behaviour, `read_only: true` and `cap_drop: [ALL]` are not asserted in the example: enabling them blindly can break startup. Revisit those controls only with a tested wrapper/custom image that makes the startup filesystem immutable after initialisation. `no-new-privileges` remains enabled.

## Deliberate upgrades

Before changing the pinned Remark42 release, read the upstream release notes, update the tag and digest together, take an independent backup, deploy, verify `/ping`, anonymous and GitHub sign-in, create/edit/delete a disposable comment, verify admin controls, and confirm the public image-upload endpoint is still blocked. Keep the previous known-good image reference until the new version has survived validation.

## Backups

Remark42's built-in daily exports are useful but are not an independent backup if they live on the same VPS. Production should also send `/srv/remark42/var` to an encrypted off-host repository using credentials that cannot administer the VPS. The remote repository should have retention/versioning that prevents a compromised application host from silently destroying the only history.

A restore test is part of the backup, not an optional extra: restore a recent copy into an isolated directory/container and verify that comments and identities are readable before declaring the backup healthy.

## Monitoring

External monitoring should cover `https://comments.viscerium.co.uk/ping`, TLS validity and the main Codex separately. Host monitoring should alert on disk pressure, repeated container restarts, sustained CPU/RAM pressure, backup failure, unusual 4xx/5xx rates and comment-write rejection spikes. Logs must not contain OAuth secrets, session cookies, drafts or full request bodies, and network identifiers should not be retained indefinitely.

## Cloudflare/origin isolation

The target ingress is Cloudflare Tunnel: public DNS terminates at Cloudflare and the VPS makes the outbound tunnel connection. Once verified, close public web ports at the VPS firewall and remove any direct-origin route. Administration should move to a private management path such as Tailscale or Cloudflare Zero Trust rather than leaving SSH broadly exposed.
