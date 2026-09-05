# CITADEL Additional Lore — Vault Migration Audit

This is a creator-only migration audit for the additional CITADEL nation material reviewed against the current `main` vault.

It is **not canon**, **not a completion percentage**, and **not permission to overwrite existing articles blindly**. Its purpose is to show what already exists, what is only scaffolded, what is missing, where each item belongs, and which naming decisions must be settled before migration.

The audit covers the nineteen nation-level entries identified in the source brief, plus the distinctive named concepts that were explicitly checked during the repository review.

## Status legend

- **ALREADY / STRONG** — substantial current vault prose exists and should be preserved.
- **PARTIAL** — meaningful prose exists, but the source contains material not yet integrated.
- **LEGACY** — substantive WorldAnvil-era material exists but still needs modernisation/reconciliation.
- **STUB** — an article exists, but it is effectively a drafting scaffold or extremely thin import.
- **MISSING** — no corresponding current vault article was found under the source name.
- **NAME DECISION** — the source and vault use different names; do not duplicate the entity until a canonical name is chosen.
- **TYPE DECISION** — a named concept exists in the source brief, but its correct vault entity type cannot safely be inferred from its name alone.

## Executive migration picture

At nation level:

- **1/19** is strongly developed in the current authoring style: **Okse Dominion**.
- **3/19** have substantial legacy prose worth preserving: **Krass Dominion**, **Kingdom of Satol**, and **Republic of Askalia**.
- **10/19** already have vault homes but are still skeletal or near-empty.
- **5/19** have no corresponding nation article under the source name.

The largest risk is not lack of folders. It is **accidental duplication caused by source/vault naming drift** and **overwriting better existing prose with older or more skeletal source material**.

---

# Nation-by-nation migration audit

## 1. Okse Dominion

**Status:** ALREADY / STRONG, with source material requiring selective comparison only.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Okse Dominion/Okse Dominion.md`

**Current vault state:**
A substantial contemporary article already exists, with developed material on geography, culture, slavery, oil, economy, Resonance, warfare, settlements and the Dominion's relationship with the Krass.

**Migration rule:**
Do **not** replace or mechanically merge the current article. Treat the additional source as a reference checklist and migrate only facts that are genuinely absent, compatible and still desired.

**Recommended action:**
- [ ] Compare source additions against the existing article section-by-section.
- [ ] Preserve current prose where both sources cover the same ground.
- [ ] Promote genuinely reusable subtopics into supporting pages only when they recur elsewhere.
- [ ] Record contradictions rather than silently choosing one version.

**Priority:** Low for raw migration; high only where the source introduces genuinely new canon.

---

## 2. Krass Dominion

**Status:** PARTIAL / LEGACY.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Krass Dominion/Krass Dominion.md`

**Existing support:**
- `Vault/Lore/Eras/CITADEL/Nations/Krass Dominion/Kemsvall.md`
- `Vault/Lore/Eras/CITADEL/Nations/Krass Dominion/Raumavall.md`
- `Vault/Lore/Eras/CITADEL/Nations/Krass Dominion/Umestad.md`
- `Vault/Lore/Eras/CITADEL/Nations/Krass Dominion/Ethnicity-Krassian-6ca.md`
- `Vault/Lore/Eras/CITADEL/Nations/Krass Dominion/Professions/Bal-Seidr.md`
- `Vault/Lore/Eras/CITADEL/Nations/Krass Dominion/Organisations/Krassian Wolves.md`

**Current vault state:**
The nation article contains substantial imported lore, but it still carries legacy/import scaffolding and `development_level: stub`. Supporting entities are unevenly developed.

**Source additions already identified as missing/thin:**
- the newer **Bál-Seiðr funeral-role material** is not present in the current Bal-Seidr scaffold;
- further source-specific Krass additions must be merged around existing prose rather than replacing it.

**Recommended action:**
- [ ] Reconcile the source brief against the legacy national article.
- [ ] Move Bál-Seiðr material into the existing profession page.
- [ ] Keep national-level culture/history in the nation article; extract only reusable professions, organisations, events or locations.
- [ ] Remove legacy import flags only after the migrated article has been reviewed as a coherent whole.

**Priority:** High.

---

## 3. The Skarnborn Clans

