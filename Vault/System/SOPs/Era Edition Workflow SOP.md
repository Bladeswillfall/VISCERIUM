---
document_type: sop
sop_id: SOP-006
---
# Era Edition Workflow SOP

> **Use this SOP when:** One conceptual subject needs different reader-facing facts in different eras.
>
> **Result:** Each required era has one independent edition with a shared continuity identity.
>
> **First action:** Confirm that the notes describe one continuing conceptual subject.

Follow [[Documentation Writing Standard]] for operational wording.

## Purpose

Keep each era useful as a closed setting.

Keep cross-era continuity available in the all-era Codex.

## Controlled era values

Use only these values:

- `CITADEL`
- `SMOG`
- `NEARSIGHT`
- `ENTROPY`
- `Universal`

`Universal` is an era-independent scope.

It is not a fifth chronological era.

Events and timeline records do not use `Universal`.

## Before you start

1. Confirm that the notes describe the same conceptual subject across time.
2. Confirm that reader-facing facts change enough to justify separate editions.
3. Keep separate `entity_id` values for unrelated subjects with similar titles.

> **Why:** A shared `entity_id` tells the publisher that separate notes represent one continuing subject.

## Continuity identity

`entity_id` groups independent era editions into one continuity family.

The `entity_id` is not the article title.

Example:

```yaml
title: Okse Dominion
entity_id: okse-dominion-b
era: SMOG
```

Use readable lowercase kebab-case.

Keep the current `entity_id` stable when the display title changes.

## Set up the first edition

### Set the continuity identity

1. Open the historical note that will become the first edition.
2. Press **Ctrl/Cmd + P**.
3. Run **VISCERIUM Creator Tools: Set continuity entity ID**.
4. Accept the suggestion only when it identifies the correct conceptual subject.
5. Change the suggestion when a similar title needs a separate continuity family.

### Set the era

1. Press **Ctrl/Cmd + P**.
2. Run **VISCERIUM Creator Tools: Set controlled era / Universal scope**.
3. Select one historical era.
4. Confirm that the note has one scalar `era` value.

Do not publish a continuity edition with `eras: [CITADEL, SMOG]`.

Multi-era arrays are migration metadata while the decision is unresolved.

## Create another historical edition

### Create the draft

1. Open a current historical edition.
2. Press **Ctrl/Cmd + P**.
3. Run **VISCERIUM Creator Tools: Create era edition from current note**.
4. Select the target historical era.
5. Open the new draft under `Drafts/Inbox/Era Editions/<ERA>/`.

The command preserves the continuity identity.

The command prevents a second edition for the same `entity_id + era` pair.

### Review the draft

1. Review every inherited fact.
2. Remove information that is not true or useful in the new era.
3. Add information that is confirmed for the new era.

> **Why:** The command copies context, but it cannot decide which facts changed over time.

## Review inherited content

### Check identity and society

- Check population and distribution.
- Check government, ownership, and membership.
- Check terminology and public knowledge.
- Check relationships and affiliations.

### Check material and presentation

- Check technology and material culture.
- Check habitat, ecology, and resource pressure.
- Check reader-safe secrets and contemporary knowledge.
- Check images, statistics, and sidebar facts.

Delete historical detail that does not help the selected era.

## Publish an edition

Published historical editions must use the matching Lore path.

Example:

```text
Lore/Eras/CITADEL/Fauna/Cow.md
Lore/Eras/SMOG/Fauna/Cow.md
```

1. Confirm the scalar `era` value.
2. Confirm the `entity_id` value.
3. Move the note under the matching `Lore/Eras/<ERA>/` path.
4. Set `status: published` only when the edition is ready for public canon.
5. Run `cd Site && npm run doctor:vault`.

## Universal notes

Use `era: Universal` only when the note is intentionally valid across historical contexts.

Published Universal notes live under `Lore/Universal/`.

Do not create a Universal parent for a historical continuity family.

The website generates the all-era entity hub automatically.

A continuity family uses historical editions or one Universal edition.

Do not mix both forms in one family.

## Link behaviour

The publisher resolves a conceptual link in this order:

1. Same-era edition.
2. Unique Universal target.
3. Generated all-era entity hub.
4. Unresolved readable text with a build warning.

The publisher does not send a CITADEL reader silently to a later edition.

Use a path-qualified wikilink only when you need an exact cross-era target.

## Generated entity hub

Published notes that share one `entity_id` generate `/entities/<entity_id>/`.

Do not hand-author a parent article only to connect the editions.

## World Anvil procedure

Use this procedure for a World Anvil note with multiple confirmed eras.

### Decide the continuity

1. Open [[Drafts/Inbox/World Anvil Migration Review|World Anvil Migration Review]].
2. Open the **Era editions** queue.
3. Open one imported note.
4. Decide whether one conceptual subject persists through the listed eras.
5. Keep separate identities when the records describe unrelated subjects.

### Create the editions

1. Set the `entity_id` when continuity is real.
2. Set the first scalar historical era.
3. Create each additional edition with **Create era edition from current note**.
4. Edit each edition independently.
5. Publish each edition only after its era-specific content is ready.

Do not let migration automation invent continuity or historical change.

## Check the result

Confirm these statements:

- Each published historical edition has one scalar era.
- Each edition is in the matching era folder.
- All intended editions share one stable `entity_id`.
- Unrelated subjects do not share an `entity_id`.
- No Universal edition duplicates a historical continuity family.

## Stop condition

Stop when each required era has an independent, usable edition.

Do not create an edition for an era without a confirmed or useful difference.
