# Publishing Rules

Only notes in `Vault/Lore/` can publish. Publication is controlled by `status: published`; there is no second publish boolean. Draft, private, story, template and system notes are ignored.

`Vault/Stories/` is a hard private boundary for narrative projects. StoryLine projects, scenes, research notes and project-local system files stay there and are never Codex sources, regardless of their frontmatter.

A public note must live beneath `Vault/Lore/` and have:

```yaml
---
title: Example Title
description: "A short, reader-safe description for search and link previews."
status: published
type: article
---
```

The sync script derives the public route from the note path relative to `Vault/Lore/`. Do not add `slug` frontmatter, and treat file moves as URL changes. Treat `Vault/Lore/` as the source of truth; never manually maintain generated files in `Site/src/content/docs/`.

## Recommended frontmatter

Use fields that support sidebars, the graph, maps, timelines, feeds and social cards:

```yaml
icon: "fa-solid fa-book-skull"
sidebarIcon: "fa-solid fa-book"
titleIcon: "fa-solid fa-book-skull"
era: CITADEL
faction:
  - Example Faction
location:
  - Example City
participants:
  - Example Character
tags:
  - citadel
  - faction
related:
  - Example City
  - Example Battle
image: example-banner.svg
imagePage: /eras/citadel/images/example-banner/
alt: "Describe the image for screen readers."
credit: Artist Name / Rights Holder
```

## Links and graph data

Use Obsidian wikilinks in source notes:

```md
[[Example City]]
[[Example Character|a named witness]]
```

Published wikilinks become site links. Missing or unpublished wikilinks fall back to plain text and produce a sync warning. The same links feed graph and backlink data.

## Icons

Use Font Awesome classes or the local icon library:

```md
## [Icon:fa-solid fa-people-group] People
## [Icon:local faction] Faction Identity
```

```yaml
icon: "fa-solid fa-flag"
```

## Layout tags

Controlled layout tags must sit on their own lines:

```md
[cols:2-1 gap=lg]
[col]
Main article body.
[/col]
[col]
[card:accent compact]
Related body material.
[/card]
[/col]
[/cols]

[note:title="Archivist note"]
A public clarification.
[/note]

[warning:title="Content warning"]
Sensitive public warning text.
[/warning]

[lore:title="Recovered fragment"]
In-world quoted text.
[/lore]
```

These layout tags create in-article body content.

They do not configure the Codex article facts sidebar.

Use [[System/Frontmatter Schema#Article facts sidebar|Article facts sidebar]] for structured facts beside the article.

Use Markdown tables only for real tabular data.

## Assets

Store source images in `Vault/Assets/Images/` and maps in `Vault/Assets/Maps/`. Reference plain filenames in frontmatter where practical:

```yaml
image: example-banner.svg
headerImage: example-banner.svg
asset: example-banner.svg
```

Create a `type: image` note when artwork needs provenance, rights or usage notes.

## Event chronology

Every published event must use `calendarDate` as its single start date:

```yaml
calendarDate:
  calendar: okse
  year: 9250
  month: solmanuthur
  day: 16
  precision: day
  certainty: exact
```

An event may have a structured end date:

```yaml
calendarEndDate:
  calendar: okse
  year: 9251
  month: niewmonath
  day: 4
  precision: day
```

The calendar engine converts both dates to absolute world-days. That hidden value controls timeline position, sorting, range overlap, era membership and alternative-calendar labels.

Never use:

```yaml
timeline:
  id: example-history
  year: 1200
  date: "1200-01-01"
```

Legacy `timeline.id`, `timeline.year` and `timeline.date` fail validation. Generated timeline IDs are fixed: `super`, `citadel`, `smog`, `nearsight` and `entropy`.

## Timeline event metadata

```yaml
timeline:
  kind: event
  importance: standard
  categories:
    - military
    - political
  lanes:
    - okse-dominion
  global: auto
  era: auto
  order: 10
```

Kinds:

- `milestone`: singular high-visibility point.
- `event`: normal point event and the default.
- `period`: requires `calendarEndDate`. A ranged note defaults to this kind.
- `era`: reserved for structured era records.

Importance:

- `landmark`
- `major`
- `standard`
- `minor`
- `incidental`

`landmark` and `major` enter the super timeline automatically. `timeline.global` may be `auto`, `include` or `exclude`.

Categories are open-ended and may be multiple. Lanes identify optional factions, nations, regions, organisations or story threads. `timeline.order` only breaks ties on the same absolute day.

The top-level `era` field is editorially declared but chronologically verified. Point events belong to the era containing their absolute day. Periods belong to every era they overlap. A mismatch fails the build.

## Era records

The four canonical era notes live directly beneath `Vault/Lore/Eras/` and use:

```yaml
type: era
eraId: citadel
calendarDate:
  calendar: okse
  year: 9201
  month: niewmonath
  day: 1
  precision: year
calendarEndDate:
  calendar: okse
  year: 9400
  intercalaryDay: engimanutur-02
  precision: year
timeline:
  kind: era
  order: 1
  visualToken: e1
  allowGapAfter: true
  defaultViewport:
    paddingDays: 56
```

Era overlap is invalid. Gaps are invalid unless the preceding era explicitly sets `allowGapAfter: true`.

## Calendar and timeline shortcodes

Full calendar:

```md
[Calendar:okse year=4]
```

Timeline:

```md
[Timeline:super]
```

Configured timeline:

```yaml
timelineBlocks:
  ID-0001:
    timeline: super
    defaultCalendar: okse
    laneMode: unified
    showFilters: true
    showMinimap: true
```

```md
[Timeline:ID-0001]
```

During sync, shortcode pages are emitted as generated MDX. The local Obsidian plugin renders the same shortcode from the same compiler and renderer without needing the website server.

## Obsidian-only helpers

Obsidian comments are removed during sync:

```md
%% Private drafting note. %%
```

Do not publish raw `dataviewjs`. Native fenced `chronos` blocks are supported for note-local editorial timelines and pass through to Starlight. Use canonical event notes and `[Timeline:...]` shortcodes when entries must participate in registered calendars, era validation and generated datasets.

See `Site/TIMELINES.md`, `Site/CALENDAR.md` and `Tools/obsidian-viscerium-timelines/README.md` for implementation and troubleshooting details.
