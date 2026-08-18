# VISCERIUM design system

The public Codex already has token, typography, layout, navigation, accessibility and era-specific style layers. This contract formalises ownership so new UI extends that system instead of creating isolated styling islands.

## Foundations

- Colour: semantic variables in the colour-token layer. Components should not introduce repeated raw colour values when an existing semantic token describes the role.
- Typography: shared type roles for reading copy, interface text, display text and code/data.
- Spacing: use a small shared scale; avoid component-specific near-duplicate spacing values without a layout reason.
- Motion: motion is optional enhancement and must obey the accessibility reduced-motion contract.
- Breakpoints: responsive behaviour should follow shared content/layout needs rather than device-brand breakpoints.
- Iconography: icons supplement labels and state; unfamiliar actions require accessible text.

## Component primitives

Prefer reusable primitives/patterns for buttons, links, badges, panels, callouts, dividers and form controls. Reuse does not require turning the Codex into a generic component library: patterns should exist because VISCERIUM uses them repeatedly.

## Domain patterns

The design system may define higher-level VISCERIUM patterns including article headers, metadata/infobox regions, relationship blocks, galleries, maps, timelines and entity cards.

Era styling should modify approved tokens/pattern accents rather than fork the complete component implementation for CITADEL, SMOG, NEARSIGHT or ENTROPY.

## Ownership rule

One stylesheet/module should own each global visual concern. When a new rule conflicts with an old owner, consolidate or replace the old rule rather than layering another override on top.

## Implementation path

1. Inventory existing CSS tokens and repeated raw values.
2. Name the stable semantic tokens already in use.
3. Identify genuinely repeated primitives and patterns.
4. Migrate incrementally with visual-regression/unit coverage where practical.
5. Keep article content portable: the design system presents Markdown/YAML; it does not become the canonical store for lore.
