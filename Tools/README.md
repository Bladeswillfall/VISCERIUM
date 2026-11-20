# VISCERIUM tools

`Tools/` owns maintained first-party creator tooling source.

## First-party Obsidian plugins

| Plugin | Maintained source | Checked-in runtime |
| --- | --- | --- |
| VISCERIUM Timelines | `Tools/obsidian-viscerium-timelines/` | `Vault/.obsidian/plugins/viscerium-timelines/` |
| VISCERIUM Creator Tools | `Tools/obsidian-viscerium-creator-tools/` | `Vault/.obsidian/plugins/viscerium-creator-tools/` |
| VISCERIUM Layout Tools | `Tools/obsidian-viscerium-layout-tools/` | `Vault/.obsidian/plugins/viscerium-layout-tools/` |
| VISCERIUM Unit Cards | `Tools/obsidian-viscerium-unit-cards/` | `Vault/.obsidian/plugins/viscerium-unit-cards/` |
| VISCERIUM Image Tools | `Tools/obsidian-viscerium-image-tools/` | `Vault/.obsidian/plugins/viscerium-image-tools/` |
| VISCERIUM Journal Tools | `Tools/obsidian-viscerium-journal-tools/` | `Vault/.obsidian/plugins/viscerium-journal-tools/` |

Timelines has its own build and sync scripts because it is bundled with esbuild.

The other five plugins are plain Obsidian payloads. Edit their source under `Tools/`, then run:

```sh
node Tools/scripts/sync-obsidian-plugins.mjs --write
```

Check the tracked runtime copies without changing them:

```sh
node Tools/scripts/sync-obsidian-plugins.mjs --check
```

Do not use `Vault/.obsidian/plugins/viscerium-*` as the primary source for first-party plugin changes.
