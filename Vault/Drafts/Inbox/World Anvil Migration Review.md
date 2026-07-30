---
title: "World Anvil Migration Review"
status: draft
type: article
development_level: stub
---
# World Anvil Migration Review

Use [[System/Bases/World Anvil Import.base|World Anvil Import]] as the work board. This page explains the decisions behind the queues when a card is not self-explanatory.

## Start here

1. Open **World Anvil Import → Review first**.
2. Work **Tier 1** before **Tier 2**. Do not drift into Tier 3/4 work merely because it is easier.
3. Within a tier, resolve identity/type/era problems before cosmetic cleanup.
4. Open one import. **VISCERIUM Creator Tools** will reveal its Import review context in the right sidebar while you edit.
5. Use the sidebar's checklist, comparison and Previous/Next controls rather than relying on memory after leaving the Base.
6. Use **Ctrl/Cmd + P** when an instruction asks for a VISCERIUM Creator Tools command.

> [!important]
> Clearing migration flags is not the same as publishing canon. Keep the current Codex note authoritative when one already exists, and keep `status: draft` until publication is a deliberate decision.

## Import review sidebar

The temporary **Import review** pane appears automatically for an active World Anvil import that still has unresolved generated review tasks. It keeps the decision context from the Base visible beside the article.

It shows:

- editorial tier and priority reason.
- the next migration decision and how to approach it.
- the article's existing `## Import review` checklist.
- a side-by-side comparison action when a current Codex note has the same title.
- progress for the current article.
- **Previous / Next** navigation in the same Tier → issue count → title priority order as **Review first**.
- links back to this guide and the Base.

The sidebar does **not** create a second task list. Its checkboxes edit the Markdown checklist already stored in the import and mirror the generated issue state into `import_issues` for the Base.

When every task is resolved the pane shows **Review complete**, but deliberately does not move, delete, publish or canonise the note. Choose its destination yourself. Opening ordinary lore removes the temporary review pane and returns the right sidebar to normal creator context.

## Read the card in two layers

**Editorial priority** tells you *whether this article deserves your time now*:

- **Tier 1, Setting spine:** explains or unlocks VISCERIUM as a whole.
- **Tier 2, Era anchor:** major faction, threat, concept or through-line needed for a strong era slice.
- **Tier 3, Connective depth:** useful world detail after the spine and anchors are coherent.
- **Tier 4, Defer:** narrow or peripheral material unless it blocks higher-tier work.

**Migration state** tells you *what decision the note needs next*:

- red = identity or canon conflict.
- amber = structural decision such as type, era, continuity or relationship.
- blue = link or reference repair.
- green = mechanically clear and ready for destination review.
- neutral = lower-priority review/artwork work.

Priority is not an error state.

A Tier 1 note can be mechanically clean.

A Tier 4 note can be badly broken and still deserve to wait.

## Recommended decision order

Within the tier you are currently reviewing:

1. **Existing matches**
2. **Duplicate titles**
3. **Type decisions**
4. **Era editions**
5. **Missing era**
6. **Relationship review**
7. **Unresolved links**
8. **Artwork**
9. **Ready to file**

Identity, type and chronology come first because later work depends on them.

## Convert one import to current format

