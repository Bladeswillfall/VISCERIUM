# Documentation Writing Standard

> **Use this standard when:** You write VISCERIUM operational documentation.
>
> **Result:** A reader can find, complete, and check a task without guessing.
>
> **First action:** Decide whether the text gives instructions or reference information.

Operational documentation includes SOPs, workflow guides, checklists, worksheets, architecture notes, references, and help.

## Reference

VISCERIUM uses an **ASD-STE100-based house style** for technical documentation.

The primary reference is **ASD-STE100 Simplified Technical English, Issue 9, 15 January 2025**.

Official source: <https://www.asd-ste100.org/>

The cognitive-accessibility structure follows W3C guidance for clear steps, labels, and page structure.

W3C source: <https://www.w3.org/WAI/cognitive/>

This repository does not claim formal ASD-STE100 compliance.

Formal compliance requires the complete standard, its controlled dictionary, and trained editorial judgement.

## Purpose

Make each instruction easy to find and complete.

Make each result easy to check.

Reduce the working memory that a procedure requires.

Use one term for one concept.

## Reader support rules

Use these rules in all operational documents:

1. Put the task trigger, result, and first action near the start.
2. Put the normal route before alternatives and troubleshooting.
3. Separate each instruction into one numbered step.
4. Use clear headings to divide long procedures into phases.
5. Put a result check after a long or error-prone phase.

When a procedure has more than five actions, divide it into named phases.

Keep each phase focused on one result.

Repeat an important choice at its point of use when it first appears in an earlier section.

Mark optional sections with **Optional** or a clear condition.

Give a duration only when the estimate is reliable.

Do not use vague duration statements such as “this takes a while.”

> **Why:** Short phases help a reader resume work after an interruption.

## Why notes

Use a `Why` note only when the reason prevents an error or explains a non-obvious action.

Put the note immediately after the related step.

Keep the note to 25 words or fewer.

Use this format:

> **Why:** Vault Doctor finds structural conflicts that visual review can miss.

A `Why` note gives information only.

Do not put an instruction, requirement, or limit in a `Why` note.

Do not explain an obvious action.

## Technical terms

Project-specific names are technical terms.

Keep their official spelling.

Examples include:

- Obsidian
- Base and Bases
- Templater
- Dataview
- StoryLine
- Telescope
- VISCERIUM Creator Tools
- VISCERIUM Timelines
- Git
- GitHub
- Astro
- Starlight
- Node.js
- npm
- Cloudflare Pages
- Vault Doctor
- World Anvil

Do not replace an official command name with a synonym.

## Procedure rules

Use these rules for numbered work steps:

1. Write one instruction in each sentence.
2. Start each instruction with an action verb.
3. Use the imperative form.
4. Use 20 words or fewer in each procedural sentence.
5. Put a required condition before the action.

Also apply these rules:

- Use notes for information only.
- Give the exact menu path, command name, or file path when it helps the reader.
- State the expected result after each procedure.
- Keep warnings and limits outside `Why` notes.
- Keep alternatives outside the normal action sequence.

Example:

> Open **Settings → Templater → File creation**.

Do not write:

> You will want to go into the Templater settings and make sure file creation is enabled before continuing.

## Descriptive rules

Use these rules for explanations and reference text:

1. Give information gradually.
2. Use 25 words or fewer in each descriptive sentence.
3. Keep one main topic in each paragraph.
4. Keep each paragraph to six sentences or fewer.
5. Prefer active voice.

Also apply these rules:

- Use one term for one concept.
- Define an abbreviation before repeated use.
- Keep a familiar abbreviation when the interface uses it.
- Remove filler words.
- Use literal language.

## VISCERIUM terminology rules

Use **note** for a Markdown source note.

Use **article** for the reader-facing Codex article when that distinction matters.

Use **Base** for an Obsidian Base file or view.

Use **property** for note frontmatter that Obsidian exposes as a property.

Use **field** only for a form input, schema field, or generated data field.

Use **era edition** for one independent historical version of a continuity entity.

Use **continuity family** for notes that share one `entity_id`.

Use **Universal** only for the controlled era-independent scope.

Use **published** for `status: published`.

Use **SOP** for a repeatable procedure.

Use **checklist** for an observable readiness test.

Use **worksheet** for optional development or stress-testing work.

Use **estimate** for a calculated planning result that is not yet canon.

Use **research baseline** for an external historical, material, or practical starting point.

Do not use **canon**, **public**, and **published** as interchangeable status values.

## UI and command format

Write menu labels in bold.

Example: **Settings → Templater → File creation**

Write file paths, properties, values, and commands as code.

Example: `Vault/Lore/Eras/CITADEL/`

Example: `npm run doctor:vault`

Write exact Obsidian command names in bold.

Example: **VISCERIUM Creator Tools: Set controlled era / Universal scope**

## Operational document identifiers

Assign every operational SOP one permanent identifier in the form `SOP-###`.

Do not change an identifier when the title, folder, or sequence changes.

Do not renumber documents to close a gap.

Use these related identifiers:

- `CHK-###a`, `CHK-###b`, and later letters for checklists;
- `WKS-###-01`, `WKS-###-02`, and later numbers for worksheets;
- `SRC-###` for external source records.

New SOP filenames use `### - Title SOP.md`.

