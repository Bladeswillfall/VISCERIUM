# IndieWeb operations

VISCERIUM already receives Webmentions through Webmention.io and publishes RSS and Atom feeds. The site also exposes the Webmention endpoint in its document head.

## Outbound Webmentions

Use `webmention.app` to discover Webmention endpoints on links from a production page and notify them. The repository sender only accepts source URLs on the canonical VISCERIUM origin.

### Manual sender

Run this only after the production page is deployed:

```bash
cd Site
npm run webmentions:send -- https://www.viscerium.co.uk/path/to/article/
```

You can also scan the production RSS feed:

```bash
npm run webmentions:send -- https://www.viscerium.co.uk/rss.xml
```

`webmention.app` rate-limits anonymous requests. If you claim a token, pass it through the process environment:

```bash
WEBMENTION_APP_TOKEN=... npm run webmentions:send -- https://www.viscerium.co.uk/path/to/article/
```

Do not commit the token or add it to public Astro environment variables.

### GitHub Actions fallback

The `Send webmentions` workflow exposes the same sender through `workflow_dispatch`. Run it after Cloudflare Pages reports a successful production deployment. Store an optional `WEBMENTION_APP_TOKEN` as a GitHub Actions secret.

The workflow is manual on purpose. A GitHub `push` event happens before the independent Cloudflare Pages deployment finishes, so a push-triggered sender can notify a target before the new source page is live.

### Automatic Cloudflare notification

Cloudflare Pages project notifications can fire on `Deployment success`. If the Cloudflare account can deliver generic webhook notifications, point a production-only success notification at a `webmention.app` POST URL that scans the RSS feed. For example:

```text
https://webmention.app/check/?url=https%3A%2F%2Fwww.viscerium.co.uk%2Frss.xml&limit=1&token=YOUR_TOKEN
```

Use the Cloudflare notification policy filters for the VISCERIUM Pages project, production environment, and deployment success event. Generic webhook availability depends on the Cloudflare account plan, so keep the manual GitHub workflow as the fallback.

References:

- https://webmention.app/docs
- https://developers.cloudflare.com/notifications/notification-available/
- https://developers.cloudflare.com/notifications/get-started/configure-webhooks/

## Bridgy Fed

Do not enable Bridgy Fed until the Microformats2 changes are deployed and the production RSS/Atom and Webmention discovery links still work.

Bridgy Fed can discover a web site through Microformats2 plus Webmentions, or through a discoverable RSS/Atom feed. VISCERIUM already has the feed and inbound Webmention pieces. The Microformats2 PR adds `h-card` and `h-entry` metadata for the HTML path.

Activation is an external opt-in, so it is not performed by repository code. After the production checks pass:

1. Open https://fed.brid.gy/ and connect `www.viscerium.co.uk` as a web site.
2. Confirm the generated profile resolves the VISCERIUM site identity and recent canon entries correctly.
3. Search for `@www.viscerium.co.uk@web.brid.gy` from a fediverse account and follow it.
4. Publish or update a test canon entry and confirm Bridgy Fed discovers it through the production feed.
5. Confirm any bridged interaction that returns as a Webmention appears in the existing VISCERIUM Webmention display.

Do not add Bridgy Fed's optional WebFinger redirects until the basic bridge works. Those redirects only change the fediverse handle from the default `web.brid.gy` form to a custom-domain form and add another dependency to routing.

Reference: https://fed.brid.gy/docs

## `h-feed`

Do not mark the current homepage as `h-feed`. It is a navigation gateway, not a chronological list of entries. Add `h-feed` only if VISCERIUM later gains an HTML page that actually lists canon entries as a feed.

## Site identity

The site currently advertises the GitHub profile through `rel="me authn"` for IndieLogin authentication. Keep that relationship separate from the VISCERIUM project `h-card`. If the domain should represent only the fictional project rather than the GitHub account owner, review the `rel="me"` relationship before adding more personal identity links.
