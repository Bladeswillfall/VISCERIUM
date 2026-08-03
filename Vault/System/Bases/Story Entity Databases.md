# Story Entity Databases

The fauna, flora, fungi and item databases use **Obsidian Bases** as creator-only card browsers over ordinary Markdown notes. Myrkild retain their specialised database while also appearing in the cross-entity index.

> [!important] Public presentation
> Base cards do not publish to the Codex. Profile properties support creator filtering and comparison. Public Storyteller material is authored as Markdown in the marked footer of each note.

## Open the databases

- [[Story Entities.base]] — cross-entity navigation across fauna, flora, fungi, items and Myrkild units.
- [[Fauna.base]]
- [[Flora.base]]
- [[Fungi.base]]
- [[Items.base]]
- [[Myrkild Units.base]]

Use **Story Entities** to answer broad creator questions such as what exists, what changed recently, what type an entry belongs to, or which entries remain stubs. Use the type-specific Bases for cards, profile comparison and structured editing.

The master index is deliberately not a completion dashboard. `development_level` remains a fitness state, not a percentage or obligation to fill more fields.

[[Home]] links to the same database entry points with short explanations of what each surface is for.

## Draft database folders

Working story-entity notes live under:

- `Drafts/Databases/Fauna/`
- `Drafts/Databases/Flora/`
- `Drafts/Databases/Fungi/`
- `Drafts/Databases/Items/`
- `Drafts/Databases/Myrkild Units/` for the existing specialised Myrkild workflow.

Use folders for entity type, not era, nation or biome. Those relationships belong in note properties because a single entity may span many of them.

## Create from anywhere

The fastest routes are equivalent:

1. On [[Home]], click **Create Story Entity**; or run **Templater: Create Databases/New Story Entity** from the Command Palette.
2. Select Fauna, Flora, Fungi or Item.
3. Complete the small common core.
4. Select only the optional modules that matter to the current story.
5. The finished note is automatically filed into the matching draft database folder.

The direct command is registered from the same [[New Story Entity]] template. The general Templater route remains available: **Templater: Create new note from template** → [[New Story Entity]].

The template creates only the profile properties that are useful for filtering and placement. Optional Storyteller answers are written as ordinary Markdown inside the marked footer. Declining a module does not establish negative canon and does not leave a visible checklist of missing work.

## Create from a database folder

When Templater's per-device **Trigger Templater on new file creation** switch is enabled, creating a normal new Markdown note directly inside one of the four ordinary story-entity folders automatically launches the same [[New Story Entity]] workflow.

The folder supplies the entity type, so the Fauna / Flora / Fungi / Item question is skipped. All later prompts and generated content remain identical to command-based creation.

The repository stores the folder-template rules, but the master trigger switch is local to each Obsidian device. See [[Story Entity Workflow SOP]] for setup and troubleshooting.

## Add detail later

Open the note and edit the `## Storyteller View` footer directly. Use normal headings, tables, links, images, lists, callouts and embeds between the markers.

For an older note without a marked footer, place the cursor at the end of the note, run **Templater: Insert template**, and choose [[Add Storyteller Fields]]. The retained template name now inserts the Markdown boundaries and heading; it does not add properties.

Do not move Storyteller prose into properties merely to expose it in a Base.

## Check creator-data health

From the repository terminal:

```bash
cd Site
npm run doctor:vault
```

Vault Doctor validates objective structure rather than creative completeness. It can fail on contradictions such as the wrong `type` for a database folder, malformed list properties, invalid era values, unknown development states or duplicate Myrkild unit IDs.

Notices do **not** fail the check. They flag things worth human inspection, such as a plain-text location that closely resembles a canonical note title and may contain a typo.

Missing optional profile properties and empty Storyteller sections are not errors or notices merely because they are absent.

See [[Creator Command Reference]] for the wider Obsidian and terminal command knowledge base.

## Development levels

- `stub` — enough to identify the subject and distinguish it from an Earth default.
- `usable` — enough to place and use consistently in a scene or story.
- `developed` — deliberately interconnected or important enough to justify deeper treatment.

These are fitness states, not completion percentages. A background species can remain `usable` permanently.

## Source of truth

The Markdown note and its properties are the source of truth. A `.base` file is only a view. Do not store canon solely in Base configuration, filters or formulas.

Profile properties hold stable facts used for browsing and placement. Lore and Storyteller prose stay in the Markdown body.

## Placement model

The practical target remains:

> **Can this subject plausibly exist here, during these eras, and matter to the story being told?**

Use `era`, `locations`, `biomes`, `rarity` and type-specific profile properties only where they help answer that question.

## Further guidance

Follow [[Story Entity Workflow SOP]] for creation and filing, [[Storyteller View SOP]] for marked footer authoring, [[Entity Authoring SOP]] when deciding what to add, and [[Schema Change SOP]] before adding new shared properties or expanding a template. Use [[Creator Command Reference]] whenever you need to remember how to invoke the tooling.
