# Frontmatter Authoring Workflow

> **Next action:** Install the two community plugins, restart Obsidian, then test one new draft.
>
> **Result:** Mechanical metadata updates itself, common fields use controlled editors, and era continuity remains protected.

## Before you start

1. Pull the branch that contains this workflow.
2. Open **Settings → Community plugins → Browse**.
3. Install **Auto-Properties** and **Metadata Menu** if Obsidian has not installed them already.
4. Enable both plugins.
5. Restart Obsidian once so each plugin loads its checked-in `data.json`.

> **Why:** The repository stores plugin IDs and settings, but it does not store third-party `main.js` bundles.

## Know which tool owns each field

| Tool | Fields or actions it owns |
| --- | --- |
| Auto-Properties | `created`, `updated`, `word_count`, `open_task_count` |
| Metadata Menu | `status`, `type`, `headerImage`, `decorativeImage`, `tags`, `related`, `location`, `faction`, `participants` |
| VISCERIUM Creator Tools | `era`, `entity_id`, era editions, continuity checks, World Anvil review |

Do not add `era` to Metadata Menu.

> **Why:** A normal dropdown cannot enforce continuity-family collisions or the Universal-versus-historical model.

## Automatic rules

| Property | Trigger | Behaviour |
| --- | --- | --- |
| `created` | New-note modification or later open | Fills only when the note already contains a blank `created:` key. It never overwrites a value. |
| `updated` | Note modification | Fills the seeded blank `updated:` key and records the current local date on later edits. |
| `word_count` | Note modification | Counts words in the note body. |
| `open_task_count` | Note modification | Counts unchecked Markdown tasks. |

The rules run only inside `Lore`, `Drafts`, `Private`, and `Stories`.

The rules ignore `Drafts/WorldAnvil Import`.

Do not run **Auto-Properties: Update property values for every note in vault** during the first test.

> **Why:** Existing files can have checkout-time filesystem dates. The guarded timestamp workflow prevents false historical dates.

## Creation templates

The supported new-note creation paths seed both blank timestamp properties:

```yaml
created:
updated:
```

This applies to general articles, characters, factions, locations, events, species, items, calendars, eras, maps, image records, timelines, Story Entities, and Myrkild Units.

Do not type dates into a new note unless you are deliberately preserving a known source date.

## Folder-aware templates

Templater applies the internal folder router when you create a Markdown note anywhere beneath `Lore` or `Drafts/Inbox`.

The router examines the folder path from the nearest folder outward. The nearest recognised semantic folder wins.

| Folder examples | Template and `type` |
| --- | --- |
| `Characters`, `People`, `NPCs` | Character; `type: character` |
| `Factions`, `Nations`, `Kingdoms`, `Orders`, `Cults`, `Corporations` | Faction; `type: faction` |
| `Locations`, `Regions`, `Settlements`, `Cities`, `Wilderness`, `Ruins`, `Worlds` | Location; `type: location` |
| `Events`, `Battles`, `Conflicts` | Event; `type: event` |
| `Species`, `Fauna`, `Reptile`, `Mammals`, `Birds`, `Flora`, `Fungi`, `Myrkildicary` | Species; `type: species` |
| `Items`, `Weapons`, `Weaponry`, `Armour`, `Equipment`, `Tools`, `Artefacts`, `Vehicles`, `Technology` | Item; `type: item` |
| `Maps`, `Images`, `Timelines`, `Calendar` | The matching specialist template |
| Directly beneath `Lore/Eras` | Era; `type: era` |
| `Degel System` | General article; `type: article` |

Historical era folders also seed the controlled scalar `era` value. For example, a note created in `Lore/Eras/CITADEL/Weapons & Armour/Weaponry` receives the Item template, `type: item`, `item_type: weapon`, and `era: CITADEL`.

Biological subfolders seed `species_kind`. For example, a note created in a `Reptile` folder receives the Species template and `species_kind: reptile`.

The router does not move the note. The folder you selected remains its location.

When no folder has a recognised meaning, Templater asks which supported template to use rather than guessing silently.

The specialist Story Entity databases remain separate:

- Notes created beneath `Drafts/Databases/Fauna`, `Flora`, `Fungi`, or `Items` use the progressive Story Entity workflow.
- Nested database folders inherit the parent Story Entity type and retain the nested folder.
- Notes created beneath `Drafts/Databases/Myrkild Units` use the Myrkild Unit workflow.

Restart Obsidian after pulling changes to Templater settings or user scripts.