New checklist filenames use `###a - Title Checklist.md`.

New worksheet filenames use `###-W01 - Title Worksheet.md`.

Retain an established compatibility filename when renaming it would create a disproportionate link, script, or architecture migration.

Record the permanent identifier in frontmatter and in [[SOP Index]].

## Document roles

### SOP

An SOP explains how to complete repeatable work.

It owns the procedure, checks, limits, and stop condition.

### Checklist

A checklist tests observable results.

Do not copy the SOP procedure into checklist form.

Separate required checks from conditional checks.

Allow **Not applicable** only when the reviewer records a reason.

### Worksheet

A worksheet develops, calculates, or stress-tests material.

Do not make a worksheet a publication requirement unless the parent SOP states the condition.

Do not treat a completed worksheet as canon.

Transfer adopted decisions to the authoritative note.

### Reference

A reference records terminology, commands, evidence, or source provenance.

Do not hide procedural requirements inside a reference-only document.

## Readiness levels

Use **Publication ready** when the article serves its intended public purpose.

Use **Reference ready** when a story, sourcebook, collaborator, or continuity decision needs deeper system support.

Do not require reference readiness for every published article.

Record blocking findings separately from useful future development.

## SOP structure

Use this structure when it applies:

1. **Opening block:** State the trigger, result, and first action.
2. **Purpose:** State the operational goal.
3. **Before you start:** State required tools, files, and decisions.
4. **Choose a route:** Direct the reader when more than one route exists.
5. **Procedure:** Give numbered actions in short, named phases.

Complete the structure with these sections:

- **Verification checklist:** Link the applicable checklist when one exists.
- **Check the result:** State what must be true.
- **Stop condition:** State when no more work is required.
- **Troubleshooting:** Give common failures and direct fixes.

## Checklist structure

Use this structure when it applies:

1. Add `document_type`, `checklist_id`, `parent_sop`, and `readiness_level` to frontmatter.
2. Link to the parent SOP near the start.
3. Group checks by observable outcome.
4. Add a final readiness decision.
5. Keep reusable master checklists unchecked.

Store durable completion records in the article task list, audit note, or project note.

## Worksheet structure

Add these properties to worksheet frontmatter:

- `document_type: worksheet`
- `worksheet_id`
- `parent_sop`
- `contributors`
- `sources`

End every worksheet with these sections:

1. **Completion record**
2. **Assumptions and confidence**
3. **Departures from the research baseline**
4. **Sources and adaptation notes**
5. **Original VISCERIUM additions**

A calculation worksheet must label its model status.

A calculation worksheet must show formulas, units, assumptions, and sequential losses where applicable.

## Source attribution

Record an external source when it materially affects:

- structure;
- prompts;
- terminology;
- assumptions;
- calculations;
- historical context;
- process;
- visual vocabulary.

Use [[System/References/Research Source Register|Research Source Register]] for source IDs and evidence roles.

State how the source was used.

Use one or more of these usage types:

- `inspiration`
- `visual-reference`
- `process-reference`
- `historical-reference`
- `research-lead`
- `adapted-framework`
- `adapted-heuristic`
- `adapted-calculation`

State the evidence role when a reader could mistake the source for authority.

For community discussions, cite the specific answer and author when practicable.

For a research lead, follow and cite stronger underlying evidence when practicable.

For a visual source, record the feature used and the original creator when known.

Record incomplete attribution instead of guessing.

## Calculation provenance

Cite a borrowed value, range, ratio, formula, or sequence beside the calculation that depends on it.

Record every changed assumption.

Do not present a model output as measured fact.

Use ranges, rounded values, or qualitative bands when precision is unsupported.

Keep incompatible source assumptions separate.

Do not create a false average only to obtain one answer.

## Adaptation and permission

Explain what came from the source.

Explain what VISCERIUM changed.

Explain what VISCERIUM added.

Record the consequence of the departure.

Attribution records provenance.

Attribution does not grant permission to reproduce protected text, tables, worksheets, artwork, or media.

Paraphrase, reorganise, and substantially adapt external frameworks.

## Contributor records

Record the person who adapted the worksheet.

Record the person who completed it.

Record the reviewer when the decision needs review.

Record the date, project, assumptions, confidence, and canon destination.

Do not imply sole authorship when several contributors or external frameworks shaped the document.

## Writing check

### Check the structure

1. Confirm that the opening block states the result and first action.
2. Confirm that the normal route appears before alternatives.
3. Split each action list that is too difficult to scan.
4. Confirm that each procedure has a visible result check.
5. Confirm that each operational relationship links in both directions where practical.

### Check the language

1. Read each numbered step as a command.
2. Split a sentence that contains two independent instructions.
3. Replace a vague pronoun when its subject is not clear.
4. Replace a synonym with the project-standard term.
5. Remove optional detail that interrupts the action sequence.

### Check the facts

1. Confirm each command name against the current interface.
2. Confirm each path against the current repository.
3. Confirm that each `Why` note contains information only.
4. Confirm that the rewrite does not change the technical meaning.
5. Confirm that calculations expose assumptions and provenance.
6. Confirm that attribution does not overstate evidence or permission.

## Scope

Apply this house style to operational documentation.

Do not apply it to fictional writing, in-world documents, dialogue, or creative Lore.

Apply it to creative Lore only when that writing requires technical language.
