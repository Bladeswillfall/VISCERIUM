# Degel Starmap

The Obsidian authoring workspace for the Degel System. This note is private to the creator vault. Public system navigation still comes from the Codex until the website renderer can consume Starmap data.

## System view

> [!important] Create the v2 map with the plugin
> In Obsidian, run **Xyl's Starmap: Insert Starmap Template** (the command may omit the plugin prefix). Use the exact v2 YAML fields the plugin generates. Replace this callout with the resulting Starmap code fence and configure the celestial objects listed below.

## Published celestial objects

- [[Degel]]: system star
- [[Crucibus]]: planet
- [[Errack]]: planet
- [[The Shards]]: ring fortresses associated with Errack
- [[Eye of Vordr]]: moon
- [[Eye of Visi]]: moon

## PlanetViews

Use the v2 PlanetView template for close-up views of Errack and the other planets once their system-map entries exist. Use `Assets/Images/` for author-owned source images, and link only to public Lore. Do not publish private story notes or authoring state.

## Publishing boundary

The source data currently powering the public map is in `Site/src/data/degel-system-map.mjs`; the page mounts `DegelSystemExplorer.astro`. Those remain operational during the migration. The plugin's Obsidian-only renderer cannot be embedded by copying its YAML into the public Markdown build. Do not remove the public accessible article list until the replacement is interactive and verified.
