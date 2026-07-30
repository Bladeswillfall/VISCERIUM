# Recommended Plugins

The publishing workflow does not require paid plugins. Keep the authoring stack small and add optional plugins only when they remove more work than they create.

## Required for the checked-in creator workflow

1. Enable the built-in **Templates** plugin and keep `Templates` as its template folder.
2. Enable the built-in **Bases** plugin for creator-only card and database views.
3. Enable **Templater** for guided entity creation, progressive Storyteller field injection and the checked-in startup dashboard hook. Its configuration uses `Templates`, contains narrowly scoped folder-template rules for fauna, flora, fungi and items, registers direct template-specific create commands for the guided creator templates, and registers the VISCERIUM Home startup template.
4. On each device where folder-first creation should work, enable Templater's device-local **Trigger Templater on new file creation** switch. Do not add a vault-wide `/` catch-all rule.
5. On each device where [[Home]] should open automatically and the local 52-week creator-activity strip should update between vault sessions, enable Templater's device-local **Enable startup templates** switch.
6. Enable **Dataview** for the creator-only widgets and action surfaces on [[Home]] and for any deliberately authored creator queries. Canonical lore itself remains ordinary Markdown/YAML and does not depend on Dataview rendering.

## Optional conveniences

1. **Iconic** is the checked-in file/folder icon layer. Its `showAllFolderIcons` setting owns ordinary explorer folder icons; do not reintroduce a competing CSS folder-icon pseudo-element.
2. **Advanced Tables** or the checked-in table editor can help with table-style editing.
3. **Editing Toolbar** can provide a more visual editing experience.
4. **Style Settings** and a preferred theme can change Obsidian-only appearance.

Do not add a plugin merely to expose more fields, forms, dashboards or buttons. The homepage deliberately reuses Templater and Dataview already required by the vault instead of introducing a separate dashboard/button stack.

## Publishing caution

Dataview queries, Templater commands, plugin-only syntax, and theme-specific styling may not render on the Astro site.

Templater commands should be executed during authoring so the resulting note contains ordinary Markdown and frontmatter. Important public content must remain available as normal Markdown or structured properties that the site explicitly consumes.

`Home.md` is creator-only because it lives outside `Lore/`, and may therefore use DataviewJS for convenience actions and widgets without establishing a public Codex authoring convention.

## Creator sidebar

No additional sidebar plugin is required. The checked-in Home **Creator Context** action removes an open global Graph, ensures Obsidian's core Outline, Backlinks and Local Graph panes are available, and leaves Obsidian Git untouched as a utility pane. Workspace state stays device-local and ignored by Git.
