---
title: "{{title}}"
description:
created:
updated:
status: draft
type: map
era:
mapId:
image:
mapMarkers:
headerImage:
width:
height:
defaultZoom:
minZoom:
maxZoom:
map:
  id:
  marker: map
  layer:
    - maps
  minZoom:
  maxZoom:
tags: []
relationships: {}
related: []
---

%% Before publishing: write a reader-safe description, assign a unique mapId, point image at a public map path such as /assets/maps/example.webp, and set mapMarkers to the matching vault-relative TTRPG Maps sidecar such as Assets/Maps/example.webp.markers.json. Width and height should match the source image when known. Leave defaultZoom/minZoom/maxZoom blank until the public Atlas has been tested with the real source raster. Use TTRPG Tools - Maps: Insert new map... to create the Obsidian authoring block in this note. Leave the map: block empty unless this map should appear as a clickable nested map on a parent Atlas. %%

## Overview

What area does this map cover, and what should somebody use it to understand?

<!-- obsidian-only:start -->
## Authoring Map

Use **TTRPG Tools - Maps: Insert new map...** in Edit mode. Select the same image and marker sidecar recorded in frontmatter. Large maps should use Canvas render mode.
<!-- obsidian-only:end -->

## Layers

Document only the layers that creators need to place or filter markers consistently. Layer names may use `/` to create nested Atlas controls, for example `civilisation/settlements` or `threats/myrkild/rifts`.

## Marker Guidelines

Explain which semantic marker types belong here and any placement conventions that prevent inconsistent coordinates. Move markers through the visual map. Use the linked note's `map.minZoom` and `map.maxZoom` only when a public marker would otherwise create clutter at the wrong scale.

## Nested Map

When this map represents a more detailed view of somewhere on another map, fill the `map:` block with the parent map ID and semantic marker data, then place this map note as a linked marker through the parent's TTRPG Maps authoring view.

## Related Locations

Link the most important places represented on this map rather than duplicating the full marker database by hand.

## Map Notes

Keep projection quirks, uncertain boundaries, source limitations, or creator-only cartographic decisions here.
