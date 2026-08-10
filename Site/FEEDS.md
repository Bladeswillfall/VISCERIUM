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

Feed chronology comes only from note frontmatter. Build time, deployment time, file-system timestamps and the Git checkout date are never treated as public article history.

Recommended frontmatter:

```yaml
---
title: Example Title
description: "A short SEO-safe page description."
created: 2026-06-18
published: 2026-07-08
updated: 2026-08-03
status: published
type: article
---
```

Use the fields as follows:

- `created` is internal authoring provenance: when the source note/article was originally created. Obsidian may populate it, and it must never be rewritten merely because the site is rebuilt or the article is published.
- `published` is the date the Codex article first became public. Set it deliberately on first publication and keep it unchanged afterwards.
- `updated` is the latest maintained content date. Obsidian Auto-Properties keeps it current during authoring; the site uses the authored value rather than Git or build timestamps.
- Legacy `date` remains accepted as a publication-date alias for older content. New notes should use `published`.

RSS uses `published` for each item’s `pubDate`. Atom emits `published` as `published` and emits the resolved modification date as `updated`.

When `updated` is absent but `published` exists, the publication date is also used as the initial modification date. An older page with an authored `updated` date but no trustworthy publication date may still use that update date for ordering while omitting a false publication date.

Undated pages remain available on the site and may remain present in the feed, but RSS omits their item-level `pubDate`. Atom requires an `updated` value, so genuinely undated entries use the stable Unix epoch fallback rather than the current build time. The RSS channel omits `lastBuildDate` when no authored dates are available.

## Generated content

Category generation must not add or rewrite `created`, `published`, or `updated` fields on article pages. Generated category pages are excluded from the feeds.

The same authored dates also drive the public article date display, Article structured data, article time metadata, and sitemap `lastmod`. See `Vault/System/Publication Date Rules.md` for the canonical contract.

## Discovery

The site head advertises both feeds with alternate links:

```html
<link rel="alternate" type="application/rss+xml" href="/rss.xml">
<link rel="alternate" type="application/atom+xml" href="/atom.xml">
```

The footer also links directly to both feeds.
