---
title: "{{title}}"
description:
status: draft
type: map
era:
mapId:
image:
headerImage:
width:
height:
defaultZoom:
minZoom:
maxZoom:
map:
  id:
  x:
  y:
  marker: map
  layer:
    - maps
  minZoom:
  maxZoom:
tags: []
relationships: {}
related: []
---

%% Before publishing: write a reader-safe description, assign a unique mapId, and point image at a source map that can publish from Vault/Assets/Maps/. Width and height should match the source image when known. Leave defaultZoom/minZoom/maxZoom blank until the fitted view has been tested with the real source raster; raw Leaflet zoom values change meaning when image resolution changes. Leave the map: block empty unless this map should appear as a clickable nested map on a parent atlas. %%

## Overview

What area does this map cover, and what should somebody use it to understand?

## Layers

Document only the layers that creators need to place or filter markers consistently. Layer names may use `/` to create nested Atlas controls, for example `civilisation/settlements` or `threats/myrkild/rifts`.

## Marker Guidelines

Explain which marker types belong here and any placement conventions that prevent inconsistent coordinates. Use marker `minZoom` / `maxZoom` only when a marker would otherwise create clutter at the wrong scale.

## Nested Map

When this map represents a more detailed view of somewhere on another map, fill the `map:` block with the parent map ID and placement coordinates. The Atlas will link the parent marker directly into this map.

## Related Locations

Link the most important places represented on this map rather than duplicating the full marker database by hand.

## Map Notes

Keep projection quirks, uncertain boundaries, source limitations, or creator-only cartographic decisions here.
