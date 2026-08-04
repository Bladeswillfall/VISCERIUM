# Standard Operating Procedures

> **Next action:** Find your task in the table, then open the matching SOP.
>
> **Result:** You use the correct workflow and know when to stop.

All operational documents use [[Documentation Writing Standard|the VISCERIUM ASD-STE100-based house style]].

## Document identifiers

Each operational SOP has one permanent identifier in the form `SOP-###`.

The identifier does not change when the document title, folder, or sequence changes.

Existing SOP filenames remain unchanged in this migration PR so current links, scripts, and architecture references continue to resolve. New SOPs use the numbered filename format `### - Title SOP.md`.

Related documents inherit the SOP number:

- `###a`, `###b`, and later letters identify checklists.
- `###-W01`, `###-W02`, and later numbers identify worksheets.

Do not renumber an existing SOP to close a gap.

## Find your task

| ID | Task | Use this SOP |
| --- | --- | --- |
| `SOP-001` | Process, triage, or file World Anvil imports | [[World Anvil Migration SOP]] |
| `SOP-002` | Create or revise fauna, flora, fungi, items, or similar records | [[Entity Authoring SOP]] |
| `SOP-003` | Create and file a Story Entity in Obsidian | [[Story Entity Workflow SOP]] |
| `SOP-004` | Edit dates, status, type, images, tags, or relationship frontmatter | [[Frontmatter Authoring Workflow]] |
| `SOP-005` | Place, size, wrap, or contour an image inside article prose or columns | [[Article Image Layout]] |
| `SOP-006` | Split one continuing subject into separate historical versions | [[Era Edition Workflow SOP]] |
| `SOP-007` | Add or change shared properties, templates, or Base columns | [[Schema Change SOP]] |
| `SOP-008` | Add structured semantic relationships | [[Relationship Authoring SOP]] |
| `SOP-009` | Add or place material on the public Atlas | [[Atlas Authoring SOP]] |
| `SOP-010` | Decide what becomes public Storyteller content | [[Storyteller View SOP]] |
| `SOP-011` | Develop canon for a sourcebook or setting product | [[Sourcebook Readiness SOP]] |
| `SOP-012` | Create or revise a nation, state, dominion, kingdom, republic, or comparable polity | [[012 - Nation Article Authoring SOP]] |
| `SOP-013` | Create or revise a city, town, village, fort, port, or other settlement | [[013 - Settlement Article Authoring SOP]] |
| `SOP-014` | Create or revise a political character whose role affects institutions or power | [[014 - Political Character Authoring SOP]] |

## Verification and development tools

Use [[Checklists/Checklist Index|Checklist Index]] after the article work is complete.

Use [[Worksheets/Worksheet Index|Worksheet Index]] when the underlying worldbuilding needs development or stress-testing.

A checklist tests the result. It does not repeat the procedure.

A worksheet develops or tests material. It is not a publication requirement unless the parent SOP says otherwise.

## Readiness levels

### Publication ready

Use this level when the article is coherent, correctly structured, adequately linked, and suitable for its intended public purpose.

### Reference ready

Use this deeper level when a future writer, sourcebook, story, or collaborator needs the subject's logistics, culture, politics, history, or cross-era consequences to be dependable.

Do not require reference readiness for every public article.

## Use an SOP

1. Read the opening block.
2. Complete the **Before you start** section.
3. Follow only the procedure that matches your task.
4. Complete each **Check the result** section.
5. Open the linked publication checklist when one exists.
6. Stop at the stated **Stop condition**.

> **Why:** The checks provide safe restart points after an interruption.

Use [[Creator Command Reference]] when you need an exact Obsidian or terminal command.

## Supporting references

| Need | Use this reference |
| --- | --- |
| Find an exact command, Base, or file-change effect | [[Creator Command Reference]] |
| Apply creator-vault interface rules | [[Creator UX Specification]] |
| Write or revise operational documentation | [[Documentation Writing Standard]] |
| Review source provenance and evidence roles | [[System/References/Research Source Register|Research Source Register]] |
| See a completed product-scoped editorial audit | [[System/Audits/Okse Sourcebook Readiness Audit|Okse Sourcebook Readiness Audit]] |

## Create a new SOP

Create an SOP only when all these statements are true:

1. The decision occurs more than once.
2. A poor decision can create inconsistent data or output.
3. The interface cannot prevent the problem more effectively.
4. A template or validator cannot prevent the problem more effectively.

Do not create an SOP for a one-time preference.

Do not create an SOP for an action that the interface already makes clear.

Assign the next unused permanent `SOP-###` identifier before creating the file.

Update [[Creator Command Reference]] when the main requirement is command lookup.
