---
title: Starlight Page Cheat Sheet
description: "A single authoring reference for the Markdown, Codex layout, media, map-container, sidebar, calendar, timeline, typography, and metadata features available to a regular VISCERIUM Codex page."
headerImage: /assets/images/viscerium-banner.webp
image: /assets/images/640faf5b8cd2814de13871ff58c900b6.webp
imageTitle: Demo sidebar artwork
artist: Fall
alt: "A VISCERIUM artwork sample used to demonstrate the standard page sidebar image treatment."
status: published
type: system
titleIcon: codex
era: CITADEL
faction:
  - Okse Dominion
location:
  - Degel System
tags:
  - demo
  - starlight
  - authoring
  - cheat-sheet
  - formatting
  - maps
  - images
  - calendar
  - timeline
calendarDate:
  calendar: okse
  year: 20004
  month: solmanuthur
  day: 16
  displayCalendars:
    - okse
calendarBlocks:
  ID-0001:
    calendar: okse
    year: 4
timelineBlocks:
  ID-0001:
    timeline: citadel
    defaultCalendar: okse
    laneMode: unified
    showFilters: false
    showMinimap: false
    showLegend: true
sidebar:
  label: Page Cheat Sheet
  order: 999
  badge:
    text: Guide
    variant: tip
  replaceMeta: true
  meta:
    - label: Page model
      value: Regular Vault Markdown
    - label: Rendering
      value: Starlight + Codex sync
    - label: Era styling
      value: CITADEL / e1
  sections:
    - title: Demonstrated here
      items:
        - Frontmatter and page sidebar
        - Typography and Markdown
        - Layout tags and callouts
        - Images and map containers
        - Calendar and timelines
      note: This is an author-facing system page rather than VISCERIUM lore.
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
banner:
  content: |
    Authoring cheat sheet — this page deliberately demonstrates the features available to a normal Codex article.
prev: false
next: false
pagefind: false
---

%%
This replaces the older Starlight Feature Demo and Starlight Component Gallery.
%%

This is the **regular-page authoring reference** for the VISCERIUM Codex. It is deliberately overloaded so one page can be used to inspect the normal article renderer and copy working syntax back into lore notes.

:::note[What counts as a regular page?]
A regular page starts as Markdown beneath `Vault/Lore/`. It does **not** need hand-written Astro components or imported Starlight MDX components. The sync pipeline may emit MDX internally when a normal note uses Codex layout, calendar, or timeline features, but the source note remains the authoring surface.
:::

## Quick-start page

A minimal public article needs:

```yaml
---
title: Example Article
description: "A short reader-safe description for search and previews."
status: published
type: article
---
```

Everything below is optional.

## Frontmatter and page chrome

This page itself demonstrates a header image, sidebar artwork, a title icon, automatic date badge, page banner, custom right sidebar, TOC depth, disabled pagination, and disabled Pagefind indexing. Navigation icons are documented below rather than assigned live on this system page because Starlight pagination also consumes sidebar labels.

```yaml
headerImage: /assets/images/example-banner.webp
image: /assets/images/example-sidebar-art.webp
imageTitle: Example artwork
artist: Artist Name
alt: "Describe the artwork for screen readers."

icon: codex
sidebarIcon: location
titleIcon: codex

era: CITADEL
faction:
  - Example Faction
location:
  - Example Location
participants:
  - Example Character
tags:
  - example
related:
  - Related Article

sidebar:
  replaceMeta: true
  meta:
    - label: Category
      value: Example
  sections:
    - title: Key facts
      items:
        - First fact
        - Second fact
      note: Optional section note.
```

| Field | Effect |
|---|---|
| `headerImage` | Large page-title artwork with the shared fade treatment. |
| `image` | Artwork in the right-hand page information panel. |
| `imageTitle`, `artist`, `alt` | Artwork context, provenance, and accessible text. |
| `icon`, `sidebarIcon`, `titleIcon` | Shared local icon treatment for navigation and/or the page title. |
| `era` | Taxonomy plus the matching era styling where applicable. |
| `faction`, `location`, `participants`, `tags` | Metadata, filtering, graphing, and editorial classification. |
| `related` / `relationships` | Graph and related-entry connections. |
| `sidebar.meta` | Custom label/value information in the right sidebar. |
| `sidebar.sections` | Additional facts, lists, links, and notes. |
| `tableOfContents` | Controls heading depths shown in the page TOC. |
| `banner` | Page-level announcement strip. |
| `prev`, `next` | Controls article pagination links. |
| `pagefind` | Controls Pagefind search indexing. |

