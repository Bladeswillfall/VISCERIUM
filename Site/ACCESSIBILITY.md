# Accessibility contract

VISCERIUM targets **WCAG 2.2 Level AA** for the public Codex.

This target applies to ordinary article pages and to interactive surfaces such as maps, timelines, relationship graphs, search, navigation, galleries and forms.

## Baseline requirements

- Use semantic HTML before ARIA. ARIA supplements semantics; it does not replace them.
- All interactive controls must be keyboard operable and expose a visible `:focus-visible` state.
- Pointer targets should be at least 44 CSS px where the VISCERIUM UI owns their dimensions. Do not reduce a native control below its usable platform size.
- Do not rely on colour alone to communicate state, selection, errors or relationships.
- Honour `prefers-reduced-motion: reduce` and avoid required motion for comprehension.
- Preserve usable rendering in forced-colours/high-contrast modes.
- Every meaningful image requires useful alternative text. Decorative images must be explicitly decorative.
- Interactive visualisations must expose an equivalent readable representation; see `PROGRESSIVE_ENHANCEMENT.md` when that contract lands.
- Page and component language must be machine-readable. The i18n workstream owns locale architecture; accessibility owns correct language exposure to assistive technology.
- Heading order, landmarks and labels must describe the page structure rather than its visual styling.
- Errors must identify the affected field or action in text and keep user-entered data available for correction.

## Regression boundary

`src/styles/a11y.css` owns global accessibility CSS behaviour, including:

- visually hidden text;
- visible focus indicators;
- minimum VISCERIUM-owned control sizes;
- reduced-motion behaviour;
- forced-colours fallbacks.

Do not duplicate those global rules across component stylesheets without a component-specific reason.

## Validation

The repository test suite contains contract tests for the global accessibility layer. Component tests should be added when an interactive component introduces keyboard, focus, labelling or fallback behaviour that cannot be covered by the global contract.

Automated checks are a regression net, not a substitute for keyboard and assistive-technology review. Release review should include keyboard-only navigation and reduced-motion/high-contrast spot checks for materially changed interactive surfaces.
