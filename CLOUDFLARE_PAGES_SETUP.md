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

### Giscus

Giscus is enabled by the repository defaults. Confirm GitHub Discussions and the configured category still exist:

1. Enable GitHub Discussions.
2. Create or select the discussion category.
3. Obtain the real repository and category IDs.
4. Keep or override these public values:

```text
PUBLIC_GISCUS_ENABLED=1
PUBLIC_GISCUS_REPO=Bladeswillfall/VISCERIUM
PUBLIC_GISCUS_REPO_ID=R_kgDOTOiQ7g
PUBLIC_GISCUS_CATEGORY=Comments
PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDOTOiQ7s4DCYjH
```

Set `PUBLIC_GISCUS_ENABLED=0` only when comments must be disabled. Existing discussion threads do not automatically move with a Git repository. Review and transfer or recreate any discussion that should continue.

The migration audit on 2026-07-30 found one welcome announcement in the old repository, discussion 4, and no Giscus-backed page threads. Verify that result again immediately before cutover. Transfer or recreate the welcome announcement only if it is still wanted.

### Webmentions

Webmentions are disabled until `www.viscerium.co.uk` has been registered and verified with Webmention.io. Then configure:

```text
PUBLIC_WEBMENTIONS_ENABLED=1
PUBLIC_WEBMENTION_IO_USERNAME=www.viscerium.co.uk
```

Use the endpoint override variables in `Site/.env.example` only if Webmention.io supplies different endpoints.

### Analytics and verification

GA4 and Cloudflare Web Analytics are independent and disabled by default:

```text
PUBLIC_GA4_ENABLED=0
PUBLIC_GA4_MEASUREMENT_ID=
PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED=0
PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN=
PUBLIC_GOOGLE_SITE_VERIFICATION=
```

Set a provider's enable flag to `1` only after adding its genuine public identifier. If Cloudflare automatically injects Web Analytics for the Pages project, leave the repository-managed Cloudflare integration disabled to avoid duplicate page views.

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
