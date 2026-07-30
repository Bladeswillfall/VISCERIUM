# VISCERIUM Architecture Guide

This guide explains how the VISCERIUM creator system connects.

It uses the [[../Vault/System/SOPs/Documentation Writing Standard|VISCERIUM ASD-STE100-based documentation style]].

Use `viscerium-architecture.json` for the machine-readable architecture handoff.

Use `viscerium-architecture.html` for the visual map.

## Read this first

VISCERIUM is a Markdown-first system.

Obsidian is the main creator workspace.

Markdown and YAML notes are the source data.

Bases, dashboards, the public website, maps, timelines, search, and graphs are views or generated projections.

## Main source-of-truth rules

1. Keep creator and draft facts in Markdown notes under `Vault/`.
2. Keep public canon under `Vault/Lore/`.
3. Keep private story projects under `Vault/Stories/`.
4. Keep source artwork under `Vault/Assets/`.
5. Do not hand-edit generated files under `Site/src/content/docs/`.
6. Do not hand-edit generated map, timeline, relationship, or search data.
7. Change the source note or generator when generated output is wrong.

## System map

```text
CREATOR
  |
  v
Obsidian
  |
  +--> Home dashboard
  +--> Templater creator workflows
  +--> VISCERIUM Creator Tools
  +--> Bases / Dataview views
  +--> StoryLine private writing
  |
  v
Vault Markdown + YAML
  |
  +--> Drafts ----------------------------+
  |                                       |
  +--> Lore -- published source ----------+--> Node build pipeline
  |                                              |
  +--> Assets ----------------------------------+
                                                 |
                                                 +--> validate
                                                 +--> resolve era continuity
                                                 +--> rewrite links and embeds
                                                 +--> generate maps
                                                 +--> generate timelines
                                                 +--> generate relationships
                                                 +--> generate tag/entity pages
                                                 |
                                                 v
                                      Site/src/content/docs + data
                                                 |
                                                 v
                                          Astro + Starlight
                                                 |
                                   +-------------+-------------+
                                   |                           |
                              Telescope                    Page UI
                              search                       maps/graphs/
                                                           timelines
                                   |                           |
                                   +-------------+-------------+
                                                 |
                                                 v
                                            Site/dist
                                                 |
                                                 v
                                         Cloudflare Pages
```

## Programs and plugins

### Obsidian

Purpose: Edit the creator vault.

Reads and writes: Markdown, YAML properties, assets, and local plugin configuration.

Important rule: Obsidian is the editor. It is not a separate lore database.

### Obsidian Bases

Purpose: Show card and table views of note properties.

Examples: Story Entity databases and World Anvil migration queues.

Important rule: A Base is a view. The source data stays in the Markdown notes.

### Templater

Purpose: Run guided note creation and property-edit workflows.

Important workflows:

- `New Story Entity`;
- `New Lore Entity`;
- `New Myrkild Unit`;
- `Add Location Fields`;
- `Add Storyteller Fields`.

Important rule: Do not run templates in `Templates/_Internals/` directly.

### Dataview

Purpose: Build live creator dashboard lists from vault notes.

Example: Home **Next Actions**, **Writing Desk**, and recent creator activity.

Important rule: Dataview reads the notes. It does not own the facts.

### VISCERIUM Creator Tools

Purpose: Control era and continuity metadata on existing notes.

Commands:

- **Set controlled era / Universal scope**;
- **Set continuity entity ID**;
- **Create era edition from current note**.

Important rule: Use these commands instead of typing arbitrary era values.

### StoryLine

Purpose: Organise private story projects, scenes, sequence, point of view, and `storyDate`.

Source: `Vault/Stories/` and StoryLine project data.

Important rule: StoryLine story files are private writing data. They are not public canon input.

### VISCERIUM Timelines

Purpose: Show canonical VISCERIUM timelines and read-only StoryLine timelines inside Obsidian.

Implementation source: `Tools/obsidian-viscerium-timelines/`.

Runtime bundle: `Vault/.obsidian/plugins/viscerium-timelines/`.

Important rule: Edit the `Tools/` source. Do not patch the generated runtime bundle as the primary implementation.

### Chronos

Purpose: Render note-local Chronos timeline blocks.

Important rule: A Chronos block is presentation data. It is not canonical chronology unless canonical event metadata also exists.

### Breadcrumbs

Purpose: Help creator-side hierarchy and navigation in Obsidian.

Important rule: The public relationship explorer does not use the Breadcrumbs plugin database.

