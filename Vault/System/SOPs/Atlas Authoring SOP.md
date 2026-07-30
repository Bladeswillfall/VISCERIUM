# Atlas Authoring SOP

> **Use this SOP when:** You create a map or place a public note on a map.
>
> **Result:** Canonical Markdown and map assets generate the intended Atlas view.
>
> **First action:** Decide whether you will create a map, place a marker, or create a nested map.

Follow [[Documentation Writing Standard]] for operational wording.

## Purpose

Keep map facts in Markdown and map assets.

Generate the public Atlas from those canonical sources.

Do not maintain a second map database by hand.

## Choose a route

| Task | Use |
| --- | --- |
| Add a new source map | **Create a map note** |
| Place a subject on an existing map | **Place a note on a map** |
| Place a child map on a parent map | **Create a nested map** |

## Before you start

1. If you create a map, confirm that its source image belongs in `Vault/Assets/Maps/`.
2. Confirm that the note can be public before you add reader-facing map data.
3. Find the target map's `mapId` when you add a marker.

## Create a map note

### Add the required values

1. Create the note from [[Map Template]].
2. Set a unique `mapId`.
3. Set the source image from `Vault/Assets/Maps/`.
4. Write a reader-safe `description`.

### Add optional values

1. Add `width` and `height` when you know the source dimensions.
2. Leave zoom values empty until the fitted view needs adjustment.

Zoom values include `defaultZoom`, `minZoom`, and `maxZoom`.

> **Why:** Zoom values from another image resolution can produce an unusable fitted view.

## Place a note on a map

### Set the position

1. Open the note that you want to place.
2. Add a `map:` block.
3. Set `id` to the target map's `mapId`.
4. Set `x` as a percentage from the left edge.
5. Set `y` as a percentage from the top edge.

Keep `x` and `y` between `0` and `100`.

### Set the display

1. Set a semantic `marker` value.
2. Add at least one useful browsing `layer` when the map uses layers.

Example:

```yaml
map:
  id: errack
  x: 62.38
  y: 41.92
  marker: city
  layer:
    - civilisation/settlements
  minZoom:
  maxZoom:
```

> **Why:** Percentage coordinates remain stable when the displayed image size changes.

## Marker values

Use the most specific stable marker that helps readers.

| Purpose | Values |
| --- | --- |
| Settlements | `capital`, `city`, `settlement`, `village` |
| Conflict and danger | `fortification`, `battlefield`, `ruin`, `rift`, `myrkild` |
| Unusual or natural features | `naranor`, `anomaly`, `natural` |
| Transport and services | `port`, `infrastructure` |
| Navigation or generic places | `map`, `location` |

Use `location` when no more specific marker is useful.

## Layers

Layer values are path-like strings.

Use `/` to create nested Atlas controls.

Examples:

```yaml
layer:
  - civilisation/settlements
```

```yaml
layer:
  - threats/myrkild/rifts
```

```yaml
layer:
  - infrastructure/rail
```

Put the primary browsing layer first.

Do not duplicate a marker only to show it in several toggle groups.

## Zoom visibility

Use marker `map.minZoom` and `map.maxZoom` only to reduce clutter.

1. Keep major nations, capitals, and major anomalies visible at broad scale.
2. Reveal towns, forts, and regional features at closer scale.
3. Reserve high zoom levels for local landmarks.

Do not use zoom visibility to hide spoilers.

Use publication controls for reader visibility.

The Atlas can lower a restrictive map-level `minZoom` when source dimensions require a usable fitted view.

## Create a nested map

Use this procedure when a child map must appear on a parent map.

### Identify the maps

1. Open the child map note.
2. Keep the child's unique `mapId`.
3. Add a `map:` block that targets the parent map.

### Place the child map

1. Set the child position with `x` and `y`.
2. Set `marker: map`.
3. Add a layer such as `maps/settlements` when it helps browsing.

Example:

```yaml
mapId: kemsvall
map:
  id: krass-dominion
  x: 48.6
  y: 33.1
  marker: map
  layer:
    - maps/settlements
```

The public marker opens the child map.

## Check the result

### Generate the Atlas data

1. Open a terminal at the repository root.
2. Run `cd Site`.
3. Run `npm run generate:maps` or `npm run build`.
4. Read map-generation warnings.

### Check the affected map

1. Open the affected Atlas page after a position or zoom change.
2. Confirm that the marker opens the intended note or child map.

Do not hand-edit `Site/src/data/maps.json`.

## Source of truth

The Markdown note and its properties are canonical.

The map image under `Vault/Assets/Maps/` is the source map asset.

Atlas controls, generated JSON, popups, and public map pages are generated outputs.

## Stop condition

Stop when the map provides the navigation detail needed at its intended scale.

Do not add markers only to make the map look complete.
