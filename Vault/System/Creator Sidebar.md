# Creator Sidebar

The right sidebar is for **context while creating**. Keep it collapsed when none of its panes are helping the current task; a utility pane should earn the width it occupies.

Recommended tabs:

1. **Outline** — structure of the active note.
2. **Backlinks** — what established material points at the active subject.
3. **Local Graph** — nearby lore context rather than the noisy global vault graph.
4. **Obsidian Git** — sync/push/pull as a utility tab rather than permanent dashboard content.

Use [[Home]] → **Creator Context** to close an open global Graph, ensure Outline, Backlinks and Local Graph are available in the right sidebar, and reveal that context. Git remains untouched as a utility tab.

## Temporary World Anvil import context

While the World Anvil migration is active, **VISCERIUM Creator Tools** automatically opens an **Import review** pane in the right sidebar whenever the active note is a World Anvil import with unresolved generated review tasks.

The pane keeps the Base-level context visible while the article is being edited:

- editorial tier and why the article deserves attention;
- the next migration decision and its guidance;
- the note's existing `## Import review` checklist;
- same-title Codex comparison when `existing-codex-match` is present;
- **Previous / Next** navigation using the same Tier → issue count → title order as **World Anvil Import → Review first**;
- links back to the migration guide and Base.

The sidebar checkboxes edit the existing Markdown checklist rather than creating another task store. The plugin also mirrors those resolved/unresolved generated tasks into `import_issues` so the Base remains useful as an index.

Completing every task only changes the review state. It never moves, deletes, publishes or canonises the note automatically.

When the active note is ordinary lore, the temporary Import review pane removes itself and the normal creator-context tabs remain available. This feature is intentionally migration-specific and can be removed with the creator migration tooling after the World Anvil transfer is complete.

Workspace placement remains device-local so collaborators are not forced into one pane arrangement. The global Graph remains available from the Command Palette when a whole-vault overview is genuinely useful.
