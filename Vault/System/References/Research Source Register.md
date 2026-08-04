# Research Source Register

> **Use this register when:** External material influences a VISCERIUM worksheet, calculation, framework, process, or visual vocabulary.
>
> **Result:** Contributors can trace provenance, evidence role, adaptation, and uncertainty without treating research as automatic canon.

## Source-use rules

1. Record the source that materially influenced the work.
2. State how the source was used.
3. State the source's evidence role.
4. Cite a quantitative assumption beside the calculation that depends on it.
5. Record VISCERIUM departures from the baseline.
6. Follow stronger underlying evidence when the immediate source provides it.
7. Do not reproduce protected text, tables, worksheets, or artwork only because the source is cited.

Attribution records provenance. It does not replace permission.

## Usage types

| Usage type | Meaning |
| --- | --- |
| `inspiration` | The source prompted an idea, but its structure or values were not retained. |
| `visual-reference` | A visible form, component, silhouette, process, or vocabulary informed the work. |
| `process-reference` | A demonstrated method informed a VISCERIUM process. |
| `historical-reference` | The source informs a historical or material baseline. |
| `research-lead` | The source identifies questions or stronger material that needs follow-up. |
| `adapted-framework` | The source's conceptual structure remains recognisable after substantial rewriting. |
| `adapted-heuristic` | A rough rule or comparison informs a planning decision. |
| `adapted-calculation` | A formula, ratio, range, constant, or calculation sequence informs an estimate. |

## Evidence roles

| Evidence role | Use |
| --- | --- |
| `primary` | Direct contemporary record, object, dataset, or first-hand source. |
| `scholarly-secondary` | Peer-reviewed or specialist historical analysis. |
| `reputable-reference` | Curated reference with identifiable sourcing. |
| `practical-synthesis` | Worldbuilding, game-design, or practitioner synthesis. |
| `community-analysis` | Discussion or answer by community contributors. |
| `visual-inspiration` | Image or demonstration used for vocabulary or design direction. |
| `unverified` | Creator, provenance, historical claim, or licence remains incomplete. |

The evidence role describes what a source can safely support. It is not a quality score.

## Registered sources

| ID | Source group | Main roles | Primary eras | Source note |
| --- | --- | --- | --- | --- |
| `SRC-001` | The Grainbound worksheets and logistics resources | Practical synthesis; adapted frameworks, heuristics, and calculations | CITADEL; SMOG transition | [[Source Notes/SRC-001 - The Grainbound Worksheets]] |
| `SRC-002` | Build Kingdoms | Practical synthesis; demographic and settlement heuristics | CITADEL; SMOG transition | [[Source Notes/SRC-002 - Build Kingdoms]] |
| `SRC-003` | Worldbuilding and History Stack Exchange | Community analysis; research leads; competing assumptions | CITADEL; SMOG transition | [[Source Notes/SRC-003 - Worldbuilding and History Stack Exchange]] |
| `SRC-004` | Medieval Demographics Made Easy | Practical synthesis; game-design calculations and support values | CITADEL | [[Source Notes/SRC-004 - Medieval Demographics Made Easy]] |
| `SRC-005` | Food Timeline | Reputable reference and research index | CITADEL; SMOG | [[Source Notes/SRC-005 - Food Timeline]] |
| `SRC-006` | EN World and Reddit equipment or process references | Visual inspiration; process reference; some unverified provenance | CITADEL; SMOG | [[Source Notes/SRC-006 - Equipment and Process Visual References]] |

## Worksheet citation pattern

Use this structure at the end of every worksheet:

```markdown
## Sources and adaptation notes

- [[System/References/Source Notes/SRC-### - Source title|SRC-### - Source title]]
- Use in this worksheet:
- Relationship:
- Values, prompts, or visual features carried forward:
- Material VISCERIUM changes:
```

For a calculation, add a nearby note:

```markdown
> **Source basis:** Adapted from [source]. Record any changed assumption before using the result.
```

## Contributor and assumption record

Every completed worksheet must record:

- completion author;
- reviewer when applicable;
- date;
- article or project;
- assumptions changed from the default worksheet;
- canon destination;
- confidence or uncertainty.

## Add a source

1. Assign the next unused `SRC-###` identifier.
2. Create one source note.
3. Record creator, title, URL, access date, evidence role, era relevance, suitable uses, unsuitable claims, and licence status when known.
4. Add the source to this register.
5. Link each dependent worksheet to the source note.
6. Record incomplete attribution instead of guessing.
