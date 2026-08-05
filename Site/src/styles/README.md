# Codex stylesheet architecture

The stylesheet directory is organised around feature ownership rather than one-file-per-fix fragments. Import order and import location remain application behaviour: do not move a stylesheet between Astro components and Starlight entrypoints without running the unit, build and browser suites.

## Global Starlight/Codex stack

Registered explicitly in `astro.config.mjs`:

- `ion-layers.css` — cascade declarations and site-level stacking hierarchy;
- `color-tokens.css` — shared palettes and semantic variables;
- `ion-theme.css` — broad Starlight adaptation;
- `ion-expressive-code.css` — code-block integration;
- `typography.css` — typefaces and baseline prose rhythm;
- `article-pages.css` — editorial articles, reference sidebars and media;
- `codex-ui.css` — reusable surfaces and authoring utilities;
- `navigation.css` — left navigation and overlays;
- `header-controls.css` — desktop and mobile header actions;
- feature sheets for maps, relationships, exploration pages, calendars, category indexes and support;
- `layout.css` — page geometry, authored indents and late structural overrides;
- `a11y.css` — focus, reduced motion, forced colours and target sizing;
- `era-styles.css` — era palettes, context controls and era-aware search;
- `graph.css` — loaded after the third-party graph sheets because its canvas adapter must win the final cascade.

## Page and component entrypoints

- `homepage.css` — public homepage;
- `start-here-pages.css` — guided Start Here experience;
- `era-primer-pages.css` — era primers;
- `degel-system.css` — Degel explorer;
- `chronos.css` — native Chronos embeds and renderer adaptation;
- `timeline-canvas.css` — server-rendered timeline application and routes;
- `timeline-controls.css` — hydrated toolbar controls;
- `timeline-chronicle.css` — Chronicle list view.

Astro component and Starlight styles can be emitted in a different order from their source imports. Cross-entrypoint overrides must therefore use explicit feature scoping and sufficient selector specificity instead of relying only on concatenation order.

## Editing rules

1. Keep selectors in the stylesheet that owns their feature.
2. Keep shared colours in `color-tokens.css`.
3. Keep broad geometry and deliberate late overrides in `layout.css`.
4. Preserve section provenance comments inside consolidated files.
5. Explain non-obvious cascade requirements, third-party overrides and intentionally unlayered rules.
6. Avoid CSS `@import` aggregators. Consolidated files contain the rules directly.
7. Run unit tests, the production build and browser regression tests after changing stylesheet boundaries.
