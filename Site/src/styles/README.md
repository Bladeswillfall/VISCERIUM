# Codex stylesheet architecture

Styles are owned by the narrowest stable entry point that needs them. Import location and order are application behaviour, so run unit, production build, and browser checks after changing a boundary.

## Exact global cascade

`astro.config.mjs` registers this order:

1. `ion-layers.css`: cascade layers, stacking tokens, and the shared `image-layout.css` import.
2. `color-tokens.css`: shared palettes and semantic variables.
3. `ion-theme.css`: broad Starlight theme adaptation.
4. `ion-expressive-code.css`: code-block theme adaptation.
5. `typography.css`: type and baseline text rhythm.
6. `layout.css`: article geometry and structural overrides.
7. `codex-ui.css`: shared components and authoring utilities.
8. `header-controls.css`: shared desktop and mobile header controls.
9. `reader-settings.css`: shared reader preference controls.
10. `navigation.css`: shared navigation and overlays.
11. `a11y.css`: focus, target sizing, forced colours, and reduced motion.
12. `era-styles.css`: final era-specific token and component overrides.

The order is deliberate: layers and tokens, theme, typography, layout, shared components, navigation, accessibility, then era overrides. Feature routes do not belong in this list.

`route-data.ts` adds `article-pages.css` to non-homepage Codex routes and `category-index.css` to category routes. These files stay out of the homepage render-blocking bundle.

## Stylesheet ownership

| Stylesheet | Owner and load boundary |
| --- | --- |
| `ion-layers.css`, `color-tokens.css` | Global cascade foundation in `astro.config.mjs` |
| `ion-theme.css`, `ion-expressive-code.css`, `typography.css` | Global Starlight and text theme in `astro.config.mjs` |
| `layout.css` | Shared article and structural layout in `astro.config.mjs` |
| `codex-ui.css`, `header-controls.css`, `reader-settings.css`, `navigation.css` | Shared controls and navigation in `astro.config.mjs` |
| `a11y.css`, `era-styles.css` | Final global accessibility and era overrides |
| `article-pages.css` | Non-homepage Codex routes through `route-data.ts` |
| `category-index.css` | Category routes through `route-data.ts` |
| `maps.css` | `WorldMap.astro` and the Atlas index route |
| `relationships.css` | `RelationshipGraph.astro` |
| `exploration-pages.css` | `WorldMap.astro` and `RelationshipGraph.astro` |
| `support.css` | Support and contact routes |
| `graph.css` | `WorldGraph.astro` on the Graph route |
| `calendar-date-badge.css` | `CalendarDateBadge.astro` |
| `calendar-year.css` | `CalendarYear.astro` |
| `homepage.css` | Public homepage route |
| `start-here-pages.css` | `StartHerePrimer.astro` |
| `era-primer-pages.css` | `EraPrimer.astro` |
| `degel-system.css` | `DegelSystemExplorer.astro` |
| `storyteller-view.css` | Shared page-title Storyteller switcher boundary |
| `timeline-vis.css`, `timeline-canvas.css`, `timeline-chronicle.css`, `timeline-controls.css` | `TimelineApp.astro` and the Obsidian plugin |
| `smart-tooltips.css` | Loaded as raw CSS by `CodexPageFrame.astro` only after a route contains `[data-smart-tooltip]` |
| `image-layout.css` | Shared article-image rules imported by `ion-layers.css` |

Astro component and Starlight styles can be emitted in a different order from their source imports. Cross-entrypoint overrides need explicit feature scoping and sufficient selector specificity instead of relying only on concatenation order.

## Placement rules

- Shared rules used across unrelated routes belong in a named global foundation or shared-component sheet.
- Route-specific rules belong to the route or its stable feature component.
- Component-local rules belong in that component's `<style>` block when no other entry point consumes them.
- Era-specific tokens and overrides belong in `era-styles.css`, loaded last globally.
- Keep a feature in one clearly named sheet unless it has a genuine shared and full-interface split, as the calendar does.
- Keep shared colours in `color-tokens.css` and section provenance comments inside consolidated files.
- Explain non-obvious third-party and cascade requirements. Do not add CSS `@import` aggregators.