**Status:** MISSING.

**Proposed destination:**
`Vault/Lore/Eras/CITADEL/Nations/The Skarnborn Clans/The Skarnborn Clans.md`

**Current vault state:**
No corresponding current nation article was found under `Skarnborn`.

**Recommended action:**
- [ ] Create the nation folder/article only when the source prose is ready to populate it.
- [ ] Do not create a blank placeholder merely to satisfy this audit.
- [ ] Extract clan, culture, profession or organisation pages only where the source establishes them as independently reusable entities.

**Priority:** High if this polity is now canonically placed on the map.

---

## 4. Kingdom of Satol

**Status:** PARTIAL / LEGACY.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Kingdom of Satol/Kingdom of Satol.md`

**Current vault state:**
Substantial WorldAnvil-era prose exists, including history, social conditions and exports, but the article still carries legacy metadata and `development_level: stub`.

**Migration rule:**
Use the source brief to modernise and expand the current article, not to discard the existing material.

**Recommended action:**
- [ ] Preserve useful legacy facts unless the new source explicitly supersedes them.
- [ ] Separate contradictions into a review list before rewriting.
- [ ] Develop only those supporting pages that reduce repetition or are independently useful.

**Priority:** High.

---

## 5. [Sami]

**Status:** MISSING + NAME DECISION.

**Current destination:** None.

**Proposed destination after naming:**
`Vault/Lore/Eras/CITADEL/Nations/<canonical in-world name>/<canonical in-world name>.md`

**Current vault state:**
No nation article under the Earth-placeholder name was found.

**Migration rule:**
Do **not** create `[Sami].md`. The placeholder describes inspiration, not final Errack canon.

**Recommended action:**
- [ ] Choose the canonical in-world polity/culture name first.
- [ ] Decide whether the source describes a nation, a culture spanning several polities, or both.
- [ ] Create the correct entity only after that distinction is clear.

**Priority:** Blocked by naming/type decision.

---

## 6. [Finland]

**Status:** MISSING + NAME DECISION.

**Current destination:** None.

**Proposed destination after naming:**
`Vault/Lore/Eras/CITADEL/Nations/<canonical in-world name>/<canonical in-world name>.md`

**Migration rule:**
Do **not** introduce the Earth-placeholder as canon merely because it appears in development notes.

**Recommended action:**
- [ ] Choose the in-world name.
- [ ] Confirm borders/relationship to neighbouring source polities.
- [ ] Migrate the source only once the canonical identity is settled.

**Priority:** Blocked by naming decision.

---

## 7. Republic of Askalia

**Status:** PARTIAL / LEGACY.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Republic of Askalia/Republic of Askalia.md`

**Current vault state:**
Substantial imported prose exists on trade, government history, class disparity, slavery and exports, but the article remains a legacy stub by metadata.

**Recommended action:**
- [ ] Compare the source brief against the existing political/economic identity.
- [ ] Preserve useful legacy detail where compatible.
- [ ] Reconcile any changed naming, institutional or historical claims explicitly.
- [ ] Only extract supporting entities when they have independent narrative use.

**Priority:** High.

---

## 8. [Germany]

**Status:** MISSING + NAME DECISION.

**Current destination:** None.

**Source-development terms previously associated with this placeholder:**
Zollwerk / Buchmark or comparable development naming should not be assumed canonical without a deliberate decision.

**Proposed destination after naming:**
`Vault/Lore/Eras/CITADEL/Nations/<canonical in-world name>/<canonical in-world name>.md`

**Recommended action:**
- [ ] Resolve the canonical polity name.
- [ ] Confirm whether development terms are regions, institutions, predecessor states or discarded names.
- [ ] Avoid creating multiple nation folders from exploratory naming.

**Priority:** Blocked by naming decision.

---

## 9. Verazemia

**Status:** STUB.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Verazemia/Verazemia.md`

**Current vault state:**
The current page is essentially metadata plus the imported artwork disclaimer.

**Source material specifically identified as absent:**
- Verazemian theology;
- **Harmonic Stallium** material;
- the wider source brief's religious/cultural identity for the nation.

**Recommended action:**
- [ ] Populate the existing nation article rather than creating a replacement.
- [ ] Keep national belief/cultural consequences in the nation article first.
- [ ] Split Harmonic Stallium or religious institutions into independent pages only if they recur across multiple articles or need their own relationships.

**Priority:** Very high; this is one of the clearest source-to-stub migrations.

---

## 10. Udumaa / Uduma

**Status:** STUB + NAME DECISION.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Uduma/Uduma.md`

