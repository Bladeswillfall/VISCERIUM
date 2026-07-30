# Story Entity Workflow SOP

> **Use this SOP when:** You create or maintain fauna, flora, fungi, or item notes.
>
> **Result:** One valid draft exists in the correct folder.
>
> **First action:** Confirm that Templater is enabled in Obsidian.

Follow [[Documentation Writing Standard]] for operational wording.

## Purpose

Create one valid draft through a supported Obsidian workflow.

Keep the Markdown note as the source of truth.

## Before you start

1. Confirm that **Templater** is enabled.
2. Use [[Creator Command Reference]] when you need an exact command name.

## Choose a route

| Your starting point | Use |
| --- | --- |
| Home or another note | **Create from Home** |
| The correct database folder | **Create from a database folder** |
| A new device without folder-first creation | **One-time device setup** |
| An unavailable Home control | **Troubleshooting** |

## Create from Home

1. Open [[Home]].
2. Click **Create Story Entity**.
3. Select **Fauna**, **Flora**, **Fungi**, or **Item**.
4. Complete the common prompts.
5. Select only the optional modules that you need now.

### Check the result

Confirm that the note is in `Drafts/Databases/<Type>/`.

> **Why:** The workflow uses the selected type to choose the correct folder and template.

## Create from a database folder

Use this procedure when you already know the entity type.

1. Open one configured database folder.
2. Create a Markdown note directly inside that folder.
3. Complete the Templater prompts.
4. Confirm that the workflow does not ask for the type.

The folder supplies the entity type.

## One-time device setup

Use this setup only when you want folder-first creation.

1. Open **Settings → Templater → File creation**.
2. Enable **Trigger Templater on new file creation**.
3. Keep the matching mode on **Folder templates**.
4. Confirm that no `/` catch-all folder rule exists.

> **Why:** A catch-all rule can start the workflow twice or run it in unrelated folders.

The repository contains rules for these folders:

- `Drafts/Databases/Fauna`
- `Drafts/Databases/Flora`
- `Drafts/Databases/Fungi`
- `Drafts/Databases/Items`

### Check the result

1. Create a temporary note in one configured folder.
2. Confirm that Templater starts the Story Entity workflow.
3. Delete the temporary note.

## Set the era

1. Open the note.
2. Press **Ctrl/Cmd + P**.
3. Run **VISCERIUM Creator Tools: Set controlled era / Universal scope**.
4. Select one controlled value.

Do not type a new era name into a raw property field.

If the subject needs historical versions, follow [[Era Edition Workflow SOP]].

## Add or change Storyteller fields

### Select the modules

1. Open the note.
2. Press **Ctrl/Cmd + P**.
3. Run **Templater: Insert template**.
4. Select `Add Storyteller Fields`.
5. Select only the modules that you need.

### Resolve each prompt

| Goal | Action |
| --- | --- |
| Replace a free-text value | Edit the pre-filled value. |
| Remove a free-text value | Submit a blank value. |
| Keep a free-text value | Cancel the prompt. |
| Keep or remove a controlled value | Select **Keep current** or **Clear value**. |

Unselected modules remain unchanged.

> **Why:** Explicit keep and clear choices prevent accidental data loss.

## Browse Story Entities

Open [[Story Entities.base]] for cross-type browsing.

Open a type-specific Base for detailed comparison.

Use **Cards** for browsing.

Use **Database** or table views for structured editing.

Do not treat a Base as a second database.

The Markdown note and its properties remain authoritative.

## Check structural health

Run Vault Doctor after broad edits, imports, or folder moves.

1. Open a terminal at the repository root.
2. Run `cd Site`.
3. Run `npm run doctor:vault`.
4. Fix each structural error before you merge or publish.

Review notices when they identify a possible inconsistency.

Vault Doctor does not measure creative completeness.

An absent optional property is valid.

## Publish a Story Entity

Creation does not publish a note.

1. Keep working material under `Drafts/`.
2. Move a ready note to the correct `Lore/` path.
3. Set `status: published` only when the note is ready for public canon.
4. Run `cd Site && npm run doctor:vault` after the move.

Use [[Entity Authoring SOP]] to decide when the content is useful enough.

> **Why:** Folder placement and publication status control different parts of the publishing workflow.

## Troubleshooting

### Create from the Command Palette

1. Press **Ctrl/Cmd + P**.
2. Run **Templater: Create Databases/New Story Entity**.
3. Continue the normal prompts.

### Use the general Templater fallback

1. Press **Ctrl/Cmd + P**.
2. Run **Templater: Create new note from template**.
3. Select `New Story Entity`.
4. Continue the normal prompts.

Do not run files in `Templates/_Internals/` directly.

### A database-folder note does not start Templater

1. Open **Settings → Templater → File creation**.
2. Confirm that **Trigger Templater on new file creation** is enabled.
3. Confirm that the note is directly inside a configured folder.

### The Home Create button is disabled

1. Confirm that Templater is enabled.
2. Restart Obsidian after plugin or command configuration changes.
3. Press **Ctrl/Cmd + P**.
4. Run **Templater: Create Databases/New Story Entity**.

### The workflow asks for the type

Confirm that the note is directly inside one configured Story Entity folder.

### The workflow runs twice

1. Open **Settings → Templater → Folder templates**.
2. Remove extra parent-folder rules.
3. Remove any `/` catch-all rule.

### Vault Doctor reports an error

Fix the structural conflict.

If the system rules changed intentionally, follow [[Schema Change SOP]].

## Stop condition

Stop when the note is valid and useful for the current creative work.

Do not fill optional properties only because they exist.
