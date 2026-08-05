---
document_type: sop
sop_id: SOP-009
checklists:
  - CHK-009a
---
# Atlas Authoring SOP

> **Use this SOP when:** You create an interactive map or place a lore note on one.
>
> **Result:** TTRPG Tools - Maps provides visual authoring in Obsidian while the Codex build produces the public VISCERIUM Atlas.
>
> **First action:** Decide whether you are creating a map, placing a linked marker, or creating a nested map.

Follow [[Documentation Writing Standard]] for operational wording.

## Purpose

Make map authoring visual without moving lore authority into an Obsidian plugin.

The plugin is the authoring surface. Markdown notes and map assets remain portable source material. The public Atlas remains a generated Codex feature.

## Source of truth

| Information | Canonical source |
| --- | --- |
| Map title, description, era and public image | Map note frontmatter |
| Marker position and primary authoring layer | TTRPG Maps `.markers.json` sidecar |
| Marker title, description, era, faction, region and article route | Linked Markdown note |
| Public marker type and public zoom visibility | Linked note `map:` block |
| Secondary semantic layers | Linked note `map.layer` values after the primary layer |
| Public search, popups, nested-map links and mobile behaviour | Generated Codex Atlas |

Do not hand-edit `Site/src/data/maps.json`.

## Required plugin setup

1. Enable **TTRPG Tools - Maps** (`zoom-map`).
2. Keep marker storage set to **JSON**.
3. Use the checked-in defaults that open the marker editor after placement, prefer the active layer and enable drawing and measurement tools.
4. Keep map images under `Assets/Maps/`.
5. Use Canvas render mode for very large raster maps such as the 7680 × 3840 CITADEL map.

The plugin bundle itself is installed per device. Repository configuration, notes and sidecar data are shared through Git.

## Create a plugin-backed map

### Create the map note

1. Create the note from [[Map Template]].
2. Set a unique `mapId`.
3. Set `image` to the public path, for example `/assets/maps/Errack-CITADEL.webp`.
4. Set `mapMarkers` to the vault-relative sidecar path, for example `Assets/Maps/Errack-CITADEL.webp.markers.json`.
5. Record the source image `width` and `height` when known.
6. Write a reader-safe `description`.

### Insert the authoring map

1. Put the cursor in the map note while in Edit mode.
2. Run **TTRPG Tools - Maps: Insert new map...**.
3. Choose the source image from `Assets/Maps/`.
4. Use the same sidecar path recorded in `mapMarkers`.
5. Give the code block a stable `id`.
6. Use `render: canvas` for large SVG or raster maps.
7. Enable pan clamping from the map context menu when the image should remain within the viewport.

The generated public note strips the `zoommap` code block. Readers see the Codex Atlas rather than Obsidian plugin syntax.

## Link an era homepage to an Atlas map

The Atlas route is derived from the map note's `mapId`:

```text
mapId: errack-citadel
→ /maps/errack-citadel/
```

To set or replace the map linked from an era homepage:

1. Create and publish the map note first.
2. Confirm its unique `mapId` and generated `/maps/<mapId>/` route.
3. Open the authoritative era note at `Lore/Eras/<ERA>.md`.
4. Update the `eraPrimer.map` block:

```yaml
eraPrimer:
  map:
    src: /assets/images/citadel-era-map.webp
    alt: Reader-safe thumbnail description.
    href: /maps/errack-citadel/
    eyebrow: 'CITADEL: Errack'
    label: Errack in the CITADEL age
    action: Open in Atlas
```

`src` controls the image displayed inside the era primer. The Atlas itself uses the map note's `image` field. They may point to different optimised versions of the same artwork.

Use `/maps/` temporarily when an era does not yet have a dedicated Atlas map. Once the map exists, replace it with the specific `/maps/<mapId>/` route. Era-primer validation rejects external map links so WorldAnvil or other legacy URLs cannot silently return.

## Place a linked marker

### Prepare the lore note

The marker must link to a canonical note. For public Atlas output, that note must be published.

