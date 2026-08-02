# Creator Command Reference

> **Use this reference when:** You know the task but do not remember the command.
>
> **Result:** You find the exact command and know whether it changes files.
>
> **Next action:** Find your task in **Quick lookup**.

Follow [[Documentation Writing Standard]] for operational wording.

## Use this reference

1. Open [[Home]] for common creator actions.
2. Press **Ctrl/Cmd + P** to open the Obsidian Command Palette.
3. Type the exact command name from this page.
4. Read **Changes files?** before you run an unfamiliar command.

## Quick lookup

| Task | Use |
| --- | --- |
| Return to the creator dashboard | Open [[Home]] |
| See deliberate work tasks | [[Home]] → **All creator tasks**, or [[System/Creator Tasks|Creator Tasks]] |
| Continue the World Anvil transfer | [[Home]] → **Open Review First**, or [[Drafts/Inbox/World Anvil Migration Review|Migration Guide]] |
| Apply the safe mechanical World Anvil pass | `cd Site` then `npm run migration:worldanvil:integrate:write` |
| Audit missing World Anvil descriptions and timestamp keys | `cd Site` then `npm run migration:worldanvil:prepare` |
| Update an existing World Anvil article | [[#Update an existing World Anvil import]] |
| Reopen import context for the active World Anvil note | **VISCERIUM Creator Tools: Open World Anvil import review context** |
| Create fauna, flora, fungi, or an item | [[Home]] → **+ Story Entity** |
| Create a character, faction, location, event, or species | [[Home]] → **+ Lore Entity** |
| Create a Myrkild unit | [[Home]] → **+ Myrkild Unit** |
| Open creator context | [[Home]] → **Creator Context** |
| Find or assign a hotkey | **Settings → Hotkeys** |
| Set a controlled era or Universal scope | **VISCERIUM Creator Tools: Set controlled era / Universal scope** |
| Set a continuity identity | **VISCERIUM Creator Tools: Set continuity entity ID** |
| Create another historical edition | **VISCERIUM Creator Tools: Create era edition from current note** |
| Add location detail | **Templater: Insert template** → `Add Location Fields` |
| Add or edit Storyteller data | **Templater: Insert template** → `Add Storyteller Fields` |
| Add public article sidebar facts | [[System/Frontmatter Schema#Article facts sidebar|Article facts sidebar]] |
| Browse all Story Entities | Open [[Story Entities.base]] |
| Check creator data | `cd Site` then `npm run doctor:vault` |
| Run the normal local confidence check | `cd Site` then `npm test` |
| Start the Codex locally | `cd Site` then `npm run dev` |
| Open the active StoryLine timeline | [[Home]] → **Story Timeline** |
| Diagnose StoryLine integration | **VISCERIUM Timelines: Diagnose StoryLine integration** |

## Obsidian programs and plugins

| Tool | What it does | Source of truth |
| --- | --- | --- |
| **Obsidian** | Opens and edits the creator vault. | Markdown and YAML notes in `Vault/` |
| **Bases** | Shows filtered card and table views of notes. | The notes, not the `.base` view |
| **Templater** | Runs guided creation and edit workflows. | Templates under `Vault/Templates/` |
| **Dataview** | Builds dynamic dashboard lists and creator views. | The notes Dataview reads |
| **VISCERIUM Creator Tools** | Controls era/continuity authoring and, during migration, keeps World Anvil review context beside the active import. | Current note frontmatter and note-local import checklist |
| **VISCERIUM Timelines** | Shows canonical timelines and read-only StoryLine timelines in Obsidian. | Canonical Lore or StoryLine scene metadata |
| **StoryLine** | Organises private writing projects and scenes. | `Vault/Stories/` and StoryLine project data |
| **Chronos** | Renders note-local timeline blocks. | The Chronos block in the note |
| **Breadcrumbs** | Helps local creator navigation and hierarchy work. | Notes and local plugin data. The public graph uses note properties. |
| **Image Converter** | Converts imported raster artwork to repository WebP format. | Files under `Vault/Assets/` |
| **Obsidian Git** | Helps pull, commit and push repository changes from Obsidian. | The Git repository |

## Templater commands and hotkeys

The repository does not currently store custom hotkeys in `Vault/.obsidian/hotkeys.json`.

Use **Ctrl/Cmd + P** unless Obsidian shows a local binding.

The checked-in Templater configuration exposes the three direct creation commands.

It does not assign keyboard shortcuts to those commands.

| Task | Exact command | Shared hotkey |
| --- | --- | --- |
| Create a Story Entity | **Templater: Create Databases/New Story Entity** | None stored |
| Create a Lore Entity | **Templater: Create Lore/New Lore Entity** | None stored |
| Create a Myrkild unit | **Templater: Create Databases/New Myrkild Unit** | None stored |
| Add supported fields to an existing note | **Templater: Insert template** | None stored |
| Use the general creation fallback | **Templater: Create new note from template** | None stored |

### Check or assign a hotkey

1. Open **Settings → Hotkeys**.
2. Search for the exact command name.
3. Read the current binding beside the command.
4. Select the plus control to add a binding.
5. Resolve any conflict that Obsidian reports.

> **Why:** Hotkey assignments can differ between vault copies and devices.

### Use a command without a custom hotkey

1. Press **Ctrl/Cmd + P**.
2. Type the exact command name.
3. Select the command.

**Check the result:** Obsidian runs the selected command or opens its prompts.

## Creation commands

Run these commands with **Ctrl/Cmd + P** when the Home control is not available.

### Create a Story Entity

Command: **Templater: Create Databases/New Story Entity**

Changes files: **Yes.**

Creates a fauna, flora, fungi or item draft in the correct database folder. See [[Story Entity Workflow SOP]].

### Create a Lore Entity

Command: **Templater: Create Lore/New Lore Entity**

Changes files: **Yes.**

Creates a character, faction, location, event, or species draft.

The workflow can create task-bearing reference stubs when you select **Create new…**.

### Create a Myrkild unit

Command: **Templater: Create Databases/New Myrkild Unit**

Changes files: **Yes.**

Creates a structured Myrkild unit draft with guided controlled fields.

### Open creator context

Action: [[Home]] → **Creator Context**

Changes files: **No.**

Opens Outline, Backlinks and Local Graph in the right sidebar.

### Add location fields

Command: **Templater: Insert template** → `Add Location Fields`

Changes files: **Yes.**

Adds only the location properties that you select and supply.

### Add or edit Storyteller fields

Command: **Templater: Insert template** → `Add Storyteller Fields`

Changes files: **Yes.**

Adds, changes or removes selected Storyteller source properties. See [[Storyteller View SOP]].

## Era and continuity commands

### Set controlled era / Universal scope

Command: **VISCERIUM Creator Tools: Set controlled era / Universal scope**

Changes files: **Yes.**

Use it to select `CITADEL`, `SMOG`, `NEARSIGHT`, `ENTROPY`, `Universal`, or undefined when the value is not established. Events only offer historical eras.

Do not type arbitrary era strings into raw YAML.

### Set continuity entity ID

Command: **VISCERIUM Creator Tools: Set continuity entity ID**

Changes files: **Yes.**

Sets the stable readable `entity_id` used by a continuity family.

The suggested ID is a convenience, not the article title.

Use suffixes such as `-a` or `-b` when unrelated subjects need similar readable IDs.

### Create era edition from current note

Command: **VISCERIUM Creator Tools: Create era edition from current note**

Changes files: **Yes.**

Creates an independent historical draft under `Drafts/Inbox/Era Editions/<ERA>/`.

The command preserves `entity_id` and adds inherited-content review tasks.

See [[Era Edition Workflow SOP]].

## Bases

Open a Base like a normal vault file.

| Base | Use |
| --- | --- |
| [[Story Entities.base]] | Browse all structured Story Entities and continuity coverage. |
| [[Fauna.base]] | Browse and compare fauna. |
| [[Flora.base]] | Browse and compare flora. |
| [[Fungi.base]] | Browse and compare fungi. |
| [[Items.base]] | Browse and compare items. |
| [[Myrkild Units.base]] | Browse and compare Myrkild units. |
| [[World Anvil Import.base]] | Process the World Anvil migration by editorial tier and migration state. |

Use **Cards** for browsing and recognition.

Use table or **Database** views for comparison and structured editing.

The Markdown note remains the source of truth.

## World Anvil transfer

Follow [[World Anvil Migration SOP]] for the end-to-end process.

Start with [[Home]] → **Open Review First**. Use [[Drafts/Inbox/World Anvil Migration Review|Migration Guide]] when a card's action is unclear.

Opening an unresolved World Anvil import reveals its **Import review** pane.

The pane keeps the card's tier and next-action context.

The pane edits the note's review checklist.

It can open an existing same-title Codex note beside the import.

It moves through the remaining queue in Review-first priority order.

### Apply the safe mechanical migration pass

Command:

```bash
cd Site
npm run migration:worldanvil:integrate:write
```

Changes files: **Yes.**

The command adds or refreshes baseline import metadata, certain legacy links, generated review tasks, the migration Base, and the generated migration report. It also derives a working description from existing prose when possible and adds blank `created:` and `updated:` keys.

It does not choose canon, era, continuity identity, duplicate resolution, semantic relationships, or artwork rights.

### Audit migration frontmatter

Command:

```bash
cd Site
npm run migration:worldanvil:prepare
```

Changes files: **No.**

Reports how many imported notes still lack a derivable description or one of the timestamp keys.

Use `npm run migration:worldanvil:prepare:write` only when you need to apply that frontmatter preparation without rerunning the complete integration pass.

### Update an existing World Anvil import

Use this procedure when you convert one integrated import into a current VISCERIUM note.

There is no single Templater command that can apply every current field safely.

Integrated imports contain or receive these baseline properties:

- `title`
- `description` when useful prose can supply one
- `created`
- `updated`
- `status`
- `type`
- `development_level`
- `import_source`

> **Why:** The World Anvil integration adds safe baseline frontmatter before editorial review begins. The blank timestamp keys are not populated while the note remains in the excluded import queue.

Do not insert a full creation or type template into an existing import.

Full templates contain a complete frontmatter block and article skeleton.

#### Confirm the core frontmatter

1. Open the imported note.
2. Confirm that the baseline properties exist.
3. Keep `status: draft` during migration.
4. Correct `type` in Properties when the imported mapping is wrong.
5. Confirm or rewrite the generated `description` before publication.
6. Do not invent values for `created` or `updated` inside the import queue.

Common public properties are listed in [[System/Publishing Rules#Recommended frontmatter|Recommended frontmatter]].

If a raw article has no baseline frontmatter, create a separate current draft.

Use **Templater: Create Lore/New Lore Entity** or **Templater: Create Databases/New Story Entity**.

Copy only valid content into the new draft.

#### Add controlled properties

| Need | Exact action |
| --- | --- |
| Set historical scope | **VISCERIUM Creator Tools: Set controlled era / Universal scope** |
| Set continuity identity | **VISCERIUM Creator Tools: Set continuity entity ID** |
| Create another historical edition | **VISCERIUM Creator Tools: Create era edition from current note** |
| Add optional location facts | **Templater: Insert template** → `Add Location Fields` |
| Add supported Storyteller facts | **Templater: Insert template** → `Add Storyteller Fields` |

Run only the actions that the article needs.

> **Why:** An absent optional property is clearer than an empty or invented value.

#### Add an article facts sidebar

Edit `sidebar` in the YAML frontmatter.

No Templater command currently creates or edits the public article facts sidebar.

Use [[System/Frontmatter Schema#Article facts sidebar|Article facts sidebar]] for supported content and exact examples.

Do not confuse article facts with [[System/Creator Sidebar|the Obsidian creator sidebar]].

#### Check the converted note

1. Confirm that the note has one correct `type`.
2. Confirm that `era` is controlled or deliberately unresolved.
3. Confirm that `entity_id` exists only when continuity requires it.
4. Confirm that optional properties contain useful facts.
5. Complete the note's **Import review** checklist.
6. Move the note to its deliberate Drafts or Lore destination.
7. Edit it once and confirm that Auto-Properties populates the timestamp values.
8. Run `cd Site && npm run doctor:vault`.

**Stop condition:** The import has current frontmatter, no unresolved structural decision, and a deliberate destination.

### Open World Anvil import review context

Command: **VISCERIUM Creator Tools: Open World Anvil import review context**

Changes files: **No.**

Opening the pane does not change the note.

Checking a review task changes its Markdown checkbox and generated issue mirror.

Use this command only when you closed the contextual pane during an import.

Normal unresolved imports open the pane automatically.

Do not use the old raw import issue list as your primary work sequence.

Do not let low-tier cleanup displace Tier 1 or Tier 2 work.

## VISCERIUM Timelines and StoryLine commands

### Refresh compiled timelines

Command: **VISCERIUM Timelines: Refresh compiled timelines**

Changes files: **No.**

Use this after timeline metadata changes when an Obsidian timeline appears stale.

### Open StoryLine project timeline

Command: **VISCERIUM Timelines: Open StoryLine project timeline**

Changes files: **No.**

Opens a read-only timeline from the active StoryLine project's `storyDate` values. The Home button **Story Timeline** runs this command.

### Diagnose StoryLine integration

Command: **VISCERIUM Timelines: Diagnose StoryLine integration**

Changes files: **No.**

Reports StoryLine detection, project resolution, and dated-scene placement.

This diagnostic command belongs in the Command Palette, not the primary Home controls.