**Current vault state:**
The article is a generic faction drafting scaffold rather than developed lore.

**Conflict:**
The source uses **Udumaa** while the vault uses **Uduma**.

**Migration rule:**
Do not create a second `Udumaa` nation until the canonical spelling is deliberately chosen.

**Recommended action:**
- [ ] Decide `Uduma` vs `Udumaa`.
- [ ] If `Udumaa` wins, rename/move the existing vault entity rather than duplicating it.
- [ ] Populate the surviving canonical page from the source.

**Priority:** Very high after naming decision.

---

## 11. Ampelotír / Ampelotiri

**Status:** STUB + NAME DECISION.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Ampelotiri/Ampelotiri.md`

**Current vault state:**
Generic faction scaffold.

**Conflict:**
The source uses **Ampelotír** while the vault uses **Ampelotiri**.

**Recommended action:**
- [ ] Choose the canonical spelling/diacritics.
- [ ] Rename the existing folder/article if required.
- [ ] Populate the canonical article from the source rather than creating parallel identities.

**Priority:** Very high after naming decision.

---

## 12. Zoryavia / Zoravye

**Status:** STUB + NAME DECISION.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/{POLAND} Zoravye/Zoravye.md`

**Current vault state:**
A generic scaffold still lives inside a development-placeholder folder.

**Conflict:**
The source uses **Zoryavia** while the vault uses **Zoravye**, and the folder still contains the explicit `{POLAND}` development marker.

**Source material specifically identified as absent:**
- the source's **astral / amber** material and associated national identity.

**Migration rule:**
This should be treated as a canonicalisation task before prose migration.

**Recommended action:**
- [ ] Decide whether `Zoryavia` supersedes `Zoravye`.
- [ ] Remove the `{POLAND}` development marker through a proper move/rename when canonicalised.
- [ ] Migrate astral/amber material into the canonical nation article.
- [ ] Create separate belief/material/entity pages only if their reuse justifies it.

**Priority:** Critical naming cleanup + high content priority.

---

## 13. Angliath

**Status:** STUB.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Angliath/Angliath.md`

**Current vault state:**
Generic 192-word faction scaffold with no substantive national prose.

**Recommended action:**
- [ ] Migrate the source's Angliath material directly into the existing article.
- [ ] Keep nation-defining history, politics, culture and warfare together during the first pass.
- [ ] Extract supporting entities only after the national article reads coherently on its own.

**Priority:** Very high.

---

## 14. Alba

**Status:** STUB.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Alba/Alba.md`

**Current vault state:**
Generic faction scaffold.

**Recommended action:**
- [ ] Populate the existing article from the source.
- [ ] Preserve source distinctions from Angliath and the Kingdom of the Isles rather than allowing all three to collapse into a generic British-isles analogue.

**Priority:** Very high.

---

## 15. Kingdom of the Isles

**Status:** MISSING.

**Proposed destination:**
`Vault/Lore/Eras/CITADEL/Nations/Kingdom of the Isles/Kingdom of the Isles.md`

**Current vault state:**
No corresponding current CITADEL nation article was found under this name.

**Recommended action:**
- [ ] Confirm the name is final rather than a development label.
- [ ] Create the nation article once source prose is ready.
- [ ] Establish its relationship to Angliath, Alba and Uainetír in the same migration pass so regional identities remain distinct.

**Priority:** High.

---

## 16. Uainetír

**Status:** STUB.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Uainetír/Uainetir.md`

**Current vault state:**
A generic faction scaffold exists; the filename currently omits the accented `í` used by the folder/title convention.

**Source material specifically identified as absent:**
- the source's **colonial / clan** material.

**Recommended action:**
- [ ] Populate the existing entity rather than create another Uainetír page.
- [ ] Decide whether the filename should be normalised to match the canonical title.
- [ ] Migrate colonial/clan relationships in a way that makes Uainetír distinct from Angliath/Alba rather than merely derivative.

**Priority:** Very high.

---

## 17. Dar al-Damm

**Status:** STUB.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Dar al-Damm/Dar al-Damm.md`

