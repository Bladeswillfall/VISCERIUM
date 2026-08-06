---
document_type: checklist
checklist_id: CHK-004a
parent_sop: SOP-004
readiness_level: publication
---
# Frontmatter Publication Checklist

> **Parent workflow:** [[Frontmatter Authoring Workflow]]
> **Date contract:** [[Publication Date Rules]]

## Required identity

- [ ] `title`, `type`, `status`, and controlled era or Universal scope are valid where required.
- [ ] The note path agrees with the intended public route and era.
- [ ] A stable `entity_id` exists only when continuity requires it.
- [ ] The description is accurate and useful outside the article body.

## Dates and automatic fields

- [ ] `created` is authoritative or absent; it is not being used as a substitute for first publication.
- [ ] On first genuine public release, `published` records the real first-publication date in `YYYY-MM-DD` format; otherwise it remains authoritative or intentionally blank.
- [ ] An existing `published` date has not been reset merely because the article was revised or redeployed.
- [ ] `updated` reflects maintained authoring activity.
- [ ] Automatic counts were not hand-authored as canon facts.
- [ ] A migrated note does not use its import date as a false creation or publication date.

## Images and relationships

- [ ] Image properties point to permitted repository assets.
- [ ] Image filenames are unambiguous.
- [ ] `related` contains useful contextual links.
- [ ] `relationships` contains only meaningful semantic relationships.

## Publishing state

- [ ] `status: published` is deliberate.
- [ ] No unresolved frontmatter conflict is hidden by publication.
- [ ] Folder-derived values have been audited where relevant.
- [ ] Vault Doctor and the site build report no metadata error.

## Decision

- [ ] **Publication ready**
- [ ] **Not ready** - blocking reason recorded.