## Backfill existing Lore articles

Templater runs only when a note is created. Existing notes use a separate audit-first command.

From `Site`, run:

```bash
npm run frontmatter:folders:audit
```

The audit scans Markdown notes beneath `Vault/Lore` and reports proposed additions for these path-derived fields:

- `type`
- `era`
- `item_type`
- `species_kind`

Audit mode does not modify any file.

Review every reported conflict or ambiguity. A conflict means an existing authored value disagrees with the folder path. The command leaves that value untouched. An ambiguous type means the folder path has no recognised semantic type; the command does not silently add `type: article`.

After reviewing the audit, apply the safe additions with:

```bash
npm run frontmatter:folders:write
```

Write mode fills only fields that are absent, blank, `null`, or `~`. It never replaces a populated authored value, never creates frontmatter for a prose-only file, and leaves article prose unchanged.

Run the audit again afterwards. A clean second run should report no proposed changes. Any remaining conflicts or notices are editorial decisions rather than mechanical backfill work.

> **Why:** Folder placement is useful evidence, but an existing authored field may encode a deliberate exception. The backfill treats contradictions as review items rather than allowing directory names to overwrite canon.

## World Anvil imports

Use [[World Anvil Migration SOP]] for the import queue.

Run this command from `Site` after importing or after a broad migration batch:

```bash
npm run migration:worldanvil:integrate:write
```

The command derives a working description from existing prose when possible, reports descriptions it cannot derive, and seeds a blank `updated:` key. It excludes generated import-review tasks from candidate descriptions.

The command does not add `created:` to imported notes.

> **Why:** A migrated file's filesystem creation time normally identifies when it was exported, copied, or imported. It is not a trustworthy article creation date.

After you move a resolved import to its final Drafts or Lore folder, edit it once and confirm that Auto-Properties fills `updated`, `word_count`, and `open_task_count` as applicable.

Add `created` manually only when you have an authoritative source creation date. Otherwise leave it absent.

## Edit controlled fields

1. Open a lore or draft note.
2. Use Metadata Menu from the Properties view, file menu, command palette, or supported Base view.
3. Choose `status` or `type` from the controlled lists.
4. Use `headerImage` to choose a file from `Assets/Images`.
5. Use the relationship fields to choose existing character, faction, or location notes.
6. Use **VISCERIUM Creator Tools: Set controlled era / Universal scope** for `era`.

Metadata Menu does not manage automatic, continuity, chronology, migration, route, or generated fields.

The initial `status` list contains only `draft` and `published` because those are the states currently used by the publishing workflow. Extend the list only through a deliberate schema change.

## Test the setup

Create one test note with each Home action that you use:

- **+ Lore Entity**
- **+ Story Entity**
- **+ Myrkild Unit**

Also create disposable notes directly inside representative semantic folders:

- one beneath a `Weaponry` or `Armour` folder;
- one beneath a `Reptile` folder;
- one beneath a `Nations` folder.

For each test note:

1. Confirm that the expected template and `type` were applied.
2. Confirm that a recognised item or species subfolder filled `item_type` or `species_kind`.
3. Confirm that a historical era in the path filled `era`.
4. Confirm that the note remained in the folder where you created it.
5. Confirm that the template contains blank `created:` and `updated:` properties.
6. Type a short sentence.
7. Confirm that `created`, `updated`, and `word_count` populate.
8. Add one unchecked task and confirm that `open_task_count` appears.
9. Change `status` and `type` with Metadata Menu.
10. Choose one `headerImage` where the template supports it.
11. Set or change the era with VISCERIUM Creator Tools, not Metadata Menu.
12. Close and reopen Obsidian. Confirm that the settings remain.

Then run:

```bash
cd Site
npm run frontmatter:folders:audit
npm run doctor:vault
npm run build
```

Confirm that the selected header image copies to the generated site and that the build reports no metadata error.

## If header image selection fails

Metadata Menu writes the selected image filename. The site sync accepts plain image filenames and resolves them against `Vault/Assets/Images`.

Check these conditions:

1. The file is inside `Vault/Assets/Images`.
2. The file uses an allowed format, normally WebP.
3. The filename is unique.
4. `headerImage` contains the selected filename, not an unrelated note link.

## Stop condition

Stop when one representative note completes the full workflow without:

- touching `System`, `Templates`, or the World Anvil import queue during normal editing;
- changing `era` outside Creator Tools;
- producing repeated Git changes while the note is idle;
- failing the vault doctor or site build.
