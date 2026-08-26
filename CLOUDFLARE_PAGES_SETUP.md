# Cloudflare Pages setup

The VISCERIUM site remains a static Astro application on Cloudflare Pages. Create a new Pages project only after the replacement GitHub repository has been pushed and verified. Do not reconnect or remove the existing deployment during migration.

## Build settings

Connect the new Pages project to `Bladeswillfall/VISCERIUM` and use:

```text
Production branch: main
Root directory: Site
Build command: npm run build
Build output directory: dist
Node version: 24
SITE_URL=https://www.viscerium.co.uk
```

Choose the new Cloudflare project name in the dashboard. No project name or Cloudflare identifier is committed because those values do not exist yet.

The build regenerates public content from `Vault/Lore/` before Astro creates `Site/dist/`. No committed Wrangler file is required for the static Pages project.

After Cloudflare assigns the real `pages.dev` hostname, either redirect it to the canonical domain or add hostname-specific `X-Robots-Tag: noindex` rules. The old project hostname was removed from `Site/public/_headers`, and a replacement cannot be written accurately before Cloudflare creates the project.

## Safe deployment order

1. Create the new Pages project without changing production DNS.
2. Validate its generated Pages URL and the exact deployed commit.
3. Attach `www.viscerium.co.uk`.
4. Confirm HTTPS, canonical tags, feeds, the sitemap, `robots.txt`, and redirects.
5. Redirect `https://viscerium.co.uk` to `https://www.viscerium.co.uk` with a Cloudflare Single Redirect or Bulk Redirect.
6. Decide whether `codex.viscerium.co.uk` should redirect to the new canonical origin.
7. Keep the previous site available until all production checks pass.

Cloudflare Pages `_redirects` rules cannot perform a hostname-to-hostname redirect. Configure the apex redirect in the zone dashboard after the new site is ready.

## Pages environment variables

Only public build-time values belong in Pages.

### Comments

Article comments are provided by the self-hosted Remark42 service at `https://comments.viscerium.co.uk`. The Astro site only contains the public embed configuration; the Remark42 database, signing secret, OAuth client secret, administrator identity, and other server-only settings stay on the VPS and must never be added to Cloudflare Pages or this repository.

The repository defaults are:

```text
PUBLIC_COMMENTS_ENABLED=1
PUBLIC_COMMENTS_HOST=https://comments.viscerium.co.uk
PUBLIC_COMMENTS_SITE_ID=viscerium
```

`PUBLIC_COMMENTS_ENABLED=0` remains available as an emergency off switch. The embed deliberately identifies each discussion with the canonical production URL (`https://www.viscerium.co.uk` plus the article pathname), so Pages preview hostnames do not create duplicate discussion threads.

Remark42's server-side `ALLOWED_HOSTS` must include every hostname from which the embed is intentionally tested. Production requires `https://www.viscerium.co.uk`; add an exact `pages.dev` preview hostname on the VPS when a preview deployment needs to exercise comments. Do not loosen the allow-list merely to make arbitrary previews work.

Before production deployment, confirm:

1. `https://comments.viscerium.co.uk/web/` is healthy over HTTPS.
2. The Remark42 container has persistent storage mounted at `/srv/var`.
3. The production site hostname is allowed by Remark42.
4. The Astro CSP allows `https://comments.viscerium.co.uk` for scripts, frames, and connections.
5. GitHub authentication and the configured Remark42 administrator identity still work.

### Webmentions

Incoming Webmentions use Webmention.io and are enabled by the repository defaults for the canonical production domain:

```text
PUBLIC_WEBMENTIONS_ENABLED=1
PUBLIC_WEBMENTION_IO_USERNAME=www.viscerium.co.uk
```

No secret is required in Cloudflare Pages for the current public JF2 API integration. The site advertises `https://github.com/Bladeswillfall` as its explicit IndieLogin authentication identity using `rel="me authn"`. The corresponding GitHub profile Website field must point back to `https://www.viscerium.co.uk/` so IndieLogin can verify the relationship in both directions.

Before relying on the service in production, sign in to Webmention.io with `https://www.viscerium.co.uk`, authenticate through the advertised GitHub identity, complete the domain verification, and confirm that the assigned username is `www.viscerium.co.uk`.

`PUBLIC_WEBMENTIONS_ENABLED=0` remains available as an emergency off switch. Use the endpoint override variables in `Site/.env.example` only if Webmention.io supplies different endpoints.

### Analytics and verification

GA4, Cloudflare Web Analytics, and Rybbit are independent and disabled by default:

```text
PUBLIC_GA4_ENABLED=0
PUBLIC_GA4_MEASUREMENT_ID=
PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED=0
PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN=
PUBLIC_RYBBIT_ENABLED=0
PUBLIC_RYBBIT_HOST=https://analytics.viscerium.co.uk
PUBLIC_RYBBIT_SITE_ID=
PUBLIC_GOOGLE_SITE_VERIFICATION=
```

Set a provider's enable flag to `1` only after adding its genuine public identifier. If Cloudflare automatically injects Web Analytics for the Pages project, leave the repository-managed Cloudflare integration disabled to avoid duplicate page views.

The production Rybbit site uses these public build values:

```text
PUBLIC_RYBBIT_ENABLED=1
PUBLIC_RYBBIT_HOST=https://analytics.viscerium.co.uk
PUBLIC_RYBBIT_SITE_ID=d863318efa2f
```

Keep Rybbit disabled on preview deployments unless preview traffic should count in production analytics. The Rybbit Site ID is public client configuration, not a secret.

`PUBLIC_GOOGLE_SITE_VERIFICATION` adds public Search Console verification metadata. It is not an analytics tracker. Any analytics consent, privacy notice, or cookie/storage decision still requires the owner's review before tracking is enabled.

### Contact form public values

The static page can post to a separate Worker after that Worker exists:

```text
PUBLIC_CONTACT_FORM_ENABLED=0
PUBLIC_CONTACT_FORM_ENDPOINT=
PUBLIC_TURNSTILE_SITE_KEY=
```

Set the enable flag to `1` only after the HTTPS endpoint and public Turnstile site key are real and tested.

Never add `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, the recipient address, or other Worker-only values to the static Pages project. See `Site/CONTACT_FORM_SETUP.md`.

## Deployment retry note

Cloudflare's **Retry deployment** action retries the same commit. If the deployment log shows an older commit SHA, start a fresh deployment from the verified `main` commit instead of retrying that build.
