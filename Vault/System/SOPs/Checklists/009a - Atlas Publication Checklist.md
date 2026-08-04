---
document_type: checklist
checklist_id: CHK-009a
parent_sop: SOP-009
readiness_level: publication
---
# Atlas Publication Checklist

> **Parent SOP:** [[Atlas Authoring SOP]]

## Map identity

- [ ] The map note has a unique `mapId`.
- [ ] The public image path and marker sidecar path are correct.
- [ ] The title, description, era, and scale are reader-safe.
- [ ] The source map asset is stored in the approved location.

## Markers

- [ ] Every public marker links to the intended published note.
- [ ] Public marker types use the most specific stable semantic value.
- [ ] Layers describe meaning without duplicate markers.
- [ ] Marker coordinates are valid and visually checked.
- [ ] Unpublished, unresolved, ambiguous, and demo markers do not leak into canon output.

## Use and navigation

- [ ] Search, layers, popups, zoom visibility, and nested-map links behave as intended.
- [ ] Broad-scale labels do not obscure the map.
- [ ] Mobile inspection remains usable.
- [ ] An era homepage links to the intended Atlas route where applicable.

## Validation

- [ ] The sidecar changes after deliberate marker movement.
- [ ] Map generation reports no unresolved warning that blocks publication.
- [ ] The public build completes successfully.
- [ ] Generated map data was not hand-edited.

## Decision

- [ ] **Publication ready**
- [ ] **Not ready** - blocking reason recorded.
