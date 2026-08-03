# Frontmatter Schema

VISCERIUM properties have one authoritative meaning. Templates may omit properties that are irrelevant to a subject; absence means the fact is not established or not useful yet.

## Publication

`status` is the publication workflow field. Use `draft`, `review`, `published`, or `archived`. Only notes beneath `Lore/` with `status: published` are public Codex sources. Folder placement remains the second safety boundary.

Do not add a second `publish` boolean. Canon/continuity truth is a separate concept from whether a note is publicly released.

## Reader-facing presentation

`pronunciation` is an optional display string shown beside the public article title. Prefer IPA with its normal delimiters, for example `pronunciation: /ˈɛræk/`. Keep `title` itself clean so links, filenames and canonical naming are not polluted by pronunciation text.

Use `titleIcon` for a public page-title icon and `[Icon:name]` in Markdown headings when a section benefits from a semantic icon. Do not add `icon` or `sidebarIcon` merely to duplicate the page-title icon: those fields also affect framework-owned navigation and require every navigation surface to understand the encoded icon label.

`sidebar` is optional structured reader-facing metadata. Use `sidebar.replaceMeta: true` only when a deliberately curated facts panel is more useful than the default type/status/era metadata. The Markdown article remains the source for prose; do not move ordinary narrative text into the sidebar merely to imitate a wiki infobox.

### Choose the sidebar you mean

