# Codex stylesheet architecture

Styles are owned by the narrowest stable entry point that needs them. Import location and order are application behaviour, so run unit, production build, and browser checks after changing a boundary.

## Exact global cascade

`astro.config.mjs` registers this order:

1. `katex/dist/katex.min.css`: third-party maths foundation.
2. `ion-layers.css`: cascade layers, stacking tokens, and the shared `image-layout.css` import.
3. `color-tokens.css`: shared palettes and semantic variables.
4. `ion-theme.css`: broad Starlight theme adaptation.
5. `ion-expressive-code.css`: code-block theme adaptation.
6. `typography.css`: type and baseline text rhythm.
7. `article-pages.css`: editorial article presentation.
8. `layout.css`: article geometry and structural overrides.
9. `codex-ui.css`: shared components and authoring utilities.
10. `header-controls.css`: shared desktop and mobile header controls.
11. `navigation.css`: shared navigation and overlays.
12. `category-index.css`: generated Markdown category pages, which have no stable component entry point.
13. `a11y.css`: focus, target sizing, forced colours, and reduced motion.
14. `era-styles.css`: final era-specific token and component overrides.

The order is deliberate: layers and tokens, theme, typography, article layout, shared components, navigation, accessibility, then era overrides. Feature routes do not belong in this list.

## Stylesheet ownership

| Stylesheet | Owner and load boundary |
| --- | --- |
| `ion-layers.css`, `color-tokens.css` | Global cascade foundation in `astro.config.mjs` |
| `ion-theme.css`, `ion-expressive-code.css`, `typography.css` | Global Starlight and text theme in `astro.config.mjs` |
| `article-pages.css`, `layout.css` | Shared article and structural layout in `astro.config.mjs` |
| `codex-ui.css`, `header-controls.css`, `navigation.css` | Shared controls and navigation in `astro.config.mjs` |
| `category-index.css` | Global exception for generated Markdown category pages |
| `a11y.css`, `era-styles.css` | Final global accessibility and era overrides |
| `maps.css` | `WorldMap.astro` and the Atlas index route |
| `relationships.css` | `RelationshipGraph.astro` |
| `exploration-pages.css` | `WorldMap.astro` and `RelationshipGraph.astro` |
| `support.css` | Support and contact routes |
| `graph.css` and `starlight-site-graph` package styles | Graph route, with `graph.css` last |
| `calendar-date-badge.css` | `CalendarDateBadge.astro` |
| `calendar-year.css` | `CalendarYear.astro` |
| `homepage.css` | Public homepage route |
| `start-here-pages.css` | `StartHerePrimer.astro` |
| `era-primer-pages.css` | `EraPrimer.astro` |
| `degel-system.css` | `DegelSystemExplorer.astro` |
| `storyteller-view.css` | Shared page-title Storyteller switcher boundary |
| `chronos.css`, `timeline-canvas.css`, `timeline-chronicle.css`, `timeline-controls.css` | `TimelineApp.astro`, while `chronos.css` also serves the Obsidian plugin |
| `smart-tooltips.css` | Components that install shared tooltip behaviour |
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