## Headings and section structure

The frontmatter title is already the H1. Begin normal article sections at H2.

### H3 — subsection

Use H3 for sections inside an H2.

#### H4 — fine detail

H4 through H6 are available when deeper structure is genuinely useful.

```md
## Major section
### Subsection
#### Fine detail
```

### Icon headings

For a Codex icon heading, write the heading marker `## `, then an opening square bracket, immediately followed by `Icon:codex]`, then the heading text. Replace `codex` with another validated local icon name such as `location` when appropriate.

This cheat sheet demonstrates the icon system live through its `titleIcon: codex`. The `icon` and `sidebarIcon` frontmatter forms are shown in the copy/paste example above.

## Inline formatting

This sentence demonstrates **bold**, _italic_, ***bold italic***, ~~strikethrough~~, `inline code`, [a normal link](/), and <kbd>Ctrl</kbd> + <kbd>K</kbd> keyboard notation.

```md
**bold**
_italic_
***bold italic***
~~strikethrough~~
`inline code`
[normal link](/calendar/)
<kbd>Ctrl</kbd> + <kbd>K</kbd>
```

## Links and wikilinks

- [Codex home](/)
- [Calendar](/calendar/)
- [[Okse Dominion]]
- [[Okse Dominion|Custom wikilink label]]

```md
[Normal Markdown link](/calendar/)
[[Okse Dominion]]
[[Okse Dominion|Custom label]]
```

Published wikilinks become site links and also feed graph/backlink data.

## Paragraphs, blockquotes, and rules

The horn did not sound. It remembered.

> Money flows here like water through a river, and anything can be bought for the right price.
>
> The lie is that price and cost are the same thing.

---

```md
---
```

## Asides and Codex callouts

:::note
Neutral context or clarification.
:::

:::tip[Codex writing tip]
Use a title when it makes the aside easier to scan.
:::

:::caution
Useful for unstable terminology, partial canon, or non-fatal warnings.
:::

:::danger[Content or canon hazard]
Use danger sparingly so it retains meaning.
:::

```md
:::note[Optional title]
Callout body.
:::
```

The Codex also provides authoring tags:

[note:title="Archivist note"]
A controlled note callout authored with Codex tag syntax.
[/note]

[warning:title="Content warning"]
The standard warning form for sensitive material.
[/warning]

[lore:title="Recovered fragment"]
The horn did not sound. It remembered.
[/lore]

```md
[note:title="Archivist note"]
A public clarification.
[/note]

[warning:title="Content warning"]
Sensitive public warning text.
[/warning]

[lore:title="Recovered fragment"]
In-world quoted text.
[/lore]
```

## Lists and task lists

- Resonance
- Warfare
- Culture
  - Social hierarchy
  - Religion

1. Name the pressure.
2. Name who benefits from it.
3. Name who bleeds for it.

- [x] Establish the public myth.
- [x] Establish material pressure.
- [ ] Decide who pays the hidden cost.

## Tables

| Faction / power | Public story | Actual pressure | Responsive test |
|:---|:---|:---|:---|
| ASTU | Open hands, open minds | Trade security and democratic friction | Short cell |
| TCSC | Progress through unity | Rail power, heavy industry, ideological cohesion | Longer wrapping cell |
| KRG | Recovery and contract survival | Money, deniability, second-hand hardware | Acronym-heavy |
| Republic of Askalia | Coin as freedom | Exploitation, guild pressure, and slavery | Sensitive-content example |

```md
| Column A | Column B | Column C |
|---|---|---|
| Value | Value | Value |
```

## Responsive layout tags

Tags must sit on their own lines.

```md
[cols:2-1 gap=lg]
[col]
Main article body.
[/col]
[col]
[card:accent compact]
Supporting content.
[/card]
[/col]
[/cols]
```

[cols:2-1 gap=lg]
[col]
### Primary column

Use this side for the main argument, description, history, or other long-form material.
[/col]
[col]
[card:accent compact]
### Supporting card

Useful for a compact summary, doctrine note, key facts, warning, or sidebar-like material.
[/card]
[/col]
[/cols]

### Equal columns

