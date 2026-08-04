---
document_type: sop
sop_id: SOP-007
---
# Schema Change SOP

> **Use this SOP when:** You add, change, or remove shared creator structure.
>
> **Result:** The smallest useful structure works through every supported workflow.
>
> **First action:** Write the creator decision that the proposed structure must support.

Follow [[Documentation Writing Standard]] for operational wording.

## Purpose

Keep the creator system small, clear, and inexpensive to maintain.

Use body text when structured data gives no repeated benefit.

## Use this procedure when

Use this procedure for these data changes:

- Add a shared property.
- Rename or remove a shared property.
- Add a recurring Base column.
- Change a controlled value.

Use this procedure for these workflow changes:

- Expand a creator template.
- Change a structural validation rule.

## Before you start

1. Write the creator decision that the structure must support.
2. Find three real VISCERIUM notes that can test the proposal.
3. Open the current templates, Bases, and validators that use similar data.

> **Why:** Real notes reveal maintenance costs that hypothetical examples can hide.

## Decide whether the property belongs in the schema

### 1. Apply the decision test

1. Confirm that the property helps a creator place, distinguish, use, compare, or review a subject.
2. Reject the property when it only makes a note look more complete.

### 2. Apply the recurrence test

1. Confirm that the question applies usefully to several subjects.
2. Keep exceptional information in body text when it applies to one subject.

### 3. Apply the structure test

1. Confirm that filtering, grouping, sorting, validation, or public generation benefits from structured data.
2. Use body text when no system needs a structured value.

### 4. Apply the duplication test

1. Search the current schema for the same fact.
2. Reject a new property that duplicates an existing property.

### 5. Apply the maintenance test

1. Identify how a creator will notice a stale value.
2. Reject the property when stale values are hard to detect and provide little value.

### Check the decision

Approve the proposal only when it passes all five tests.

## Test the proposal

### Test real content

1. Test the property against three real notes.
2. Use subjects with different importance or form.
3. Write the values that you would store.
4. Confirm that the values improve one repeated workflow.

### Test pipeline behaviour

1. Use Demo notes only for pipeline tests.
2. Test real canon before you make the property a normal authoring field.

Do not approve a shared property from hypothetical examples only.

## Field budget

Keep the common new-note core small.

Use approximately five to eight common properties as design pressure, not a hard limit.

Put specialist questions behind optional Templater modules.

Allow complex subjects to use more structure when it supports real decisions.

## Implement an approved property

### Update authoring sources

1. Update the authoritative schema or template source.
2. Update every creator workflow that can write the property.
3. Update the relevant Base when creators must compare or edit the value.
4. Keep card views compact unless the property is important for browsing.

### Update validation and output

1. Update Vault Doctor when the property creates an objective structural rule.
2. Update the public content schema when the website must receive the property.
3. Update site generation when the property changes generated output.

### Update documentation

1. Update the applicable SOP when creator behaviour changes.
2. Update [[Creator Command Reference]] when a command changes.
3. Update architecture documentation when a workflow or system boundary changes.

> **Why:** A schema change fails when one supported route writes, reads, or validates the old structure.

## Naming rules

Use one clear property name for one concept.

Prefer reusable names such as `signs_of_presence` or `human_relevance`.

Use a type-specific name when a generic name hides the meaning.

Keep shared canon properties system-agnostic.

Do not use rules-system terms such as armour class or hit points in shared canon structure.

## Absent, blank, and false values

Use an absent property when the fact is not established or not useful.

Use a blank or null value only when the reserved property has meaning.

Use `false` or `none` only when absence is an established canonical fact.

Do not use `false` to clear a checklist.

## Change or remove an existing property

### Find every dependency

1. Search the vault for current uses.
2. Search templates for current writes.
3. Search Bases and Dataview scripts for current reads.
4. Search Vault Doctor and site code for validation or generation.

### Plan the change

1. Decide whether existing notes need migration or compatibility support.
2. Update all affected workflow documentation.

### Test the change

1. Test one existing note.
2. Test one newly created note.
3. Run `cd Site && npm run doctor:vault`.
4. Run the narrowest relevant unit tests.
5. Run `cd Site && npm test` before a normal cross-system merge.

## Removal rule

Remove shared structure when it repeatedly remains empty or duplicates body text.

Remove it when it provides no useful filtering, validation, or generation.

Remove it when creators invent low-value facts only to fill the property.

Deleting poor structure is maintenance.

## Check the result

### Check the data

- One property has one clear meaning.
- Current notes have a migration plan when required.
- Validation matches the intended rule.

### Check the workflows

- All supported authoring routes understand the property.
- Public generation receives the value only when required.
- Documentation describes the current workflow.

## Stop condition

Stop when the smallest useful structure supports the repeated creator decision.

Do not add another property until a real use proves that you need it.
