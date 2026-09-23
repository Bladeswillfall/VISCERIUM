# VISCERIUM Unit Cards

First-party Obsidian plugin providing the `VISCERIUM Cards` custom Bases view used by entity and unit databases.

## Source and runtime

Edit:

- `src/main.js`
- `styles.css`
- `manifest.json`

Then sync the checked-in vault runtime:

```sh
node Tools/scripts/sync-obsidian-plugins.mjs --write
```

The view reads canonical note properties directly from Bases results. It does not create a second data store.