Keep a `map:` block on the linked note for semantic public behaviour:

```yaml
map:
  id: errack-citadel
  marker: city
  layer:
    - civilisation/settlements
  minZoom:
  maxZoom:
```

`x` and `y` may remain temporarily as migration fallback values, but plugin-backed maps ignore them. Move the marker in the visual map instead.

### Place the marker visually

1. Open the map note in Reading view.
2. Shift-click the desired position or right-click and choose **Add marker here**.
3. Link the marker to the canonical note using its vault path, for example `Lore/CITADEL/Locations/Kemsvall.md`.
4. Select the most useful primary layer.
5. Choose an authoring icon that helps you recognise the marker in Obsidian.
6. Save the marker.
7. Drag it to refine the position.

The build resolves the plugin link to the published note. It does not publish unlinked plugin markers.

## Marker meaning

The plugin icon is an authoring convenience. The public marker shape comes from the linked note's semantic `map.marker` value.

Use the most specific stable value:

| Purpose | Values |
| --- | --- |
| Settlements | `capital`, `city`, `settlement`, `village` |
| Conflict and danger | `fortification`, `military`, `battlefield`, `ruin`, `rift`, `myrkild` |
| Unusual or natural features | `naranor`, `anomaly`, `natural` |
| Transport and services | `port`, `infrastructure` |
| Navigation or generic places | `map`, `location` |

Use `location` only when no more specific marker is useful.

## Layers

Layer names are path-like strings. Use `/` to create nested Atlas controls.

Examples:

```text
civilisation/settlements
threats/myrkild/rifts
infrastructure/rail
```

The plugin marker layer becomes the primary public layer. Additional values in the linked note's `map.layer` list remain available as semantic metadata and search terms.

Do not create duplicate markers merely to classify one place several ways.

## Zoom visibility

Plugin zoom thresholds and Codex Atlas zoom thresholds are not numerically compatible.

Use plugin zoom settings only to make Obsidian authoring comfortable. Use the linked note's `map.minZoom` and `map.maxZoom` for public clutter control.

1. Keep nations, capitals and major anomalies visible at broad scale.
2. Reveal towns, forts and regional features closer in.
3. Reserve high zoom levels for local landmarks.
4. Do not use zoom visibility to conceal spoilers; use publication controls.

## Create a nested map

1. Create the child as its own map note with a unique `mapId`.
2. Add the child map as a linked marker on the parent through TTRPG Maps.
3. Link that marker to the child map note.
4. Set the child note's `map.marker` to `map` or the appropriate settlement type.
5. Keep the child note's `map.id` pointed at the parent map ID.

The public marker opens the generated child Atlas page.

## Verification checklist

Use [[Checklists/009a - Atlas Publication Checklist|Atlas Publication Checklist]] before publication.

## Check the result

### In Obsidian

1. Reopen the map note.
2. Confirm marker links open the intended notes.
3. Confirm marker layers can be hidden and locked.
4. Confirm the sidecar JSON changes after a marker is moved.

### In the Codex

1. Open a terminal at the repository root.
2. Run `cd Site`.
3. Run `npm run generate:maps` after content has been synced, or run `npm run build`.
4. Read all map-generation warnings.
5. Confirm search, layers, popups, mobile inspection and nested links.

Warnings identify unlinked markers, unresolved or ambiguous note links, duplicate links and invalid coordinates.

## Legacy maps

Maps without `mapMarkers` continue to use note-owned percentage coordinates.

This fallback exists for migration and portability. Do not add new manual `x` and `y` values to a plugin-backed map unless a temporary fallback is genuinely required.

## Private fixture

The non-canon manual walkthrough lives under `Demo/Lore/Exploration/`. Its marker sidecar lives under `Demo/Assets/Maps/`, and it does not generate public routes or Atlas data.

Use compiler fixtures for automated populated-map coverage. Do not link public era homepages to private fixture content.

## Stop condition

Stop when the map provides the navigation detail required at its intended scale.

Do not add markers merely to make the map appear complete.
