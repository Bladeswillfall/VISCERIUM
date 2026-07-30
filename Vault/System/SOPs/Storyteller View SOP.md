# Storyteller View SOP

> **Use this SOP when:** You decide what becomes public Storyteller content.
>
> **Result:** The Storyteller view gives practical story guidance without changing Lore.
>
> **First action:** Open the canonical note.

Follow [[Documentation Writing Standard]] for operational wording.

## Purpose

Keep Lore and Storyteller content separate but consistent.

Lore explains what a subject is.

Storyteller explains how a creator can use the subject in a scene, encounter, or location.

It also explains how the subject can create a complication.

An Obsidian Base card is an authoring view, not a public Storyteller view.

## Before you start

1. Open the canonical note.
2. Confirm that each world fact exists in Lore or canonical source properties.
3. Identify the practical question that the Storyteller field must answer.

## Decide whether to add Storyteller data

Add Storyteller data when it answers an encounter question:

- Where and when can the subject appear?
- How can characters notice or identify it?
- What does it do when encountered or used?

Add Storyteller data when it answers a story question:

- Why do people care about it?
- What consequence, choice, or problem can it create?
- Which confirmed setting relationship connects to it?

Keep encyclopaedic detail in Lore.

Omit a fact when it provides no practical story use.

> **Why:** The admission test prevents a second, shorter copy of the Lore article.

## Add or edit Storyteller data

### Select the modules

1. Open the note.
2. Press **Ctrl/Cmd + P**.
3. Run **Templater: Insert template**.
4. Select `Add Storyteller Fields`.
5. Select only the modules that you need.

### Resolve each prompt

| Goal | Action |
| --- | --- |
| Replace a free-text value | Edit the pre-filled value. |
| Remove a free-text value | Submit a blank value. |
| Keep a free-text value | Cancel the prompt. |
| Keep or remove a controlled value | Select **Keep current** or **Clear value**. |

Clearing a property removes it from the note.

Unselected modules remain unchanged.

## Generation rules

### Protect the source meaning

1. Treat note properties as source data, not finished public text.
2. Do not infer negative canon from an absent property.
3. Do not add connective text that changes the source meaning.
4. Hide creator-only fields and internal IDs.

### Build the public view

1. Hide absent properties.
2. Use natural reader-facing headings.
3. Combine related values only when their meaning remains accurate.

The generated nested `storyteller` object is a site output.

Do not author that generated object manually.

## Public behaviour

Published notes keep Lore as the default view.

Show the **Lore / Storyteller** switch only when supported Storyteller source properties exist.

Storyteller mode uses the same article route and sidebar.

Hide the Lore table of contents while Storyteller content is visible.

Do not generate Storyteller content automatically from ordinary Lore text.

## Type-specific language

Use headings that match the subject type.

| Type | Example headings |
| --- | --- |
| Fauna | **Signs of presence**, **Encounter behaviour**, **Why people care** |
| Flora | **Identification**, **Growth conditions**, **Use**, **Hazards** |
| Fungi | **Fruiting and spread**, **Exposure risks**, **Practical value** |
| Items | **Use**, **Limitations**, **Availability**, **Common users** |
| Myrkild units | **Signs**, **Tactics**, **Counterplay**, **Consequences beyond combat** |
| Locations | **Approach**, **First impression**, **Why people come**, **Local knowledge**, **Local tensions** |
| Factions | **Recognisable presence**, **Current agenda**, **Preferred methods**, **Reach and limits**, **Internal tensions** |

Do not force every subject type through identical headings.

## Keep world facts and Storyteller facts separate

World properties describe what is true.

Storyteller properties describe how that truth becomes useful in a story.

Example:

`economic_role` can record that a town depends on ironworking.

`why_people_come` can explain that travellers arrive to commission durable armour.

Do not duplicate one sentence across both layers only to fill fields.

## Rules-system content

Keep shared Storyteller output fiction-first and system-agnostic.

Useful example:

> Dangerous to an isolated armed traveller, but reluctant to confront an organised group.

Do not put game-system statistics into the shared Storyteller layer.

A future system adapter can add those statistics on top of canon.

## Check the result

1. Confirm that Storyteller text does not contradict Lore.
2. Confirm that each visible section gives a practical story use.
3. Confirm that absent fields do not create empty public headings.
4. Run `cd Site && npm run build` after a structural Storyteller change.
5. Open the affected public page after a presentation change.

When Lore and Storyteller data disagree, decide which value is canonical.

Correct the other value.

Do not preserve two conflicting versions.

## Publication threshold

Do not wait for every supported Storyteller field.

Publish the useful, accurate sections that exist.

Hide the rest.

## Stop condition

Stop when the Storyteller view gives practical guidance without inventing detail.

A short accurate panel is better than a long padded panel.
