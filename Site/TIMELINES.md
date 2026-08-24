# VISCERIUM timeline system

The Codex compiles structured event and era notes into the `super`, `citadel`, `smog`, `nearsight`, and `entropy` timelines. The website and maintained Obsidian plugin both render those canonical records directly with `vis-timeline`.

## Architecture

```text
Vault/Lore event and era notes
  calendarDate / calendarEndDate
            │
            ▼
calendar/runtime.mjs
  registered calendars ↔ absolute world-day
            │
            ▼
timeline/compiler.mjs
  validation, era membership, sorting, datasets
            │
            ▼
timeline/vis-adapter.mjs
  canonical records → vis-timeline items and groups
            │
            ▼
timeline/renderer.mjs
  calendar axis, controls, filters, details, list, and minimap
```

One absolute world-day maps to one synthetic UTC day relative to the dataset start. The synthetic date is only a browser coordinate. All visible labels come from the selected fictional calendar.

## Canonical chronology

`calendarDate` is the sole event start date. Do not add `timeline.year`, `timeline.date`, or `timeline.id`. Validation rejects those legacy fields. Canonical routes are derived from note paths relative to `Vault/Lore/`, so event and era notes do not need `slug` frontmatter.

Native fenced `chronos` blocks are not a public-site timeline interface. The sync step leaves them as ordinary Markdown code fences. Existing authors may still use the separate community plugin inside Obsidian, but public interactive timelines must use canonical records and `[Timeline:...]` shortcodes.

## Event schema

```yaml
---
title: Example Event
description: "A concise public description."
status: published
type: event
era: CITADEL

calendarDate:
  calendar: okse
  year: 9250
  month: niewmonath
  day: 1
  precision: day
  certainty: exact

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
---
```

Add `calendarEndDate` for a range. A ranged record defaults to `period`. A point defaults to `event`. `timeline.order` only breaks ties between records on the same day.

`precision` controls labels, not position:

- `day`
- `month`
- `year`

`certainty` controls presentation, not position:

- `exact`
- `approximate`
- `disputed`
- `legendary`

Importance may be `landmark`, `major`, `standard`, `minor`, or `incidental`. Landmark and major records enter the super timeline automatically. Use `timeline.global: include` or `exclude` to override that choice.

Categories are open-ended. Known visual categories include technology, military, political, cultural, religious, economic, scientific, disaster, resonance, myrkild, naranor, exploration, social, and environmental. Unknown values receive the neutral treatment.

Lanes identify factions, nations, regions, organisations, or story threads. Readers can switch among unified, declared-lane, and category grouping. Low-volume groups are folded into **Other / unassigned** when the group cap is reached.

## Era schema

```yaml
---
title: CITADEL
description: "A time of steel, bone and thrones."
status: published
type: era
eraId: citadel

calendarDate:
  calendar: okse
  year: 9201
  month: niewmonath
  day: 1
  precision: year
  certainty: exact

calendarEndDate:
  calendar: okse
  year: 9400
  intercalaryDay: engimanutur-02
  precision: year
  certainty: exact

timeline:
  kind: era
  order: 1
  visualToken: e1
  allowGapAfter: true
  defaultViewport:
    paddingDays: 56
---
```

Era records live in `Vault/Lore/Eras/`. Point events belong to the era containing their day. Periods belong to every era they overlap. A declared era that disagrees with chronology fails validation. Set `allowGapAfter: true` only for a deliberate historical gap.

## Shortcodes

Simple form:

```md
[Timeline:super]
```

Inline options:

```md
[Timeline:super calendar=okse lane=unified filters=true minimap=true]
```

Configured form:

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

The build generates the timeline datasets under `Site/src/data/timelines/`, then the sync transform replaces supported shortcodes with `TimelineEmbed.astro`. The Obsidian plugin recognises the same shortcodes and compiles local vault records without the Astro server.

## Adding an event

1. Create a note beneath `Vault/Lore/` from `Vault/Templates/Lore/Event Template.md`.
2. Set `status: published`, `type: event`, and a concise description.
3. Add exactly one `calendarDate` and an optional `calendarEndDate`.
4. Choose importance, categories, and optional lanes.
5. Declare the expected top-level era. The compiler verifies it from chronology.
6. Run `npm run sync`, `npm run validate`, and `npm run generate:timelines` from `Site/`.

## Obsidian

Build `Tools/obsidian-viscerium-timelines` to render canonical shortcodes and the read-only StoryLine calendar view. It shares the compiler, calendar engine, adapter, renderer, and styles with the site. It deliberately does not own the `chronos` code-block language.

## Performance and fallback

- Each route loads only its selected timeline dataset and dynamically imports the renderer.
- Article bodies are not copied into timeline JSON.
- Distant views omit lower-importance records before updating the item set.
- Calendar changes relabel fixed absolute positions.
- Group count is capped.
- Every timeline retains a complete static chronological list until enhancement succeeds.

Run `npm run benchmark:timelines` for deterministic compiler benchmarks at 1,000 and 5,000 records.

## Troubleshooting

- **Legacy field error:** move `timeline.id`, `timeline.year`, or `timeline.date` into `calendarDate`.
- **Unknown month or intercalary day:** use the slug from the registered calendar definition.
- **Era mismatch:** correct the date or declared era. Calculated membership is authoritative.
- **Period missing end:** add `calendarEndDate` or change `timeline.kind`.
- **Shortcode does not render in Obsidian:** build and enable the VISCERIUM Timelines plugin.
- **Blank interactive view:** use the visible static list, inspect the browser console, and install from the current lockfile.
- **Article link does not open in Obsidian:** confirm the source note still exists beneath `Lore/`.
