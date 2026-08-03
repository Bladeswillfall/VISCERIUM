---
title: Exploration Demo World
description: "NON-CANON Atlas test overlay using the real CITADEL map of Errack to verify raster rendering, search, layers, marker types, zoom thresholds, nested maps, and plugin-backed visual authoring."
status: published
type: map
era: CITADEL
mapId: exploration-demo-world
image: /assets/maps/Errack-CITADEL.webp
mapMarkers: Assets/Maps/Errack-CITADEL.webp.markers.json
width: 7680
height: 3840
maxZoom: 3
icon: map
tags:
  - demo
  - non-canon
  - atlas-test
  - ttrpg-maps
  - Maps
related:
  - Demo Gate City
  - Demo Frontier Fort
  - Demo Rift Site
---

> [!caution]
> This page is deliberately **non-canon test content**. The background is the real CITADEL map of Errack; the demo markers and relationships overlaid on it are not canon.

<!-- obsidian-only:start -->
## Authoring map

Use this map inside Obsidian to place and move markers visually. Each publishable marker must link to its canonical Markdown note. The Codex build reads marker position and the primary layer from the sidecar JSON, then takes title, description, era, faction, region, semantic marker type, zoom visibility and article route from the linked note.

```zoommap
image: Assets/Maps/Errack-CITADEL.webp
markers: Assets/Maps/Errack-CITADEL.webp.markers.json
id: exploration-demo-world-authoring
height: 720px
width: 100%
minZoom: 0.1
maxZoom: 8
render: canvas
resizable: true
resizeHandle: native
```
<!-- obsidian-only:end -->

## What to test

In Obsidian, drag a demo marker and save the note. On the public Atlas, use the layer control, search for the demo locations, click markers for cards, and zoom in or out to confirm zoom-gated markers appear and disappear. The world background should render from the managed WebP asset rather than the synthetic SVG fixture.

The **Demo Gate City** marker opens a nested city map.
