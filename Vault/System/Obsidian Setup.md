# Obsidian Setup

Open only the `Vault/` folder in Obsidian.

> [!tip] Start at Home
> [[Home]] is the creator front door: current focus, recent work, creation controls, writing context, creator activity and quick links. Use [[Creator Command Reference]] whenever you need the complete command lookup.

## Required setup

1. Enable Obsidian's built-in **Templates** core plugin.
2. Enable Obsidian's built-in **Bases** core plugin. It is already enabled in the checked-in vault configuration.
3. Enable the **Templater** community plugin. It is included and enabled in the checked-in vault configuration.
4. Enable **Dataview**. Home uses it for creator widgets and small action surfaces; database and lore source data remain ordinary Markdown/YAML.
5. Keep both template folder locations set to `Templates`. The checked-in configuration already does this; role-specific templates live in subfolders beneath that single root.
6. In **Settings → Templater → File creation**, enable **Trigger Templater on new file creation** on each device where folder-first story-entity creation should work. This master toggle is device-local and cannot be enabled by Git.
7. Leave Templater's matching mode on **Folder templates**. The repository already contains narrowly scoped rules for `Drafts/Databases/Fauna`, `Flora`, `Fungi` and `Items`; do not add a `/` catch-all rule.
8. In **Settings → Templater → Startup templates**, enable **Enable startup templates** on each device where [[Home]] should open automatically and local creator activity should be recorded between vault sessions. The repository already registers `Templates/_Startup/Open VISCERIUM Home.md`; only the device-local permission must be enabled.
9. Write publishable lore in `Lore/`.
10. Keep drafts in `Drafts/`, private notes in `Private/`, process notes, SOPs and Bases in `System/`, and demonstration material in `Demo/`.
11. Put real project images in `Assets/Images/` and fictional map images in `Assets/Maps/`. Demo assets stay beneath `Demo/Assets/`.

Restart Obsidian after first opening the vault if Templater commands do not appear immediately.

## Article width

`Vault/.obsidian/snippets/Article widths.css` owns the responsive width of ordinary Markdown notes in both Reading View and Live Preview. It keeps articles centred, expands the article lane to a `92rem` maximum, and preserves responsive side gutters rather than making prose edge-to-edge.

Change ordinary article sizing in that snippet instead of adding a competing global `markdown-preview-sizer`, `.cm-sizer` or theme override elsewhere. The active theme still owns typography, colours and the rest of the document chrome.

[[Home]] is intentionally excluded because it is a dashboard rather than an ordinary article. `Home dashboard.css` owns that page's full-width, pane-responsive layout.

## Startup homepage

The checked-in Templater startup template performs two creator conveniences after the Obsidian workspace is ready:

1. compare creator-note state with the previous vault session and update the rolling 52-week activity history in browser local storage;
2. open `Home.md` in Reading View, reusing an existing Markdown leaf where possible instead of creating a new Home tab on every launch.

The activity tracker ignores `Home.md`, `System/`, `Templates/` and `Demo/`, and stores no activity ledger in the repository.

Templater intentionally stores **Enable startup templates** in local device storage for safety, so Git cannot turn it on. Enable it once per Obsidian installation. If you prefer Obsidian to reopen exactly where you left off instead, leave the toggle off; [[Home]] remains available as an ordinary note, but activity will only update when the startup template next runs.

## Template commands

For fauna, flora, fungi and items, use **Templater: Create Databases/New Story Entity**. This template-specific command launches [[New Story Entity]] directly without a second template picker.

For characters, factions, locations, events and species, use **Templater: Create Lore/New Lore Entity**. Relationship fields are searchable. When the referenced thing does not exist, explicitly choose **Create new…**; the workflow creates a task-bearing stub under `Drafts/Inbox/` rather than silently accepting an untracked free-text value.

For structured Myrkild profiles, use **Templater: Create Databases/New Myrkild Unit**. Era, Myrkild species, origin, size and known locations are guided during creation.

The older/general route remains valid: **Templater: Create new note from template** → choose the creator-facing template.

Creating a normal new Markdown note directly inside one of the four ordinary database folders uses the same [[New Story Entity]] workflow automatically when the per-device creation trigger is enabled. The folder supplies the entity type, so that question is skipped.

New article templates and guided creation workflows include a marked `## Storyteller View` footer. Edit that section directly with ordinary Markdown.

For an older note without the footer, place the cursor at the end of the note, use **Templater: Insert template**, and choose [[Add Storyteller Fields]]. The filename is retained for compatibility, but the helper now inserts the Storyteller boundary comments and foldable heading. It does not edit frontmatter properties. If either marker already exists, it refuses to insert a second section.

Do not invoke templates under `Templates/_Internals/`, `Templates/_Scripts/` or `Templates/_Startup/` directly. They contain shared implementation, user-script helpers or startup behaviour rather than creator-facing workflows.

Use [[Home]] → **Creator Context** to open Outline, Backlinks and Local Graph in the right sidebar without committing device-local workspace state.

## Template roles

All templates live beneath the single `Templates/` root and are grouped by purpose:

- **`Templates/Lore/`** — guided Lore creation plus static Character, Faction, Location, Event and Era skeletons.
- **`Templates/Databases/`** — Story Entity and Myrkild unit creation plus the compatibility helper for inserting a marked Storyteller section into older notes.
- **`Templates/Publishing/`** — Map and Image Metadata skeletons.
- **`Templates/Timelines/`** — canonical and note-local timeline templates.
- **`Templates/_Internals/`** — shared implementation; never invoke directly.
- **`Templates/_Scripts/`** — Templater user-script helpers such as the relationship picker; never invoke directly.
- **`Templates/_Startup/`** — startup automation; never invoke directly.

Public-Lore templates deliberately do **not** render an Obsidian-only infobox/sidebar. Structured metadata remains in Properties/frontmatter; the article body stays focused on readable worldbuilding and its marked Storyteller section remains ordinary Markdown.

## Story entity workflow

Creator-facing fauna, flora, fungi and item cards live in Obsidian Bases. [[Story Entities.base]] provides the cross-entity navigation view and includes Myrkild units without replacing their specialised Base.

Follow [[Story Entity Workflow SOP]] for the practical creation and filing process, then [[Entity Authoring SOP]] when deciding how much detail is enough. Use [[Creator Command Reference]] for the exact commands and terminal health checks.

## WorldAnvil/Wikipedia-style writing workflow

Templates use a simple wiki-style shape:

- YAML frontmatter for machine-readable publishing fields, Bases and relationships.
- A concise summary first.
- Topic sections only where they help explain or use the subject.
- Wikilinks for meaningful relationships and navigation.
- A marked Storyteller footer for scene-facing guidance that needs normal Markdown, tables, images or embeds.
- Creator-only guidance inside `%% comments %%` where it should not become public prose.

Bases are authoring and browsing views over stable Markdown properties. Keep canonical information in the notes themselves rather than relying on view-only configuration. Keep Storyteller prose in the article body rather than forcing it into properties for display in a Base.

This is intentionally plain Markdown so the vault remains portable. Homepage actions and Dataview summaries are creator conveniences only; the underlying notes, properties and SOPs remain usable without them.

Open only the `Vault/` folder in Obsidian. Use templates from `Vault/Templates/`. Put images in `Vault/Assets/Images/` and maps in `Vault/Assets/Maps/`.
