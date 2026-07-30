---
title: "{{title}}"
description:
status: draft
type: location
icon: location
era:
faction:
region:
population:
climate:
image:
headerImage:
alt:
map:
  id:
  x:
  y:
  marker: location
  layer:
    - civilisation/locations
  minZoom:
  maxZoom:
tags: []
relationships: {}
related: []
---

%% Before publishing: write a reader-safe description, establish the relevant era, and only keep map metadata when this place belongs on a configured map. Layer names may use `/` to create nested Atlas controls. Use minZoom/maxZoom only when the marker should appear at a particular map scale. %%

## Summary

What is this place for, what makes it memorable, and why might somebody come here or avoid it?

## Geography

Record terrain, climate, access, resources, hazards, and spatial relationships only where they affect how the place functions.

## Districts and Landmarks

Describe the few locations that help somebody navigate, stage scenes, or understand local identity.

## People and Culture

Focus on everyday life, social assumptions, livelihoods, tensions, rituals, and how inhabitants understand their home.

## History

Include the events whose consequences are still visible or politically/socially relevant.

## Story Use

What kinds of problems, choices, discoveries, or conflicts does this place naturally create?

## Relationships

Use structured frontmatter when a relationship itself matters to navigation or continuity, for example `located-in`, `contains`, `connected-to`, `claimed-by`, or `rivals`. Keep ordinary contextual references in `related`.

## Related

Add only links that establish useful geographic, political, cultural, or narrative relationships.
