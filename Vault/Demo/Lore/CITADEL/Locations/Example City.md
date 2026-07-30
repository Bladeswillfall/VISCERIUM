---
title: Example City
description: "A sample city with generated map marker data, faction links, tags, and public layout guidance."
status: draft
type: location
icon: location
era: CITADEL
faction: Example Faction
location: Example City
tags:
  - example
  - location-template
  - citadel
map:
  id: example-world
  x: 52
  y: 41
  marker: city
  layer:
    - cities
related:
  - Example Faction
  - Example Battle
  - Example World Map
---

Example City is a public location note with generated map marker data. It is governed by [[Example Faction]], appears in [[Example Battle]], and belongs on [[Example World Map]].

[cols:2-1 gap=lg]
[col]
## [Icon:codex] Summary

Open with the city's function in the story: fortress, port, market, pilgrimage site, plague knot, imperial capital, prison-city, or ruin wearing a new name.

## [Icon:spark] Atmosphere

Describe what a visitor sees, smells, hears, and fears within the first hour of arrival.

## [Icon:location] Districts and Landmarks

- **Old Gate** — What enters, what leaves, and who profits from both.
- **Market Spine** — What is sold openly and what is only sold after dusk.
- **Shrine Quarter** — What the city claims to worship and what it actually obeys.
[/col]

[col]
[note:title="Map marker"]
The `map` frontmatter places this note on the generated `example-world` map. Use `x` and `y` as percentage coordinates from the top-left of the map image.
[/note]

[card:muted compact]
**Marker checklist**

- `map.id` matches a `type: map` note
- `x` and `y` are set
- `marker` describes the marker style
- `layer` groups filters such as `cities`, `ruins`, or `battlefields`
[/card]
[/col]
[/cols]

## [Icon:faction] Government

Who rules here, who believes they rule here, and who actually decides whether the gates open.

## [Icon:status] Economy

List exports, imports, taxes, black markets, guild monopolies, seasonal shortages, and debt traps.

## [Icon:bug] Threats

Use this section for bandits, Myrkild pressure, occult contamination, faction rivalry, disease, food insecurity, local monsters, or corrupt law.

## [Icon:codex] Related

- [[Example Faction]]
- [[Example Battle]]
- [[Example World Map]]
