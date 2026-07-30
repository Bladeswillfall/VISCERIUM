# VISCERIUM Layout Tools

Small first-party Obsidian helpers for presentation-only article layout.

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

The source is stored as a dedicated, **non-collapsible** `vc-indent` callout. Plugin CSS removes all callout chrome so it behaves as a layout container rather than a quotation or aside. Normal Markdown inside the block remains Markdown.

Do not use ordinary `Tab` for this purpose. Obsidian correctly treats leading indentation as Markdown structure, so tabs/spaces can turn text into nested lists or code blocks. The VISCERIUM command is deliberately separate from that behaviour.

A hidden publishing marker is stored on its own line inside the wrapper rather than in the callout title. The public Codex recognises that marker and removes its normal quotation styling while preserving the same horizontal offset.

### Repairing the first implementation

The first implementation accidentally used Obsidian's `-` callout suffix, which means **collapsed by default**, and placed the publishing marker in the visible title line. The current plugin automatically repairs that exact legacy syntax when an affected note is opened. You can also run **Repair visual indents created by the previous version** from the command palette.