**Current vault state:**
Generic faction scaffold.

**Recommended action:**
- [ ] Populate the existing article from the source.
- [ ] Keep the first migration pass at nation level unless a named organisation, belief, profession or location clearly needs independent reuse.

**Priority:** Very high.

---

## 18. Khoshut Khanate

**Status:** STUB.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Khoshut Khanate/Khoshut Khanate.md`

**Current vault state:**
Generic faction scaffold.

**Recommended action:**
- [ ] Populate the existing article from the source.
- [ ] Avoid prematurely splitting clan, military or cultural material into separate pages until the nation article establishes the core identity.

**Priority:** Very high.

---

## 19. Zărava Voivodeships

**Status:** STUB.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/The Zărava Voivodeships/Zărava Voivodeships.md`

**Current vault state:**
Generic faction scaffold.

**Recommended action:**
- [ ] Populate the existing article from the source.
- [ ] Decide whether the canonical title includes `The` before normalising folder/title/file naming.
- [ ] Keep any voivode-level political structure in the nation article until individual constituent polities become independently useful.

**Priority:** Very high.

---

# Distinctive named-concept audit

These concepts were explicitly checked during the source/vault comparison and were not found as developed current entries unless noted below.

## Þrumuxi

**Status:** MISSING + TYPE DECISION.

No matching current vault entity was found.

**Migration action:**
- [ ] Re-read the source context before creating a page.
- [ ] Determine whether this is a people/culture, polity, organisation, title, species or other entity.
- [ ] Place it under the correct CITADEL namespace only after the type is explicit.

Do not guess the entity type from the name alone.

## The Rein

**Status:** MISSING + TYPE DECISION.

No matching current vault entity was found.

**Migration action:**
- [ ] Determine from source context whether this is an organisation, institution, doctrine, formation, event, location or something else.
- [ ] Keep it embedded in its parent nation article until it proves independently reusable if the source does not require its own page.

## Grain Riots

**Status:** MISSING.

No dedicated current entry was found.

**Likely destination if the source treats this as a discrete historical event:**
`Vault/Lore/Eras/CITADEL/Events/Grain Riots.md`

**Migration action:**
- [ ] First establish the event in the relevant nation article/history.
- [ ] Create a dedicated event page only if it affects several entities, has a meaningful chronology, or is referenced repeatedly.

## Vihakult

**Status:** MISSING + TYPE DECISION.

No matching current entity was found.

**Migration action:**
- [ ] Use the source to decide whether this is a religion, cult, sect, organisation, ritual tradition or cultural term.
- [ ] Do not force it into `Organisations` merely because the name sounds institutional.

## Crimson Novena

**Status:** MISSING + TYPE DECISION.

No matching current entity was found.

**Migration action:**
- [ ] Confirm whether the source presents it as an organisation, religious order, ritual cycle, movement or other entity.
- [ ] Link it to the appropriate parent nation when migrated.

## Dairakh

**Status:** MISSING + TYPE DECISION.

No matching current entity was found.

**Migration action:**
- [ ] Determine entity type from the source before creating a destination.
- [ ] Avoid inventing a standalone page if the term only needs to exist as a national/cultural concept.

## Bál-Seiðr / Bal-Seidr

**Status:** STUB + NAME NORMALISATION.

**Current destination:**
`Vault/Lore/Eras/CITADEL/Nations/Krass Dominion/Professions/Bal-Seidr.md`

**Current vault state:**
The profession page is a drafting scaffold.

**Source material specifically identified as absent:**
The newer funeral-role material.

**Migration action:**
- [ ] Populate the existing page from the source.
- [ ] Decide whether the canonical spelling should use `Bál-Seiðr` and rename the page/link targets accordingly.
- [ ] Keep Krass-specific practice here; only generalise it if the source establishes use outside Krass society.

## Harmonic Stallium

**Status:** MISSING as an independently developed current entity.

**Parent destination for first-pass migration:**
`Vault/Lore/Eras/CITADEL/Nations/Verazemia/Verazemia.md`