### Image Converter

Purpose: Convert raster artwork to the repository WebP format.

Repository rule: Store raster artwork as WebP. Use SVG only for genuine vector media.

### Obsidian Git

Purpose: Provide Git actions from inside Obsidian.

Important rule: Git remains the repository history and synchronization system.

### Git

Purpose: Track versions and synchronize repository changes.

Remote: GitHub repository `Bladeswillfall/VISCERIUM`.

Important rule: Check `git status` before a pull when local edits exist.

### GitHub

Purpose: Host the repository, pull requests, and GitHub Actions checks.

Important rule: Pull requests must pass the normal repository checks before merge.

### Node.js and npm

Purpose: Run validation, generators, tests, and local site commands.

Supported CI runtime: Node 24.

Main working directory: `Site/`.

### Astro

Purpose: Build the static public website.

Input: Generated public content and data.

Output: `Site/dist/`.

### Starlight

Purpose: Provide the documentation-site shell, content schema, navigation, and page framework on Astro.

### Telescope

Purpose: Provide fuzzy public Codex search with Fuse.js.

VISCERIUM adds era-aware scoping around Telescope.

Inside an era, search shows that era plus Universal material.

In All Eras mode, continuity families collapse to generated entity hubs when possible.

Pagefind is disabled.

### Cloudflare Pages

Purpose: Host the static production output.

Input: `Site/dist/`.

No private application server is required for the current Codex.

## Workflow — World Anvil transfer

Use [[../Vault/Drafts/Inbox/World Anvil Migration Review|World Anvil Migration Review]] for the full guided procedure.

1. Open `World Anvil Import.base` in Obsidian.
2. Start in **Needs attention**.
3. Resolve identity conflicts first.
4. Resolve type decisions.
5. Resolve multi-era continuity decisions.
6. Resolve missing era values.
7. Review meaningful semantic relationships.
8. Repair only certain legacy links.
9. Resolve lawful artwork after structure is stable.
10. Review the destination and publication status last.

The migration does not automatically decide continuity, chronology, or canon.

## Workflow — create a Story Entity

1. Open `Vault/Home.md`.
2. Select **Create Story Entity**.
3. Select Fauna, Flora, Fungi, or Item.
4. Complete the guided Templater prompts.
5. Edit the draft under `Vault/Drafts/Databases/<Type>/`.
6. Browse it through the relevant Base.
7. Run Vault Doctor after broad structural edits.
8. Move it to Lore only when publication is deliberate.

## Workflow — create an era edition

1. Open the established historical note.
2. Set a stable `entity_id` with VISCERIUM Creator Tools.
3. Set one scalar historical era.
4. Run **Create era edition from current note**.
5. Select the target era.
6. Edit the new draft independently.
7. Repeat only for eras that need a separate reader-facing state.
8. Publish each edition under the matching `Lore/Eras/<ERA>/` path.

The build creates the all-era `/entities/<entity_id>/` hub.

Do not hand-author a parent article only to join editions.

## Workflow — publish Lore to the Codex

1. Author or revise the source note in `Vault/Lore/`.
2. Set `status: published` only for public canon.
3. Run `cd Site`.
4. Run `npm run doctor:vault`.
5. Run `npm run build`.
6. Fix validation or build errors at the source.
7. Let the pipeline regenerate public content and data.
8. Let Astro build `Site/dist/`.
9. Let Cloudflare Pages deploy the static output.

## Workflow — public content build

`Site/scripts/build-content.mjs` is the main orchestration point.

The build performs these operations:

1. Scan canonical Lore.
2. Validate published notes and assets.
3. Compile continuity families and contextual links.
4. Synchronise published notes into generated site content.
5. Transform supported Obsidian syntax for the website.
6. Generate continuity hubs and era-scoped tag pages.
7. Generate timeline datasets.
8. Generate map data.
9. Generate relationship data.
10. Generate Telescope search-scope metadata.
11. Validate generated output.
12. Build the Astro/Starlight site.

## Workflow — canonical timeline

1. Author `calendarDate` and optional `calendarEndDate` in canonical Lore.
2. Convert the source date to an absolute world-day with the shared calendar runtime.
3. Validate chronology and era membership with the timeline compiler.
4. Generate the super timeline and four era datasets.
5. Load a generated dataset in the public timeline route.
6. Render the interactive timeline through the shared timeline UI.

Do not create duplicate chronology fields.

## Workflow — StoryLine timeline

