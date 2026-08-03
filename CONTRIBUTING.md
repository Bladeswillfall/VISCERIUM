# Contributing

Thank you for helping to improve VISCERIUM.

Use the [Architecture Guide](Architecture/README.md) before you change an unfamiliar system.

Use the [Documentation Writing Standard](Vault/System/SOPs/Documentation%20Writing%20Standard.md) for operational documentation.

Read [LICENSE.md](LICENSE.md), [LICENSE-CODE.md](LICENSE-CODE.md), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) before adding code, dependencies, plugins, fonts, or external assets.

## Before you change the repository

1. Identify the authoritative source for the feature.
2. Read the nearest SOP or system guide.
3. Check the existing tests for that feature.
4. Do not start from a generated file.

## Licensing and contributions

Original first-party software in MIT-covered paths is distributed under `LICENSE-CODE.md`.

Unless separate written terms apply, submitting original code for acceptance into an MIT-covered path means that the accepted code may be distributed under that MIT licence.

The MIT licence does not grant rights to VISCERIUM Lore, canon, fiction, artwork, maps, branding, logos, or other protected creative material.

Opening an issue or pull request does not make creative material part of VISCERIUM canon and does not transfer creative rights. Creative contributions require separate written terms before acceptance.

## Third-party dependency rules

When you add, remove, fork, or upgrade a third-party dependency:

1. Confirm its current upstream licence.
2. Confirm that the intended use is compatible with the repository licence map.
3. Update the relevant package manifest and lockfile.
4. Update `THIRD_PARTY_NOTICES.md` when the direct dependency or attribution changes.
5. Preserve required copyright, licence, source-availability, and modification notices.
6. Do not describe an upstream project as affiliated with or endorsed by VISCERIUM.

Do not copy third-party source or binary files into the repository merely because the project uses them.

## Obsidian plugin rules

Use `Vault/.obsidian/community-plugins.json` as the enabled plugin-ID list.

Use `Vault/System/Obsidian Plugin Profile.json` as the tested-version and installation-source record.

Ordinary third-party plugin payloads are not repository source. Do not commit their:

- `main.js` files;
- `styles.css` files;
- `manifest.json` files;
- source maps;
- workers;
- binaries;
- caches; or
- downloaded support assets.

Selected third-party `data.json` files may be tracked only when they define an intentional shared VISCERIUM workflow.

Before you add or change a tracked plugin setting:

1. Close Obsidian.
2. Review the complete `data.json` diff.
3. Remove secrets, personal paths, active-project state, caches, ignored-lint hashes, and device-local UI state.
4. Update `.gitignore` only when the setting must be shared.
5. Update `Vault/System/Obsidian Plugin Profile.json` when the tested version or settings path changes.
6. Test the affected creator workflow.

First-party `viscerium-*` plugins are repository software and remain tracked.

The modified MySnippets compatibility runtime is an explicit MPL-2.0 exception. Do not treat that exception as permission to vendor other community plugins.

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
7. Identify third-party licences or notices that changed.
8. Merge only after required checks pass.
