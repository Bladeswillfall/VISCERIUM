---
document_type: sop
sop_id: SOP-002
checklists:
  - CHK-002a
---
# Entity Authoring SOP

> **Use this SOP when:** You add content to fauna, flora, fungi, items, or similar structured records.
>
> **Result:** The subject has enough information for consistent creative use.
>
> **First action:** Open the existing note for the subject.

Follow [[Documentation Writing Standard]] for operational wording.

## Purpose

Identify, place, and use a subject without adding unnecessary detail.

Do not fill optional properties only to make a note look complete.

## Core rule

> **Stop when you can use the subject.**

A usable entry supports these tasks:

- Identify the subject.
- Distinguish it from an assumed Earth equivalent.
- Place it in a plausible era and context.
- Explain its importance when that fact is useful.
- Use it consistently in a scene.

## Before you start

1. Confirm that the subject needs its own note.
2. Open an existing note when it describes the same subject.
3. If no note exists, follow [[Story Entity Workflow SOP]].

> **Why:** Reusing one source note prevents duplicate or conflicting facts.

## Procedure

### 1. Write the identity

1. Write one sentence that identifies the subject.
2. Add the feature that makes the subject distinctive.
3. Add one established setting consequence when it is useful.

Weak example:

> A deer-like animal found in forests.

Useful example:

> A heavy forest browser uses its keratin crown to strip fungal bark from old trees.

The useful example gives a visible distinction and an ecological function.

### 2. Set the placement

1. Add only established eras, locations, and biomes.
2. Leave an unknown property absent.
3. Use **VISCERIUM Creator Tools: Set controlled era / Universal scope** for scalar era values.
4. If the subject changes by era, follow [[Era Edition Workflow SOP]].

> **Why:** An absent property means “not established.” A false value means an established negative fact.

Do not use `false` or `none` to mean “not decided.”

### 3. Add useful modules

1. Identify the current authoring question.
2. Add only the module that answers that question.
3. Stop when another module does not help a current decision.

| Module | Use it when |
| --- | --- |
| **Encounter or identification** | Characters can find, track, handle, or recognise the subject. |
| **Ecology** | Ecological relationships affect placement or consequences. |
| **People or practical use** | Ordinary life, trade, survival, or conflict uses the subject. |
| **Culture** | A specific culture has a meaningful belief or practice about the subject. |
| **Story seed** | The subject can create a complication, choice, or consequence. |

> **Why:** Optional modules keep rare questions out of every new note.

### 4. Record distinctive facts

1. Record a fact when it changes placement, behaviour, consequence, or meaning.
2. Omit an ordinary default when the expected assumption is accurate.
3. Prefer a useful constraint to an exhaustive measurement.

Useful facts include:

- An unusual winter carrion diet.
- Spores that reveal an old Resonant battlefield.
- A material shortage that makes an item politically important.

Usually omit biological or manufacturing detail that changes no creator decision.

### 5. Add meaningful links

1. Link an existing note when the relationship helps navigation or consequence tracing.
2. Use body text or `related:` for an ordinary contextual reference.
3. Use `relationships:` only when the relationship itself is important.
4. Follow [[Relationship Authoring SOP]] for structured relationships.

Examples include:

- Consumed by `[[Species]]`.
- Harvested for `[[Material]]`.
- Common in `[[Location]]`.
- Sacred to `[[Culture or faction]]`.

> **Why:** Selective structured links keep the relationship explorer useful.

### 6. Set the development level

| Level | Use it when |
| --- | --- |
| `stub` | You can name, recognise, and roughly place the subject. |
| `usable` | You can use the subject without inventing its defining behaviour. |
| `developed` | Repeated use or narrative importance justifies deeper structure. |

Do not use the number of properties to set the development level.

## Verification checklist

Use [[Checklists/002a - Entity Article Publication Checklist|Entity Article Publication Checklist]] when the note is being considered for publication.

## Check the result

Confirm these statements:

1. I can identify the subject quickly.
2. I can place it without inventing a foundational fact.
3. I can use it consistently in a scene.
4. Each structured property helps a real decision.
5. The note does not document ordinary defaults.

After broad structural edits, run `cd Site && npm run doctor:vault`.

## Stop condition

Stop when the subject is useful for the current creative work.

Do not continue only because optional properties remain empty.

## Troubleshooting

### The note looks incomplete because properties are empty

Leave optional properties absent until they become useful.

### I want to add a new shared property

Stop this procedure.

Follow [[Schema Change SOP]] before you add shared structure.

### The subject changes significantly by era

Stop this procedure.

Follow [[Era Edition Workflow SOP]] for separate reader-facing historical states.