1. Keep private scenes under `Vault/Stories/`.
2. Let StoryLine own project structure and `storyDate`.
3. Open **VISCERIUM Timelines: Open StoryLine project timeline**.
4. Let VISCERIUM Timelines read the active project in memory.
5. Convert `storyDate` through the shared calendar model.
6. Display the read-only timeline.

This workflow does not write canonical `calendarDate` values into StoryLine scenes.

## Workflow — map authoring

1. Keep the source map under `Vault/Assets/Maps/`.
2. Author map definitions and marker properties in notes.
3. Run the normal build or `npm run generate:maps`.
4. Let the generator create `Site/src/data/maps.json`.
5. Let the public Atlas read that generated data.

Do not hand-edit `maps.json`.

## Workflow — relationships

1. Author meaningful `relationships:` properties in notes.
2. Keep incidental references in prose or `related:`.
3. Run the normal build.
4. Let the relationship generator resolve targets in era context.
5. Let the public relationship explorer read the generated graph.

Do not use Breadcrumbs plugin data as the public relationship source.

## Workflow — public search

1. Let Starlight expose published pages to Telescope.
2. Let Telescope load its page catalogue.
3. Let the VISCERIUM Telescope adapter read the active era context.
4. Filter the in-memory search catalogue to the active era plus Universal.
5. Collapse continuity editions to their entity hub in All Eras mode.
6. Rebuild Telescope's Fuse.js index.
7. Show the active search scope in the Telescope dialog.

Pagefind remains disabled.

## Workflow — Git and GitHub

1. Check `git status` before you synchronize local work.
2. Pull remote changes when the working tree is safe.
3. Make a focused change.
4. Run the relevant local checks.
5. Commit the source change.
6. Push the branch.
7. Open a pull request.
8. Let GitHub Actions run repository checks.
9. Fix failures before merge.
10. Merge only after the required checks pass.

## Workflow — GitHub Actions checks

The normal checks perform these operations:

1. Install locked Site dependencies.
2. Run Vault Doctor.
3. Run unit and regression tests.
4. Run timeline benchmarks.
5. Run the production site build.
6. Build the VISCERIUM Timelines Obsidian plugin.
7. Install the browser runtime.
8. Run Playwright browser checks against the preview site.
9. Confirm that the generated plugin bundle matches the committed runtime.

## Generated files

Treat these paths as generated output:

- `Site/src/content/docs/`;
- `Site/src/data/timelines/*.json`;
- `Site/src/data/maps.json`;
- generated relationship data;
- generated search-scope metadata;
- `Site/dist/`;
- `Tools/obsidian-viscerium-timelines/dist/`;
- the tracked VISCERIUM Timelines runtime bundle under `Vault/.obsidian/plugins/`.

Change the authoritative source instead of editing generated output.

## Where to start when a system changes

| Change | Start here |
| --- | --- |
| Creator property or schema | `Vault/System/SOPs/Schema Change SOP.md` |
| Creator workflow or command | `Vault/System/SOPs/Creator Command Reference.md` |
| Era or continuity behaviour | `Vault/System/SOPs/Era Edition Workflow SOP.md` and `Site/src/lib/era-context.mjs` |
| World Anvil migration UX | `Vault/Drafts/Inbox/World Anvil Migration Review.md` and `Site/scripts/apply-worldanvil-base-triage.mjs` |
| Public content transformation | `Site/scripts/sync-public-notes.mjs` |
| Public build orchestration | `Site/scripts/build-content.mjs` |
| Search | `Site/src/scripts/telescope-scope.js` and Telescope integration |
| Canonical chronology | `Site/src/lib/timeline/` and `Site/src/lib/calendar/` |
| StoryLine integration | `Tools/obsidian-viscerium-timelines/` and StoryLine adapter |
| Atlas | `Site/scripts/generate-map-data.mjs` and `WorldMap.astro` |
| Relationships | `Site/scripts/generate-relationship-data.mjs` |
| Website layout | `Site/src/components/` and `Site/src/styles/` |
| Deployment | `Site/site.config.mjs`, `Site/astro.config.mjs`, and Cloudflare Pages settings |

## Check the architecture after a system change

1. Update this guide when a user workflow changes.
2. Update `viscerium-architecture.json` when a machine-readable relationship changes.
3. Update `viscerium-architecture.html` when the visual map changes.
4. Update the nearest SOP when creator behaviour changes.
5. Update the command reference when a creator command changes.
6. Run the relevant repository tests before merge.