[cols gap=lg]
[col]
[card:plain]
**First column.** Equal columns work for balanced comparisons.
[/card]
[/col]
[col]
[card:muted]
**Second column.** They collapse responsively on narrow screens.
[/card]
[/col]
[/cols]

### Twelve-column row control

```md
[row gap=lg]
[col 8 md:8]
Eight-column region.
[/col]
[col 4 md:4]
Four-column region.
[/col]
[/row]
```

[row gap=lg]
[col 8 md:8]
[card]
**Eight-column region.** Wider content area.
[/card]
[/col]
[col 4 md:4]
[card:muted]
**Four-column region.** Narrower supporting area.
[/card]
[/col]
[/row]

### Card variants

Available variants are `plain`, `accent`, `muted`, `warning`, `danger`, and `success`. Add `compact` for small content.

[cols gap=sm]
[col]
[card:accent compact]
**Accent**
[/card]
[/col]
[col]
[card:warning compact]
**Warning**
[/card]
[/col]
[col]
[card:success compact]
**Success**
[/card]
[/col]
[/cols]

## Images and media

### Standard Markdown image

![Okse Dominion artwork used as a local image example](/assets/images/640faf5b8cd2814de13871ff58c900b6.webp)

```md
![Useful alternative text](/assets/images/640faf5b8cd2814de13871ff58c900b6.webp)
```

### Obsidian image embed

![[640faf5b8cd2814de13871ff58c900b6.webp]]

```md
![[640faf5b8cd2814de13871ff58c900b6.webp]]
```

### Captioned image panel

<figure className="codex-image-panel">
  <img src="/assets/images/1d6a04547df953b36f4d6f8ce73e91f2.webp" alt="A VISCERIUM landscape artwork used to demonstrate the captioned image panel." />
  <figcaption>Captioned image panel — useful for artwork, diagrams, documentary images, or visual references that need visible context.</figcaption>
</figure>

```mdx
<figure className="codex-image-panel">
  <img src="/assets/images/640faf5b8cd2814de13871ff58c900b6.webp" alt="Describe the image." />
  <figcaption>Visible caption and context.</figcaption>
</figure>
```

## Map containers

Regular articles can display cartography without becoming specialist `type: map` pages.

### Single map panel

`codex-map`, `map-panel`, and `map-frame` share the standard full-width framed-media treatment.

<figure className="codex-map">
  <img src="/assets/images/1d6a04547df953b36f4d6f8ce73e91f2.webp" alt="Demonstration artwork standing in for a map image inside the Codex map container." />
  <figcaption>Demo map container. Replace the image source with the actual managed map asset.</figcaption>
</figure>

```mdx
<figure className="codex-map">
  <img src="/assets/maps/your-map.webp" alt="Describe the map and area shown." />
  <figcaption>Map title, date, projection, source, or guidance.</figcaption>
</figure>
```

### Scrollable world-map container

<div className="world-map">
  <img src="/assets/images/viscerium-banner.webp" alt="Wide VISCERIUM artwork used to demonstrate the scrollable world-map container." />
</div>

```mdx
<div className="world-map">
  <img src="/assets/maps/large-world-map.webp" alt="Describe the world map." />
</div>
```

### Map grid and map cards

<div className="map-grid">
  <article className="map-card">
    <img src="/assets/images/640faf5b8cd2814de13871ff58c900b6.webp" alt="First demonstration image in a map card." />
    <div className="map-card__body">
      <h3>Regional map card</h3>
      <p>Use the body for map scope, period, provenance, legend notes, or a dedicated-map link.</p>
    </div>
  </article>
  <article className="map-card">
    <img src="/assets/images/viscerium-banner.webp" alt="Second demonstration image in a map card." />
    <div className="map-card__body">
      <h3>Second map card</h3>
      <p>The grid reflows according to available article width.</p>
    </div>
  </article>
</div>

```mdx
<div className="map-grid">
  <article className="map-card">
    <img src="/assets/maps/region-a.webp" alt="Region A map." />
    <div className="map-card__body">
      <h3>Region A</h3>
      <p>Context for this map.</p>
    </div>
  </article>
</div>
```

### Connecting a normal article to an interactive map

```yaml
map:
  id: example-world
  x: 52
  y: 41
  marker: city
  layer:
    - cities
```