| Meaning | Use |
| --- | --- |
| Obsidian creator context | Open [[System/Creator Sidebar|Creator Sidebar]] through [[Home]] → **Creator Context**. |
| Public article facts | Author `sidebar.meta` or `sidebar.sections` in the note frontmatter. |
| Public navigation | Reserve `sidebar.label`, `sidebar.order`, and `sidebar.badge` for framework-maintained routes. |
| In-article side column | Use the `[cols]` layout documented in [[System/Publishing Rules#Layout tags|Publishing Rules]]. |

These four features share a word, but they do not share content or behaviour.

### Article facts sidebar

Use an article facts sidebar for short, reader-safe facts that improve orientation.

The default facts panel already uses supported frontmatter such as `type`, `status`, `era`, `faction`, and `location`.

Use `sections` when you need grouped facts or lists below the default panel.

Use `replaceMeta: true` only when a curated `meta` list should replace all default facts.

The `meta` list does not append to the default facts.

> **Why:** Replacement prevents duplicated or contradictory facts in one panel.

| Content | Put it in |
| --- | --- |
| One labelled fact | `meta` or `sections[].fields` |
| Several values for one fact | A YAML list under `value` |
| A short unlabelled list | `sections[].items` |
| A short qualification | `sections[].note` |
| A reader-facing link | `href` beside a field or item |

Good candidates depend on the article:

| Article | Useful facts |
| --- | --- |
| Character or faction | Public role, affiliation, leadership, territory, or government |
| Location | Location kind, population band, authority, climate, access, or known hazards |
| Item or vehicle | Role, maker, dimensions, capacity, operating limits, or armament |
| Flora, fauna, fungi, or species | Identification, size, habitat, rarity, uses, or hazards |
| Event | Date, location, participants, public outcome, or succession |

Do not put these items in an article facts sidebar:

- Long narrative text.
- Creator tasks or import issues.
- Secret or Storyteller-only facts.
- Empty placeholders.
- Facts that duplicate the article description without adding orientation.

#### Keep the default facts and add sections

Omit `replaceMeta` and `meta`.

```yaml
sidebar:
  sections:
    - title: Known for
      items:
        - Lake fisheries
        - Mountain trade
    - title: Access
      fields:
        - label: Main route
          value: North road
      note: Winter storms can close the route.
```

This form keeps the default type, status, era, and other supported facts.

#### Replace the default facts

Repeat every default fact that the reader still needs.

```yaml
sidebar:
  replaceMeta: true
  meta:
    - label: Type
      value: Settlement
    - label: Population
      value: About 8,000
    - label: Capital of
      value: Example Faction
      href: /eras/citadel/factions/example-faction/
  sections:
    - title: Known for
      items:
        - label: Example Harbour
          href: /eras/citadel/locations/example-harbour/
        - Cold-water fisheries
```

Use an absolute Codex route for an internal `href`.

Use a complete URL for an external `href`.

#### Check the sidebar

1. Confirm that every fact is reader-safe.
2. Confirm that each label has a useful value.
3. Confirm that each internal `href` opens the intended route.
4. Confirm that `replaceMeta` does not remove a needed default fact.
5. Run `cd Site && npm run doctor:vault`.

## Era editions and continuity

`era` is a controlled selector. The only valid authored values are:

- `CITADEL`
- `SMOG`
- `NEARSIGHT`
- `ENTROPY`
- `Universal`

`Universal` means the article is deliberately valid outside a historical era. It is not a fifth chronological era and must not be used for dated events, era records or timeline placement.

New reader-facing edition notes use one scalar `era`. Legacy/import `eras` arrays may remain temporarily while migration decisions are unresolved, but should be split into independent era editions before publication when the reader-facing facts differ by era.

`entity_id` is a stable lowercase kebab-case continuity identifier such as `cow`, `okse-dominion` or `okse-dominion-b`. It is not the article title and does not need to resemble the title. Independent things with similar names must use different IDs. Separate historical editions of the same conceptual thing share the same `entity_id` and use different `era` values.

A published `entity_id + era` pair must be unique. One continuity family must not mix `Universal` with historical editions; the public site generates an all-era continuity page automatically instead of requiring an authored Universal parent.

## Relationship fields

- `era`: controlled VISCERIUM era/scope identifier described above.
- `eras`: transitional multi-era import field; do not use for new published era editions.
- `faction`: references faction entity titles.
- `location` / `locations`: references location entity titles.
- `species`: references species entity titles.
- `participants`: event participant titles, normally characters.
- `related`: deliberately loose cross-entity references.

Use arrays where a field can genuinely hold several values. Do not create self-reference fields merely to repeat the note title; `title` already identifies the entity.

## Location properties

`location_kind` is a deliberately broad semantic classification for `type: location` notes. Supported values are `region`, `settlement`, `wilderness`, `route` and `site`.

It does **not** replace Atlas `map.marker`. A fortress-city can be a `settlement` in canon while using a more specific fortification-style marker on a map.

Optional location field families are injected progressively through [[Templates/Lore/Add Location Fields|Add Location Fields]]:

- settlement: `settlement_scale`, `population_band`, `governance_summary`, `economic_role`, `local_services`, `defences`.
- wilderness: `terrain_summary`, `climate_summary`, `natural_resources`, `wilderness_travel`, `environmental_hazards`.
- site: `site_origin`, `site_condition`, `current_use`, `access_conditions`, `notable_features`.
- route: `route_connections`, `normal_traffic`, `route_conditions`, `seasonal_changes`, `route_dangers`.

These fields record world facts. They remain optional and should not be populated merely because a location belongs to one of the broad kinds.

## Storyteller sections are not frontmatter

Storyteller guidance is authored as normal Markdown between the article footer markers:

```markdown
<!-- viscerium:storyteller:start -->

## Storyteller View

<!-- viscerium:storyteller:end -->
```

Frontmatter remains reserved for stable, queryable facts such as type, era, continuity, relationships, map placement, profile metadata and publication state.

Do not store Storyteller presentation text in properties such as `approach_signs`, `first_impression`, `current_wants`, `preferred_methods`, `story_complication` or similar fields. Put that material in the marked Storyteller section where headings, tables, images, links and other Markdown remain available.

The public build identifies the section through its markers and renders the same authored Markdown in the Lore / Storyteller switch. It does not generate a nested `storyteller` frontmatter object.

See [[Storyteller View SOP]] for authoring rules and the admission test.

## Creator maturity

`development_level: stub` means an intentionally incomplete creator record. It is not a publication state. Generated relationship stubs belong under `Drafts/Inbox/` until developed and deliberately promoted.

Specialist databases may retain provenance/import fields when those fields answer a real workflow question. For example, Myrkild `source_*` fields remain distinct from public metadata.

## Artwork provenance

`artist` identifies the maker where known. `credit` is the display/rights-holder credit and may differ from the artist. `source`, `sourceUrl`, `license`, `rights`, and `usage` remain provenance/permission fields rather than synonyms.
