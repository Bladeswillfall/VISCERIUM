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

## Authored dates

Feed chronology comes only from note frontmatter. Build time, deployment time, file-system timestamps and the Git checkout date are never treated as article history.

Recommended frontmatter:

```yaml
---
title: Example Title
description: "A short SEO-safe page description."
status: published
type: article
created: 2026-07-08
updated: 2026-08-03
---
```

Use the fields as follows:

- `created` is the date the public Codex page was first released. Keep it unchanged after publication.
- `updated` is the date of the latest meaningful public content revision. Omit it until the page is revised.
- When `updated` is absent, the feed uses `created` as the initial update date.
- Legacy `published` and `date` values remain accepted as creation-date aliases, but new notes should use `created`.

RSS uses `created` for each item’s `pubDate`. Atom emits `created` as `published` and emits the resolved modification date as `updated`.

An `updated` value without a creation/publication date is deliberately ignored for feed chronology. This prevents generated files or shallow deployment checkouts from inventing article history.

Undated pages remain available on the site and may remain present in the feed, but RSS omits their item-level `pubDate`. Atom requires an `updated` value, so genuinely undated entries use the stable Unix epoch fallback rather than the current build time. The RSS channel omits `lastBuildDate` when no authored dates are available.

## Generated content

Category generation must not add or rewrite `created` or `updated` fields on article pages. Generated category pages are excluded from the feeds.

## Discovery

The site head advertises both feeds with alternate links:

```html
<link rel="alternate" type="application/rss+xml" href="/rss.xml">
<link rel="alternate" type="application/atom+xml" href="/atom.xml">
```

The footer also links directly to both feeds.
