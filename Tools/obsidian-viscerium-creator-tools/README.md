# VISCERIUM Creator Tools

First-party Obsidian commands for guided creation, active-note continuation, Atlas and chronology hand-offs, controlled era and continuity authoring, era editions, and World Anvil migration review.

## Source and runtime

Edit `src/main.js`, `styles.css`, and `manifest.json` in this directory.

Obsidian loads the checked-in runtime from `Vault/.obsidian/plugins/viscerium-creator-tools/`.

After a source change, run:

```sh
node Tools/scripts/sync-obsidian-plugins.mjs --write
```

To check that source and runtime still match, run:

```sh
node Tools/scripts/sync-obsidian-plugins.mjs --check
```

Do not edit the Vault runtime as the primary implementation.
