# Performance budget

VISCERIUM should remain fast as maps, graphs, timelines, search, comments and analytics accumulate. Performance is therefore a release constraint, not a later optimisation pass.

## User-facing targets

For representative public pages at the 75th percentile where field data is available:

- Largest Contentful Paint: <= 2.5 s
- Interaction to Next Paint: <= 200 ms
- Cumulative Layout Shift: <= 0.10

## Engineering rules

- Ordinary lore pages should ship little or no page-specific client JavaScript.
- Heavy interactive libraries must load only on pages that use them.
- Below-the-fold media should be lazy-loaded where that does not harm the primary content experience.
- Images must reserve intrinsic layout space to avoid avoidable layout shift.
- Third-party scripts should remain optional, lazy or off-main-thread where practical.
- New dependencies must justify their runtime cost; build-time-only dependencies are preferred for static transformations.
- Performance budgets should be measured against representative ordinary, image-heavy and interactive Codex pages rather than only the home page.

## Automation plan

Introduce a repeatable CI audit that records bundle/page weight and Lighthouse-style metrics. Start with warning/report mode, establish a stable baseline, then turn meaningful regressions into failures once the baseline is trustworthy.
