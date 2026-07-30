# Native Chronos rendering

Canonical VISCERIUM timelines now pass through Chronos's own Markdown parser and native presentation system.

## Processing path

```text
canonical event metadata
  → absolute world-day compiler
  → synthetic Chronos date serialization
  → Chronos Markdown syntax
  → parseChronos()
  → canonical metadata enrichment
  → ChronosTimeline.renderParsed()
```

The enrichment step adds stable article IDs, links, certainty and importance classes, and original event metadata. It does not replace Chronos item content, group creation, range handling, point handling, background periods, colour processing or refit controls.

## Host features retained

VISCERIUM continues to provide:

- registered fictional-calendar labels;
- calendar switching;
- search and metadata filters;
- lane and category group modes;
- era navigation and era backgrounds;
- URL state;
- event details and article links;
- accessible list fallback;
- synchronized minimap;
- importance-based distant-zoom suppression.

Chronos continues to provide the primary timeline UI, including native boxes, points, ranges, groups, background periods, parser colours, stacking and the refit control.
