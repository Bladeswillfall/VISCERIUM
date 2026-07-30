# Contributing

Thank you for helping to improve VISCERIUM.

Use the [Architecture Guide](Architecture/README.md) before you change an unfamiliar system.

Use the [Documentation Writing Standard](Vault/System/SOPs/Documentation%20Writing%20Standard.md) for operational documentation.

## Before you change the repository

1. Identify the authoritative source for the feature.
2. Read the nearest SOP or system guide.
3. Check the existing tests for that feature.
4. Do not start from a generated file.

## Source-of-truth rules

1. Edit public source Lore under `Vault/Lore/`.
2. Keep draft creator material under `Vault/Drafts/` or the correct private workspace.
3. Keep private StoryLine writing under `Vault/Stories/`.
4. Keep source assets under `Vault/Assets/`.
5. Do not edit generated files under `Site/src/content/docs/`.
6. Do not author canonical data directly in generated map, timeline, relationship, or search output.
7. Use `status: published` only for public canon.
8. Do not add `slug` frontmatter to published source notes.

Public routes come from paths relative to `Vault/Lore/`.

A file move can therefore change a public URL.

## Creator workflow

Use `Vault/Home.md` as the normal creator entry point.

Use `Vault/System/SOPs/Creator Command Reference.md` for exact Obsidian and terminal commands.

Use `Vault/Drafts/Inbox/World Anvil Migration Review.md` for the guided World Anvil transfer.

Use `Vault/System/SOPs/Era Edition Workflow SOP.md` for cross-era continuity.

Use `Vault/System/SOPs/Schema Change SOP.md` before you add shared creator structure.

## Authoring rules

- Use Obsidian wikilinks such as `[[Example City]]` for normal internal references.
- Use `relationships:` only when the relationship itself is important.
- Use Codex layout tags instead of blank Markdown tables for visual layout.
- Use Obsidian embeds for vault assets that the public sync must copy.
- Store repository raster artwork as `.webp`.
- Use `.svg` only for genuine vector artwork.
- Do not publish raw `dataviewjs`.
- Use native Chronos blocks only for note-local presentation timelines.
- Keep canonical event chronology in canonical event metadata.

## Era and continuity rules

Use only these controlled era values:

- `CITADEL`;
- `SMOG`;
- `NEARSIGHT`;
- `ENTROPY`;
- `Universal`.

`Universal` is a scope, not a fifth chronological era.

Use VISCERIUM Creator Tools for controlled era values and era-edition creation.

Historical continuity editions use one scalar `era` and one stable `entity_id`.

The build generates all-era entity hubs from shared `entity_id` values.

## Timeline authoring

Use `calendarDate` as the canonical event start date.

Use `calendarEndDate` for a canonical range.

Do not add legacy `timeline.id`, `timeline.year`, or `timeline.date` values.

Use importance for hierarchy.

Use categories for subject matter.

Use lanes for factions, regions, organisations, or story threads.

See `Site/TIMELINES.md` for the full chronology model.

## Public search

Telescope is the public search provider.

Pagefind is disabled.

VISCERIUM filters Telescope by active era plus Universal material.

Do not add a second search provider without an architecture review.

## Validation before a pull request

Run the normal confidence check from the repository root:

```bash
cd Site
npm ci
npm test
npm run benchmark:timelines
```

Use focused checks while you develop:

```bash
cd Site
npm run doctor:vault
npm run sync
npm run validate:vault
npm run validate:timelines
npm run validate
npm run generate:maps
npm run generate:timelines
npm run test:unit
```

Build the VISCERIUM Timelines plugin after timeline plugin or shared timeline changes:

```bash
cd Tools/obsidian-viscerium-timelines
npm ci
npm run build
```

## Pull requests

1. Describe the source change.
2. List the validation that you ran.
3. Add screenshots for visible interface changes.
4. State performance effects for substantial timeline changes.
5. Identify generated files that changed.
6. Identify publication or privacy risks when they exist.
7. Merge only after required checks pass.
