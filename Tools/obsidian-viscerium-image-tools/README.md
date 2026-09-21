# VISCERIUM Image Tools

First-party Obsidian renderer for VISCERIUM article images.

## Source and runtime

Edit `src/main.js` and `manifest.json` in this directory.

Obsidian loads the checked-in runtime from `Vault/.obsidian/plugins/viscerium-image-tools/`.

After a source change, run `node Tools/scripts/sync-obsidian-plugins.mjs --write` from the repository root. Run the same command with `--check` to verify source and runtime without writing files.

Do not edit the Vault runtime as the primary implementation.

## Frontmatter header images

When an open Markdown note contains `headerImage`, the plugin resolves the image from `Vault/Assets/Images` and renders a generated banner at the top of the note in Reading View and Live Preview.

The banner is presentation-only. It is not inserted into the Markdown body. `headerImage` remains the source of truth shared with the public Codex.

The plugin uses the note's `alt` property for accessible alternative text. Set `decorativeImage: true` when the image is decorative.

The visual treatment is owned by `Vault/.obsidian/snippets/Image styling.css`.

## Authored image layouts

The plugin preserves VISCERIUM image flags in ordinary Markdown embeds, including `left`, `right`, `center`, `wide`, explicit widths, transparent-shape wrapping, and wrapping gaps.

Use **VISCERIUM Image Tools: Refresh article image layouts** to force a refresh after changing plugin or snippet files without restarting Obsidian.
