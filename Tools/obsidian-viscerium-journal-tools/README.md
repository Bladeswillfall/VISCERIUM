# VISCERIUM Journal Tools

First-party Obsidian bridge for the Chronicle daily-journal workflow. It provides the **Seal Today's Activity** command and copies the local Daily Activity timeline into the current daily note as a snapshot.

## Source and runtime

Edit `src/main.js` and `manifest.json` in this directory.

Obsidian loads the checked-in runtime from `Vault/.obsidian/plugins/viscerium-journal-tools/`.

After a source change, run `node Tools/scripts/sync-obsidian-plugins.mjs --write` from the repository root. Run the same command with `--check` to verify source and runtime without writing files.

Do not edit the Vault runtime as the primary implementation.
