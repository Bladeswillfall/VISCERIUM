# RSS and Atom feeds

The codex publishes two static web feeds:

- `/rss.xml` — RSS 2.0 feed.
- `/atom.xml` — Atom feed.

Both feeds are generated from the `docs` content collection and include public canon pages only:

```ts
data.status === 'published'
```

## Feed metadata

Default feed metadata lives in `Site/site.config.mjs`:

```js
feeds: {
  title: env.PUBLIC_FEED_TITLE ?? 'VISCERIUM Codex',
  description: env.PUBLIC_FEED_DESCRIPTION ?? 'Latest public canon updates from the VISCERIUM codex.',
  language: env.PUBLIC_FEED_LANGUAGE ?? 'en',
  maxItems: Number.isFinite(feedMaxItems) ? feedMaxItems : 50,
}
```

Optional Cloudflare Pages environment variables:

```bash
PUBLIC_FEED_TITLE="VISCERIUM Codex"
PUBLIC_FEED_DESCRIPTION="Latest public canon updates from the VISCERIUM codex."
PUBLIC_FEED_LANGUAGE=en
PUBLIC_FEED_MAX_ITEMS=50
```

## Date frontmatter

Feed ordering uses the first available value from this priority order:

1. `updated`
2. `date`
3. `published`

Recommended frontmatter:

```yaml
---
title: Example Title
description: "A short SEO-safe page description."
status: published
type: article
published: 2026-07-08
updated: 2026-07-08
---
```

Undated pages are still included, but they sort below dated pages and omit RSS item `pubDate`. Atom requires an `updated` value per entry, so undated pages use a safe fallback date instead of pretending to know real edit history.

## Discovery

The site head advertises both feeds with alternate links:

```html
<link rel="alternate" type="application/rss+xml" href="/rss.xml">
<link rel="alternate" type="application/atom+xml" href="/atom.xml">
```

The footer also links directly to both feeds.
