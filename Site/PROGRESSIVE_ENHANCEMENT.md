# Progressive-enhancement contract

Interactive visualisations enhance VISCERIUM information; they must not become the only way to access it.

## Contract

- Canonical lore remains readable as HTML when optional client JavaScript fails or is blocked.
- Maps must retain an accessible location list, links or equivalent textual reference outside the interactive map canvas.
- Timelines must retain a chronological list/table of the represented events.
- Relationship graphs must retain ordinary related-entity links with relationship labels where that information is known.
- Galleries must retain meaningful images/links and captions without depending on a lightbox.
- Search and filters may improve navigation but may not be the only route to canonical content.
- Core navigation, article reading and contact information must not require hydration.
- Enhanced controls must not hide their fallback until the enhancement has initialised successfully.
- Where an interaction changes important state, the state should be expressible in a URL or persisted in ordinary markup when practical.

## Testing

Representative interactive features should have a regression test for their non-JavaScript/fallback output in addition to tests of the enhanced UI. The fallback should communicate the same facts, not necessarily reproduce the same visual experience.
