# VISCERIUM Timelines for Obsidian

This maintained local plugin renders canonical VISCERIUM timeline shortcodes through Chronos. It imports the shared calendar runtime, compiler, Chronos adapter and renderer from `Site/src/lib/`, compiles canon notes directly from the open vault, and does not require the Astro development server.

It is designed to coexist with the public **Chronos Timeline** community plugin and **StoryLine**:

- The public Chronos plugin owns fenced `chronos` blocks, templates, note links and quick Markdown timelines.
- StoryLine owns story projects, scene prose, reading order, chronological order and story-planning metadata beneath `Stories/`.
- VISCERIUM Timelines owns `[Timeline:...]` shortcodes, registered fictional calendars, canonical era membership, generated super/era datasets, and the read-only VISCERIUM calendar view of StoryLine scenes.

The local plugin deliberately does not register a second `chronos` code-block processor and does not write duplicate chronology fields into StoryLine scene notes.

## Build

From this directory:

```bash
npm install
npm run build
```

The build writes:

```text
dist/
  main.js
  manifest.json
  styles.css
```

## Install locally

Create the plugin directory inside the vault:

```text
Vault/.obsidian/plugins/viscerium-timelines/
```

Copy the three files from `dist/` into that directory, reload Obsidian, then enable **VISCERIUM Timelines** under Community plugins.

Also install and enable **Chronos Timeline** from the Obsidian community directory when you want native fenced blocks. Install **StoryLine** when you want the story-planning workspace beneath `Stories/`. The plugins have separate responsibilities and can be enabled together.

For development, run `npm run dev`, copy the resulting files, and use Obsidian's **Reload app without saving** command. The plugin provides **VISCERIUM Timelines: Refresh compiled timelines** in the command palette.

## Canonical shortcodes

Direct timeline:

```md
[Timeline:super]
```

Inline options:

```md
[Timeline:super calendar=okse lane=unified filters=true minimap=true]
```

Configured block:

```yaml
timelineBlocks:
  ID-0001:
    timeline: super
    defaultCalendar: okse
    laneMode: unified
    showFilters: true
    showMinimap: true
    showLegend: true
```

```md
[Timeline:ID-0001]
```

Supported timeline IDs are `super`, `citadel`, `smog`, `nearsight` and `entropy`.

## StoryLine project timelines

Open a StoryLine project note or scene beneath `Stories/`, then run:

**VISCERIUM Timelines: Open StoryLine project timeline**

The plugin finds that project's `Scenes/` folder and generates a read-only VISCERIUM calendar view from the scene Markdown. It does not insert a shortcode or generated data into the manuscript.

StoryLine's `storyDate` remains the single story-date field. Accepted VISCERIUM forms include:

```yaml
storyDate: "16 Sólmanuthur, 9250"
```

```yaml
storyDate: "9250-solmanuthur-16"
```

An explicit registered calendar may be prefixed when needed:

```yaml
storyDate: "okse:16 Sólmanuthur, 9250"
```

StoryLine continues to own `sequence` and `chronologicalOrder`. The VISCERIUM adapter converts `storyDate` to the shared absolute-day calendar model only in memory. Missing or invalid story dates are reported in the timeline view and do not alter the source scene.

## Native Chronos blocks

Use the public Chronos plugin for quick note-local timelines:

````md
```chronos
> NOTODAY
> ORDERBY start

- [9201] Example event | Hover detail
@ [9201~9400] #gray CITADEL
* [9210] Example point
= [9220] Example milestone
```
````

The site sync process converts the same block to `ChronosEmbed.astro`, so the core Chronos UI and syntax pass into Starlight. Native blocks are not imported into canonical generated timelines; use an event note with `calendarDate` when the entry must use registered calendars and era validation.

## Source-of-truth behaviour

- Only Markdown notes beneath `Lore/` with `status: published` are compiled into generated public datasets.
- `Stories/` is never scanned as a canonical/public source.
- Canonical lore events use `calendarDate` as their sole start date.
- StoryLine scenes use `storyDate` as their sole story date; the adapter converts it in memory rather than duplicating `calendarDate`.
- `calendarEndDate` is optional for canonical lore events and creates a period by default.
- Era membership is calculated from canonical era records.
- Legacy `timeline.id`, `timeline.year` and `timeline.date` fail canonical compilation.
- The normalized canonical dataset is adapted to Chronos with `renderParsed`; authors do not maintain generated Chronos syntax.
- Selecting **Open full article** opens canonical source notes in Obsidian; selecting a StoryLine timeline event opens its scene note.

## Files to commit

Commit the plugin source, manifest, build configuration and documentation. Do not commit:

- `node_modules/`
- `dist/`
- machine-specific `.obsidian/workspace*.json`
- Obsidian cache or hot-reload state

The plugin bundle is a local build artifact, not a manually maintained source.
