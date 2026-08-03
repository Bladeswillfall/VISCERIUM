# Storyteller View SOP

> **Use this SOP when:** You add practical scene, encounter, location or story guidance to a Lore article.
>
> **Result:** Storyteller material remains normal Markdown in Obsidian and appears as the article's Storyteller view on the public Codex.
>
> **First action:** Open the canonical note and scroll to its marked Storyteller footer.

Follow [[Documentation Writing Standard]] for operational wording.

## Purpose

Keep Lore and Storyteller content separate without forcing story guidance into frontmatter.

Lore explains what a subject is.

Storyteller explains how a creator can use the subject in a scene, encounter, journey, location or plot.

The Storyteller section supports the same Markdown as the rest of the article, including:

- headings and foldable subsections;
- tables and lists;
- wikilinks and ordinary links;
- images and embeds;
- callouts, quotations and layout shortcodes supported by the Codex.

## Required boundaries

Every article template ends with these stable machine-readable markers:

```markdown
<!-- viscerium:storyteller:start -->

## Storyteller View

<!-- viscerium:storyteller:end -->
```

Write Storyteller content between the markers.

Do not rename, duplicate, reorder or partially delete the markers.

The visible `## Storyteller View` heading may be folded in Obsidian. The public build identifies the section by its invisible markers, not by the visible heading text.

## Add the section to an older note

1. Place the cursor at the end of the article.
2. Run **Templater: Insert template**.
3. Select `Add Storyteller Fields`.
4. Confirm that one marked Storyteller section now exists.

The retained template filename avoids breaking existing links and habits; it now inserts a Markdown section rather than properties.

## Decide whether to add Storyteller content

Add content when it answers a practical encounter question:

- Where and when can the subject appear?
- How can characters notice or identify it?
- What does it do when encountered or used?
- What limits, counters or consequences matter?

Add content when it answers a story question:

- Why do people care about it?
- What choice, pressure or problem can it create?
- Which confirmed relationships make it useful in a story?
- What would an outsider, local, professional or informed observer know?

Keep encyclopaedic explanation in Lore.

Omit material that provides no practical story use.

## Structure the section

Use headings that fit the subject and the material actually available.

Examples include:

| Subject | Useful headings |
| --- | --- |
| Fauna | Signs of presence; Encounter behaviour; Why people care |
| Flora | Identification; Growth conditions; Uses; Hazards |
| Fungi | Fruiting and spread; Exposure risks; Practical value |
| Items | Use; Limitations; Availability; Common users |
| Myrkild units | Signs; Tactics; Counterplay; Consequences beyond combat |
| Locations | Approach; First impression; Reasons to visit; Local knowledge; Current tensions |
| Factions | Recognisable presence; Current agenda; Preferred methods; Reach and limits; Internal tensions |

These are prompts, not a schema. Rename, reorder, combine or omit them whenever another structure communicates the material better.

## Protect the source meaning

1. Confirm that every world fact already exists in Lore or another canonical source.
2. Do not infer negative canon from an absent fact.
3. Do not add connective text that changes the source meaning.
4. Keep creator-only secrets in `Vault/Private` unless the public Storyteller view is intended to reveal them.
5. Do not duplicate Lore merely to make the Storyteller section look complete.

When Lore and Storyteller content disagree, decide which statement is canonical and correct the other. Do not preserve two conflicting versions.

## Rules-system content

Keep shared Storyteller material fiction-first and system-agnostic.

Useful example:

> Dangerous to an isolated armed traveller, but reluctant to confront an organised group.

Do not put game-system statistics into the shared Storyteller section. A future system adapter can add statistics on top of canon.

## Public behaviour

Published notes keep Lore as the default view.

The Lore / Storyteller switch appears only when the marked section contains material beyond its `Storyteller View` heading.

The public build removes an empty marked section from the rendered Lore article.

Storyteller mode uses the same route, article chrome, sidebar and Markdown rendering as Lore.

Do not generate Storyteller content automatically from ordinary Lore text.

## Check the result

1. Confirm that the note contains exactly one start marker and one end marker.
2. Confirm that the start marker appears before the end marker.
3. Confirm that all Storyteller content sits between them.
4. Confirm that the section renders correctly in Obsidian.
5. Confirm that Storyteller text does not contradict Lore.
6. Confirm that each visible subsection gives practical story use.
7. Run `cd Site && npm run build` after a structural Storyteller change.
8. Open the affected public page after a presentation change.

Malformed or duplicated markers fail the public content build rather than silently publishing a broken view.

## Publication threshold

Do not wait for a complete set of headings.

Publish the useful, accurate material that exists and omit the rest.

A short accurate section is better than a long padded one.

## Stop condition

Stop when the Storyteller section gives practical guidance without inventing detail or duplicating Lore.