The `type: map` note owns the interactive map; normal articles only need matching marker metadata when they should appear on it.

## Details / disclosure blocks

<details>
<summary>Open this demonstration disclosure</summary>

The hidden content can contain **Markdown**, lists, links, and `inline code`.

- First hidden item
- Second hidden item

</details>

```md
<details>
<summary>Reader-facing summary</summary>

Hidden Markdown content.

</details>
```

## Code blocks

```js title="codex-demo.js" {2-4}
export function pressureTestFaction(faction) {
  if (!faction.publicMyth) return 'Decoration wearing a flag';
  if (!faction.materialPressure) return 'Aesthetic without engine';
  return 'Usable';
}
```

````md
```js title="example.js" {2-3}
const visible = true;
const highlighted = 'these lines';
const stillHighlighted = true;
```
````

## Mathematical notation

Inline TeX: $a^2+b^2=c^2$.

$$
a^2+b^2=c^2
$$

[equation:title="Resonance decay model"]
$$
R(t)=R_0e^{-\lambda t}
$$
[/equation]

```md
Inline: $a^2+b^2=c^2$

[equation:title="Resonance decay model"]
$$
R(t)=R_0e^{-\lambda t}
$$
[/equation]
```

## Calendar placement

A regular page can display an automatic date badge through `calendarDate` and place a full calendar wherever a shortcode appears.

```yaml
calendarDate:
  calendar: okse
  year: 20004
  month: solmanuthur
  day: 16
  displayCalendars:
    - okse

calendarBlocks:
  ID-0001:
    calendar: okse
    year: 4
```

```md
[Calendar:ID-0001]
```

[Calendar:ID-0001]

Inline form:

```md
[Calendar:okse year=4]
```

## Timeline placement

Simple generated timeline:

```md
[Timeline:citadel]
```

Configured block:

```yaml
timelineBlocks:
  ID-0001:
    timeline: citadel
    defaultCalendar: okse
    laneMode: unified
    showFilters: false
    showMinimap: false
    showLegend: true
```

```md
[Timeline:ID-0001]
```

[Timeline:ID-0001]

### Native note-local Chronos timeline

```chronos
> NOTODAY
> ORDERBY start
> HEIGHT 260

- [9201] First demonstration event | Example hover detail
- [9204~9208] Demonstration ranged event
* [9210] Demonstration point
= [9220] Demonstration marker
```

Use canonical event notes and `[Timeline:...]` when events must participate in calendars, era validation, filters, and generated datasets.

## Footnotes

Footnotes use normal Markdown syntax.[^1]

```md
A sentence with a footnote.[^1]

[^1]: The footnote text.
```

[^1]: This is the live footnote used by the cheat sheet.

## What is deliberately not in the regular-page toolbox?

The old MDX component gallery imported `Badge`, `CardGrid`, `FileTree`, `Tabs`, `LinkCard`, and other Starlight components directly. Those are valid **hand-authored MDX** features, but they are not part of the normal Vault Markdown contract.

| Feature | Regular page? | Use instead / when appropriate |
|---|---:|---|
| Markdown + Starlight asides | Yes | Everyday article authoring. |
| Codex layout/callout/equation tags | Yes | Responsive layout from Vault Markdown. |
| Managed images and Obsidian embeds | Yes | Normal article media. |
| `codex-map`, `world-map`, `map-grid`, `map-card` | Yes | Inline cartography presentation. |
| Calendar and timeline shortcodes | Yes | Dynamic article modules. |
| Native `chronos` fences | Yes | Note-local chronology. |
| Imported Starlight MDX components | No, not by default | Deliberately hand-authored `.mdx` pages only. |
| `type: map` interactive-map route | Specialist | Use when the note owns the map route/dataset. |
| Bespoke Astro/Preact components | Specialist | Add at Site/component level. |

## Authoring checklist

- [ ] Use one frontmatter `title`; do not repeat it as an H1 in the body.
- [ ] Give every public page a useful `description`.
- [ ] Use H2 for major sections and H3 for subsections.
- [ ] Give meaningful images and maps useful alternative text.
- [ ] Use tables for tabular data; use layout tags for visual columns.
- [ ] Prefer wikilinks when relationships should feed graph/backlink data.
- [ ] Use callouts only when the distinction helps the reader.
- [ ] Keep specialist MDX/Astro components out of ordinary Vault notes unless truly needed.