**Migration action:**
- [ ] Establish the concept in Verazemia first.
- [ ] Create a dedicated item/material/religious entity only if its independent relationships justify one.

---

# Naming and structural blockers

Resolve these before creating new nation pages:

1. **Udumaa ↔ Uduma**
2. **Ampelotír ↔ Ampelotiri**
3. **Zoryavia ↔ Zoravye** and the obsolete `{POLAND}` folder marker
4. **Bál-Seiðr ↔ Bal-Seidr**
5. **Zărava Voivodeships ↔ The Zărava Voivodeships**
6. `[Sami]`, `[Finland]`, `[Germany]` — development inspiration labels, not acceptable final canon names
7. Confirm whether **Kingdom of the Isles** is a final polity name or still a working label

The rule should be: **rename/move existing entities; do not create aliases as duplicate nation articles.** Redirects or aliases can be added later if the site needs them.

---

# Recommended migration order

## Phase 0 — Canonical names

- [ ] Resolve Uduma/Udumaa.
- [ ] Resolve Ampelotiri/Ampelotír.
- [ ] Resolve Zoravye/Zoryavia and remove `{POLAND}` from the final path.
- [ ] Resolve Bál-Seiðr spelling.
- [ ] Choose in-world names for the `[Sami]`, `[Finland]` and `[Germany]` placeholders.
- [ ] Confirm Kingdom of the Isles as final or working title.

## Phase 1 — Fill existing empty homes

These are the cheapest, safest migrations because the vault already has the intended entity:

- [ ] Verazemia
- [ ] Uduma/Udumaa
- [ ] Ampelotiri/Ampelotír
- [ ] Zoravye/Zoryavia
- [ ] Angliath
- [ ] Alba
- [ ] Uainetír
- [ ] Dar al-Damm
- [ ] Khoshut Khanate
- [ ] Zărava Voivodeships
- [ ] Bal-Seidr/Bál-Seiðr

## Phase 2 — Reconcile substantive legacy articles

- [ ] Krass Dominion
- [ ] Kingdom of Satol
- [ ] Republic of Askalia

For each, preserve useful old facts, identify contradictions explicitly, then modernise the prose and metadata.

## Phase 3 — Create genuinely missing nation hubs

- [ ] The Skarnborn Clans
- [ ] Kingdom of the Isles, if confirmed
- [ ] canonical successor to `[Sami]`
- [ ] canonical successor to `[Finland]`
- [ ] canonical successor to `[Germany]`

## Phase 4 — Selective Okse reconciliation

- [ ] Compare the source against the modern Okse article.
- [ ] Migrate only genuinely new compatible facts.
- [ ] Do not downgrade the current article into source-summary prose.

## Phase 5 — Extract reusable secondary entities

Only after the nation articles are coherent:

- [ ] Þrumuxi — after type decision
- [ ] The Rein — after type decision
- [ ] Grain Riots — if event-page threshold is met
- [ ] Vihakult — after type decision
- [ ] Crimson Novena — after type decision
- [ ] Dairakh — after type decision
- [ ] Harmonic Stallium — if independent entity threshold is met

---

# Contradiction handling rule

During migration, use this order:

1. **Current deliberately rewritten vault canon** beats an older imported version unless the source explicitly represents a newer creator decision.
2. **New source decisions** should be integrated where they clearly supersede a stub or undeveloped placeholder.
3. **Legacy prose with useful unique facts** should be preserved unless contradicted.
4. **Contradictions should be recorded**, not silently reconciled by guessing.
5. **Development placeholders are not canon names.**

A source statement and a vault statement can both be retained in the audit until a deliberate canon choice is made.

---

# Definition of migration-complete for one nation

A nation should only leave this backlog when:

- the canonical name/path is settled;
- the source's nation-level facts have been reviewed against existing material;
- useful non-conflicting facts are integrated;
- contradictions are either resolved or explicitly tracked;
- obvious placeholder prompts are removed;
- supporting entities are linked where they actually exist;
- no duplicate nation article was created to solve a naming mismatch;
- metadata reflects the real development/publication state rather than import history.

This does **not** require the nation to be "finished" worldbuilding. It only means the source brief has been deliberately reconciled with the vault rather than remaining a parallel body of lore.