Use [[System/SOPs/Creator Command Reference#Update an existing World Anvil import|Update an existing World Anvil import]] for the exact frontmatter command sequence.

Integrated imports already contain baseline frontmatter.

Do not insert a full creation or type template into an existing import.

1. Confirm the imported `type`.
2. Resolve the era and continuity decisions.
3. Add only useful optional properties.
4. Convert useful legacy facts with [[System/Frontmatter Schema#Article facts sidebar|Article facts sidebar]].
5. Return to the note's **Import review** checklist.

> [!note]
> The public facts sidebar, Obsidian creator sidebar, and in-article columns are separate features.

## Existing matches

Use this when a current Codex note already has the same canonical title.

1. Use **Open … side-by-side** in the Import review pane.
2. Treat the current Codex note as authoritative.
3. Copy only legacy facts that are still valid and useful.
4. Keep one note when both describe the same conceptual subject.
5. Keep both only when they genuinely describe different subjects.
6. Disambiguate the title or `entity_id`.

**Done when:** one authoritative note represents each subject without ambiguity.

## Duplicate titles

Use this when two imported notes share a title.

1. Read both notes.
2. Decide whether they describe the same subject.
3. Merge useful information when they do.
4. Rename/disambiguate when they do not.
5. Use different `entity_id` values for unrelated continuity families.

**Done when:** a creator can distinguish the subjects without guessing.

## Type decisions

1. Read the content before changing type.
2. Check the imported World Anvil type for context.
3. Choose the existing Codex type that best describes the subject.
4. Edit the `type` property.
5. Read [[System/SOPs/Schema Change SOP|Schema Change SOP]] before inventing a new shared type.

**Done when:** the note belongs in the correct creator workflow/Base.

## Era editions

Use this when one imported record spans more than one era. Do not publish a single multi-era continuity article merely because World Anvil stored it that way.

1. Decide whether the subject has one continuity identity across the listed eras.
2. Stop and disambiguate when similar names describe unrelated things.
3. Run **VISCERIUM Creator Tools: Set continuity entity ID** for a real continuity family.
4. Set the working note to its first historical era.
5. Run **VISCERIUM Creator Tools: Create era edition from current note** for each additional era.
6. Edit each edition independently.
7. Remove facts that are not true or useful in that era.

Read [[System/SOPs/Era Edition Workflow SOP|Era Edition Workflow SOP]] when continuity is unclear.

**Done when:** each historical edition has one scalar `era` and the intended shared `entity_id`.

## Missing era

1. Read enough content to identify historical scope.
2. Run **VISCERIUM Creator Tools: Set controlled era / Universal scope** from the pane or Command Palette.
3. Choose `CITADEL`, `SMOG`, `NEARSIGHT`, `ENTROPY` or `Universal` only when canon supports it.
4. Leave it unresolved when canon does not establish an answer.

Do not invent chronology to clear the queue and do not type arbitrary era names into Base cells.

## Relationship review

Use this for leadership, membership, ownership, succession and similar imported facts.

1. Decide whether the relationship matters to navigation, continuity, politics, command, ownership or story logic.
2. Keep incidental facts in prose or `related:`.
3. Add `relationships:` only when the relationship itself matters.
4. Follow [[System/SOPs/Relationship Authoring SOP|Relationship Authoring SOP]] for structure.

**Done when:** the relationship graph contains meaningful semantic relationships rather than every incidental mention.

## Unresolved links

1. Find the remaining World Anvil link.
2. Search the vault for the intended current subject.
3. Replace it with a wikilink only when the target is certain.
4. Leave it unresolved or add a creator task when certainty is not available.

Never repair a link by guessing.

## Artwork

Do this after identity/type/era work is stable.

1. Find the unresolved asset reference.
2. Locate source artwork only when you own or can lawfully use it.
3. Convert raster artwork to WebP before adding it to the repository.
4. Store it under the correct `Vault/Assets/` location.
5. Replace the legacy reference, or remove it when reuse is not appropriate.

After a batch of asset work, run `cd Site && npm run doctor:vault`.

## Ready to file

This means no migration flag remains. It does **not** mean the article is ready for publication.

Confirm:

- title.
- Codex type.
- era or Universal scope.
- continuity identity when required.
- obsolete World Anvil boilerplate removed.
- useful creator tasks retained.
- destination folder chosen deliberately.
- `status: draft` retained until publication is genuinely intended.

## Migration-level checklist

- [ ] Process **Existing matches** and keep current Codex notes authoritative.
- [ ] Process **Duplicate titles** and make each subject unambiguous.
- [ ] Process **Type decisions** using existing Codex types where possible.
- [ ] Process **Era editions** when continuity is real.
- [ ] Process **Missing era** without inventing chronology.
- [ ] Process **Relationship review** for meaningful semantic relationships only.
- [ ] Process **Unresolved links** without guessing targets.
- [ ] Process **Artwork** after structural decisions are stable.
- [ ] Review **Ready to file** and move notes only when their destination is deliberate.

The live Base remains the workload index.

The note-level Markdown checklist is the source of truth during review.

VISCERIUM Creator Tools keeps its generated `import_issues` mirror aligned when you use the sidebar controls.

→ [[System/Imports/WorldAnvil/report|Generated import report]]
