---
title: Published Site Graph
status: private
---

# Published Site Graph

The Astro/Starlight site builds a custom Cytoscape World Graph from links between published codex pages. The graph is available at `/graph/`. Article backlinks remain a separate generated feature.

## How to prepare notes in Obsidian

- Keep canon, public worldbuilding notes in `Vault/Lore/` with `status: published`.
- Use normal Markdown links or Obsidian wikilinks between lore notes so the site graph can discover relationships after sync.
- Add optional `tags` frontmatter to show thematic context in a selected page's graph details. Tags are not separate graph nodes.
- Use the optional `links` frontmatter field for explicit extra graph links when a relationship should appear even if it is not linked in the note body.

After pulling site updates, run `cd Site`, `npm ci`, then `npm run dev` for a local preview or `npm run build` for production output. Both commands regenerate the published graph data.
