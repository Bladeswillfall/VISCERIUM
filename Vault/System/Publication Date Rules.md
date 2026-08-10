# Publication Date Rules

VISCERIUM keeps authoring history, public publication history, and build history separate. A deployment must never make an unchanged article appear newly published or newly updated.

## Canonical fields

```yaml
created: 2026-06-18
published: 2026-07-08
updated: 2026-08-03
```

| Field | Meaning | Ownership |
| --- | --- | --- |
| `created` | Date the source note/article was originally created. | Obsidian Auto-Properties may fill a seeded blank value once and never overwrite it. |
| `published` | Date the article first became publicly available in the Codex. | Editorial. Set deliberately on first publication and never change it merely because the article is edited or redeployed. |
| `updated` | Date of the latest maintained authoring/content change. | Obsidian Auto-Properties updates it on modification. |

`created` is not a synonym for `published`. A draft may exist for days, months, or years before it becomes public.

## Publication workflow

New supported templates seed all three keys:

```yaml
created:
published:
updated:
```

Normal authoring should work as follows:

1. Create the note. Auto-Properties may fill `created` and `updated` as the note is authored.
2. Leave `published` blank while the note is a draft.
3. When changing the note to `status: published` for its first genuine public release, set `published` to that real publication date in `YYYY-MM-DD` format.
4. Never reset `published` for later revisions.
5. Let `updated` continue to reflect maintained changes.

Do not automate `published` from filesystem creation, modification, Git commit, checkout, build, deployment, or import timestamps. None of those events proves that the article first became public on that date.

For migrated or historical articles, backfill `published` only when an authoritative first-publication date is known. Otherwise leave it blank rather than inventing precision.

The legacy top-level `date` field remains accepted as a publication-date alias for older content. New authoring should use `published`.

## Public outputs

The site treats authored metadata as the source of truth:

| Public output | Source |
| --- | --- |
| Visible `Published` date | `published` |
| Visible `Updated` date | `updated`, or `published` when no later update exists |
| Schema.org `datePublished` | `published` |
| Schema.org `dateModified` | `updated`, or `published` when no later update exists |
| `article:published_time` | `published` |
| `article:modified_time` | `updated`, or `published` when no later update exists |
| RSS `pubDate` | `published` |
| Atom `published` | `published` |
| Feed ordering / Atom `updated` | `updated`, falling back to `published` |
| Sitemap `lastmod` | `updated`, falling back to `published` |

`created` is intentionally not exposed as a public publication date.

If an older article has `updated` but no trustworthy `published` value, the Codex may expose its update date without claiming a publication date.

## Build dates are not article dates

Git history, generated-file mtimes, CI checkout time, deployment time, and Astro build time are implementation details. They must not overwrite or substitute for the authored date fields above.

The custom Starlight footer and route metadata therefore use frontmatter instead of Starlight's Git-derived default `Last updated` value.

## Future Astro incremental builds

Astro 7.2 introduced experimental incremental static builds. VISCERIUM should adopt that feature once Astro marks it stable/non-experimental and the deployment environment can persist Astro's build cache between builds.

That future change is a build-performance optimisation only. Content digests/cache keys should decide whether a page needs rebuilding; they must not become publication chronology. The `created`, `published`, and `updated` contract in this document remains authoritative after incremental builds are enabled.
