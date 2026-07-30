# Codex stylesheet architecture

The number of files in this directory looks excessive, but the current import boundaries are not merely organisational. In this project, **changing where a stylesheet enters the Astro/Vite module graph changes generated colour output and the final cascade**.

## Tested consolidation result

The following approaches were tested on a branch:

- one global CSS entrypoint using `@import`
- one full timeline CSS entrypoint
- a separate hydrated-timeline entrypoint
- one homepage CSS entrypoint
- a TypeScript manifest that imported homepage CSS modules
- externalising the homepage's inline global shell overrides
- physically merging the small homepage reveal stylesheet into another file

All approaches passed unit tests and the production build. Browser regression tests still detected rendering changes, including:

- `starlight-site-graph` failing to parse generated OKLCH custom-property values
- the timeline hovercard resolving to a different computed colour

The implementation changes were therefore reverted. The existing boundaries are preserved intentionally until the build pipeline produces deterministic output regardless of source-file grouping.

## Current ownership

### Global Starlight/Codex stack

Registered explicitly and in order in `astro.config.mjs`:

- `ion-layers.css` — cascade-layer declaration
- `color-tokens.css` — shared palette, status, era, calendar, timeline, homepage, and Degel variables
- `ion-theme.css` — Starlight theme adaptation and broad site presentation
- `ion-expressive-code.css` — code-block integration
- `typography.css` — typefaces, prose rhythm, and headings
- `content-media.css` — article media treatment
- `codex-ui.css` — reusable Codex surfaces, cards, buttons, and authoring utilities
- `navigation.css` — icons, left navigation, and sidebar overlay behaviour
- `header-controls.css` — header actions and controls
- `graph.css`, `timelines.css`, `maps.css`, `calendar.css`, `category-index.css`, `support.css` — feature-owned presentation
- `layout.css` — page geometry and late structural overrides
- `a11y.css` — focus, reduced-motion, forced-colour, and target-size rules
- `era-styles.css` — era-scoped variables and treatments

### Homepage

`index.astro` directly imports, in order:

1. `homepage-base.css`
2. `homepage-content.css`
3. `homepage-responsive.css`
4. `homepage-reveal.css`

Its small Starlight shell override remains in the page's global style block because externalising it changed unrelated computed colours.

### Timeline

`TimelineApp.astro` owns the server-rendered timeline styles. `TimelineIsland.tsx` owns the hydrated Chronicle and toolbar styles. These must remain separate until the colour-processing issue is fixed.

## Rules for human editing

1. Treat import order and import location as part of the application behaviour.
2. Do not introduce CSS `@import` aggregators for the global, homepage, or timeline stacks.
3. Do not move page-global styles out of an Astro component without running browser regression tests.
4. Put shared colours and semantic aliases in `color-tokens.css`; do not redefine them in feature files.
5. Put global geometry and deliberate late overrides in `layout.css`.
6. Put navigation rules in `navigation.css` and header-control rules in `header-controls.css`.
7. Keep feature selectors in their named feature file.
8. Before adding an override, identify which file should own the selector and remove or amend the competing rule where practical.
9. Run unit tests, the production build, and the browser suite after any stylesheet-boundary change.

## Prerequisite for meaningful consolidation

The correct next engineering task is not another blind merge. First make `plugins/progressive-css-colors.mjs` produce identical transformed declarations regardless of whether source rules arrive from separate CSS modules, a CSS import, an Astro style block, or a physically merged file.

Once that is deterministic, consolidation can be retried safely. The most useful targets would then be:

1. global shell files with overlapping ownership (`ion-theme.css`, `navigation.css`, `header-controls.css`, and `layout.css`)
2. timeline files grouped into graph, controls, and Chronicle ownership
3. the Degel explorer's main, artwork, and layout files
4. the four homepage files
