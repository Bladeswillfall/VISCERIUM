# Relationship Authoring SOP

> **Use this SOP when:** A relationship matters to navigation, continuity, or setting logic.
>
> **Result:** The public relationship explorer shows one useful semantic relationship.
>
> **First action:** Decide whether the relationship needs structured data.

Follow [[Documentation Writing Standard]] for operational wording.

## Purpose

Create a useful semantic relationship graph.

Do not turn every wikilink into a structured relationship.

## Decide whether to add a relationship

Use `relationships:` when the relationship supports setting structure:

- Navigation or continuity.
- Politics, authority, or command.
- Membership or ownership.
- Lineage, containment, or location.

Use `relationships:` when the relationship supports story logic:

- Alliance or hostility.
- Another important relationship that persists outside one paragraph.

Use body text or `related:` for an incidental reference.

Ask these questions:

1. Will a creator use this relationship to understand another subject?
2. Does the relationship remain important outside the current paragraph?
3. Would its absence make the relationship explorer less useful?

If every answer is no, keep the reference in body text.

> **Why:** Selective edges make important setting relationships easier to find.

## Before you start

1. Open the source note.
2. Confirm that the target note exists or has a deliberate draft plan.
3. Confirm that the relationship is safe for the public explorer.

## Add a simple relationship

1. Open the note properties or YAML frontmatter.
2. Add or open the `relationships:` block.
3. Choose a short relationship key.
4. Prefer kebab-case for a multi-word key.
5. Add the target as an Obsidian wikilink.

Example:

```yaml
relationships:
  allies:
    - "[[Republic of Askalia]]"
  member-of:
    - "[[Aquillan Seas Trade Union]]"
```

The build converts the relationship key into a reader-facing label.

## Add relationship metadata

Use a rich relationship only when chronology or explanation changes its meaning.

1. Replace the target string with an object.
2. Add `target` with the note reference.
3. Add only metadata that changes interpretation.
4. Add `directed` when the default direction is wrong.

Example:

```yaml
relationships:
  allied-with:
    - target: "[[Republic of Askalia]]"
      since: "412 EC"
      era: NEARSIGHT
      description: "A defensive compact followed the western border crisis."
      directed: false
```

| Key | Use |
| --- | --- |
| `target` | Required target reference. |
| `label` | Optional reader-facing label. |
| `since` | Optional start date or text. |
| `until` | Optional end date or text. |
| `era` | Optional era context. |
| `description` or `note` | Optional short explanation. |
| `directed` | Optional direction override. |

Use `target` as the house style.

The compiler accepts `to`, `ref`, `article`, and `title` for compatibility.

## Set the direction

Use directed relationships for hierarchy, location, command, or ownership.

Common directed keys include `member-of`, `located-in`, and `capital-of`.

They also include `parent-of`, `reports-to`, and `owned-by`.

Most other relationship types are reciprocal.

Use `directed: true` to change a reciprocal default.

The compiler does not write a reverse relationship into the target note.

Add the reverse fact only when creator navigation also needs it.

> **Why:** Automatic reverse writes would change another canonical source without an author decision.

## Breadcrumbs and the public graph

Use Breadcrumbs for local Obsidian navigation when it helps your workflow.

The public relationship explorer does not read the Breadcrumbs plugin database.

The public explorer reads canonical note properties during the site build.

## Check the result

1. Run `cd Site && npm run build` after a batch of relationship changes.
2. Read build warnings for unresolved relationship targets.
3. Fix a target error only when the intended note is certain.
4. Leave an uncertain target unresolved.
5. Open the explorer when the change affects important graph structure.

Do not hand-edit `Site/src/data/relationships.json`.

## World Anvil migration

Use [[Drafts/Inbox/World Anvil Migration Review|World Anvil Migration Review]] for imported relationship decisions.

Do not convert every imported leadership or membership fact automatically.

Add a structured relationship only when it passes the decision test.

## Stop condition

Stop when the graph shows relationships that matter to navigation and setting logic.

Do not reproduce the generic site graph with semantic edges.
