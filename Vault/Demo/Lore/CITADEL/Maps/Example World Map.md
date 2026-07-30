---
title: Example World Map
description: "A sample interactive map metadata page with marker guidance for public location notes."
status: draft
type: map
era: CITADEL
mapId: example-world
image: /assets/maps/example-world.svg
width: 2000
height: 1200
tags:
  - example
  - map-template
  - citadel
related:
  - Example City
  - Example Faction
---

This metadata note configures the generated map page for `example-world`.

[note:title="How map pages work"]
A `type: map` note defines the map image, dimensions, title, and route. Other public notes become markers when their frontmatter includes `map.id` matching this page's `mapId`.
[/note]

## Map Source

Place the source image in `Vault/Assets/Maps/`, then reference its generated public path in `image`.

```yaml
mapId: example-world
image: /assets/maps/example-world.svg
width: 2000
height: 1200
```

## Adding Markers

Add marker metadata to any published note, usually a location, battlefield, ruin, settlement, or region.

```yaml
map:
  id: example-world
  x: 52
  y: 41
  marker: city
  layer:
    - cities
```

## Current Example Markers

- [[Example City]]

## Related

- [[Example City]]
- [[Example Faction]]
