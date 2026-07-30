# Documentation Writing Standard

> **Use this standard when:** You write VISCERIUM operational documentation.
>
> **Result:** A reader can find, complete, and check a task without guessing.
>
> **First action:** Decide whether the text gives instructions or reference information.

Operational documentation includes SOPs, workflow guides, architecture notes, and help.

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

Do not use **canon**, **public**, and **published** as interchangeable status values.

## UI and command format

Write menu labels in bold.

Example: **Settings → Templater → File creation**

Write file paths, properties, values, and commands as code.

Example: `Vault/Lore/Eras/CITADEL/`

Example: `npm run doctor:vault`

Write exact Obsidian command names in bold.

Example: **VISCERIUM Creator Tools: Set controlled era / Universal scope**

## SOP structure

Use this structure when it applies:

1. **Opening block:** State the trigger, result, and first action.
2. **Purpose:** State the operational goal.
3. **Before you start:** State required tools, files, and decisions.
4. **Choose a route:** Direct the reader when more than one route exists.
5. **Procedure:** Give numbered actions in short, named phases.

Complete the structure with these sections:

- **Check the result:** State what must be true.
- **Stop condition:** State when no more work is required.
- **Troubleshooting:** Give common failures and direct fixes.

## Writing check

### Check the structure

1. Confirm that the opening block states the result and first action.
2. Confirm that the normal route appears before alternatives.
3. Split each action list that is too difficult to scan.
4. Confirm that each procedure has a visible result check.

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

## Scope

Apply this house style to operational documentation.

Do not apply it to fictional writing, in-world documents, dialogue, or creative Lore.

Apply it to creative Lore only when that writing requires technical language.
