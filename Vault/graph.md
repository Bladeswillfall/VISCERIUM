---
title: Published Site Graph
status: private
---

# Published Site Graph

The Astro/Starlight site is configured to use [`starlight-site-graph`](https://github.com/Fevol/starlight-site-graph) for per-page graph views and backlinks on published codex pages.

## How to prepare notes in Obsidian

- Keep canon, public worldbuilding notes in `Vault/Lore/` with `status: published`.
- Use normal Markdown links or Obsidian wikilinks between lore notes so the site graph can discover relationships after sync.
- Add optional `tags` frontmatter to expose thematic groupings to the site graph.
- Use the optional `links` frontmatter field for explicit extra graph links when a relationship should appear even if it is not linked in the note body.

After pulling site updates, run `npm install` in `Site/`, then `npm run build` or `npm run dev:sync` to regenerate the published graph data.
