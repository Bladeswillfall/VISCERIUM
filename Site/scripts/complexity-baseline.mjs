// Grandfathered cyclomatic-complexity findings from the 2026-08-27 survey.
// Remove an entry when its function is simplified. New findings are not allowed.
export const COMPLEXITY_BASELINE = [
  { file: 'Services/comment-gateway/src/server.mjs', scores: [22] },
  { file: 'Services/comment-gateway/src/unicode-policy.mjs', scores: [23] },
  { file: 'Site/scripts/generate-map-data.mjs', scores: [32] },
  { file: 'Site/scripts/integrate-worldanvil-import.mjs', scores: [22] },
  { file: 'Site/scripts/normalise-worldanvil-sidebars.mjs', scores: [23] },
  { file: 'Site/scripts/sync-public-notes.mjs', scores: [24] },
  { file: 'Site/sidebar.mjs', scores: [21] },
  { file: 'Site/src/lib/timeline/compiler.mjs', scores: [22, 30] },
  { file: 'Site/src/lib/timeline/renderer.mjs', scores: [25] },
  { file: 'Site/src/scripts/codex-shell.js', scores: [33] },
  { file: 'Site/tests/browser/sidebar-editorial-hierarchy.spec.mjs', scores: [32] },
  { file: 'Site/tests/browser/timeline-chronicle.spec.mjs', scores: [26] },
  { file: 'Site/tests/browser/timeline-tooltip.spec.mjs', scores: [23] },
];

// ESLint core does not parse Astro templates without an additional parser.
// Keep the one survey finding visible until Astro linting is adopted or the callback is simplified.
export const ASTRO_COMPLEXITY_DEBT = [
  { file: 'Site/src/components/IonSidebarSublist.astro', score: 23 },
];
