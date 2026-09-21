# VISCERIUM Layout Tools

First-party Obsidian helpers for presentation-only article layout.

## Source and runtime

Edit `src/main.js`, `styles.css`, and `manifest.json` in this directory.

Obsidian loads the checked-in runtime from `Vault/.obsidian/plugins/viscerium-layout-tools/`.

After a source change, run `node Tools/scripts/sync-obsidian-plugins.mjs --write` from the repository root. Run the same command with `--check` to verify source and runtime without writing files.

Do not edit the Vault runtime as the primary implementation.

## Visual block indentation

Use **Visual indent: move block right** when a paragraph or other Markdown block should sit farther to the right without becoming a nested list or code block.

- Select one or more complete lines and run the command, or place the cursor inside a paragraph with no selection.
- Default shortcut: `Alt+]`.
- The left-ribbon **indent** icon performs the same action.
- Right-click in the editor and choose **VISCERIUM: Move block right**.
- Run the command repeatedly to create deeper visual indentation.

Use **Visual indent: move block left** to remove one VISCERIUM indent layer.

- Place the cursor anywhere inside the indented block.
- Default shortcut: `Alt+[`.
- The editor context menu also exposes **VISCERIUM: Move block left** when applicable.

The source is stored as a dedicated, non-collapsible `vc-indent` callout. Plugin CSS removes all callout chrome so it behaves as a layout container rather than a quotation or aside. Normal Markdown inside the block remains Markdown.

Do not use ordinary `Tab` for this purpose. Obsidian treats leading indentation as Markdown structure, so tabs or spaces can turn text into nested lists or code blocks. The VISCERIUM command is separate from that behaviour.

A hidden publishing marker is stored on its own line inside the wrapper rather than in the callout title. The public Codex recognises that marker and removes its normal quotation styling while preserving the same horizontal offset.
