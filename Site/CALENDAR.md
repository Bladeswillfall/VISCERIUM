# Calendar engine

The Codex calendar system is built around hidden absolute world-time. Articles and canonical generated timelines share this engine; there is no separate timeline chronology.

## Canonical dates

An event stores one structured source date:

```yaml
calendarDate:
  calendar: okse
  year: 20001
  month: niewmonath
  day: 1
  precision: day
  certainty: exact
```

Optional range end:

```yaml
calendarEndDate:
  calendar: okse
  year: 20003
  month: solmanuthur
  day: 12
  precision: day
```

The start and end may use different registered calendars. Each is converted independently to an absolute world-day. That absolute day controls sorting, timeline position, era membership, overlap validation and conversion into display calendars.

Do not duplicate chronology in `timeline.year`, `timeline.date` or `timeline.id`. Those legacy fields fail timeline validation.

`precision` (`day`, `month`, `year`) affects only public labels. `certainty` (`exact`, `approximate`, `disputed`, `legendary`) affects only visual treatment. Neither changes the absolute position.

Native fenced `chronos` blocks are separate, note-local presentation timelines. Their Chronos date syntax is self-contained and is not converted by this calendar engine.

## Runtime files

- `src/data/calendars/okse.mjs` — canonical Okse definition available to Node, Astro and the Obsidian bundle.
- `src/data/calendars/okse.ts` — typed re-export.
- `src/lib/calendar/runtime.mjs` — registry, conversion, validation and formatting.
- `src/lib/calendar/types.ts` — TypeScript contracts.
- `src/lib/calendar/convert.ts` and `registry.ts` — typed wrappers for existing Astro components.

This layout prevents the generator and client renderer from implementing their own calendar arithmetic.

## Current calendar

Implemented calendar:

- `okse` — 13 months × 28 days, plus Engimanutur 01 every year and Engimanutur 02 every fourth year.

Okse weekday order:

1. Modirdag
2. Elddag
3. Vatnsdag
4. Erddag
5. Fadirdag
6. Laugdag
7. Degeldag

Epoch:

```ts
absoluteDay: 0
Okse year: 1
month: niewmonath
day: 1
weekday: Modirdag
```

Leap rule:

```ts
year % 4 === 0
```

## Intercalary dates

Use `intercalaryDay` instead of `month` and `day`:

```yaml
calendarDate:
  calendar: okse
  year: 20004
  intercalaryDay: engimanutur-02
```

`engimanutur-02` exists only in leap years. Invalid use fails validation with the source note and field.

## Calendar blocks

Full calendar grids remain available through the existing shortcode:

```yaml
calendarBlocks:
  ID-0001:
    calendar: okse
    year: 4
```

```md
[Calendar:ID-0001]
```

Quick form:

```md
[Calendar:okse year=4]
```

## Timeline labels

For canonical generated timelines, the adapter gives Chronos synthetic UTC dates only as coordinates. One absolute world-day maps to one synthetic UTC day from a fixed epoch. Gregorian axis labels are hidden. The visible axis, event cards, hover text, details, era boundaries and list view are all formatted at render time through `formatAbsoluteDay()`.

Changing the selected calendar therefore reformats labels without moving Chronos items.

## Adding a future calendar

1. Create `src/data/calendars/<id>.mjs` with a stable ID, epoch, weekdays, months, intercalary days and leap rule.
2. Register it in `src/lib/calendar/runtime.mjs`.
3. Add a typed re-export if TypeScript components import it directly.
4. Add tests for source-to-absolute conversion, absolute-to-source conversion, leap/intercalary rules and negative days where supported.
5. Use the new ID as an event source calendar or display calendar.

No timeline compiler or Chronos adapter changes should be necessary. See `TIMELINES.md` for authoring, validation and embedding instructions.
