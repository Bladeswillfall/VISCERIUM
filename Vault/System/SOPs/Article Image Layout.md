---
document_type: sop
sop_id: SOP-005
checklists:
  - CHK-005a
---
# Article Image Layout

> **Use image flags for ordinary illustrated prose.** Use `[cols]` when the page genuinely needs separate content regions.

## Basic syntax

The flags may appear in any order after the image filename.

```md
![[image.webp|left|320]]
![[image.webp|right|320]]
![[image.webp|center|480]]
![[image.webp|wide]]
![[image.webp|full]]
```

| Flag | Result |
| --- | --- |
| `left` | Floats left and lets following text wrap on the right. |
| `right` | Floats right and lets following text wrap on the left. |
| `center` | Centred block image. |
| A number such as `320` | Maximum width in pixels. A number without an alignment centres the image. |
| `wide` | Fills the current article lane or current column. |
| `full` | Breaks beyond the prose lane on the public Codex. Inside a column it safely becomes `wide`. |
| `gap=16` | Sets the wrapping gap in pixels, from `0` to `96`. |
| `alt=...` | Supplies accessible alternative text without mixing layout flags into the alt text. |

Example with alternative text:

```md
![[okse-officer.webp|alt=An Okse officer in ceremonial field armour|right|320]]
```

## Transparent shape wrapping

Use `shape` or its alias `contour` on a transparent image:

```md
![[abberath.webp|right|320|shape|gap=16]]
```

Text follows the image's alpha contour rather than its rectangular file boundary.

`shape` requires `left` or `right`. It does not apply to centred, wide or full images.

No SVG outline is required. Transparent WebP, PNG or SVG artwork can supply the contour directly. VISCERIUM's managed raster policy still requires committed raster artwork to be WebP.

## Images and columns work together

An image may sit inside a column by itself:

```md
[cols 2-1]
[col]
Main article text.
[/col]
[col]
![[image.webp|center|wide]]
[/col]
[/cols]
```

Text and a wrapped image may also share one column:

```md
[cols 1-1]
[col]
### Military organisation

![[okse-officer.webp|right|220|shape]]

Okse officers remain visible during an advance. This paragraph wraps around the figure without affecting the neighbouring column.
[/col]
[col]
Supporting material belongs here.
[/col]
[/cols]
```

Each column contains its own floats. An image cannot leak into the next column.

## Responsive behaviour

On narrow panes and mobile screens:

- columns stack;
- left and right images become centred blocks;
- shape wrapping switches off;
- image width never exceeds its current container;
- source reading order remains unchanged.

Headings, horizontal rules, callouts, tables and new column groups clear previous floats.

## Local test

1. Restart Obsidian after pulling the branch so **VISCERIUM Image Tools** loads.
2. Create or open a disposable draft note.
3. Test `left`, `right`, `center`, `wide` and a numeric width.
4. Put a normal image inside `[col]`.
5. Put text and a floated image inside the same `[col]`.
6. Test `shape` with artwork that has a genuinely transparent background.
7. Narrow the pane until the columns and wrapped images collapse.
8. Run **VISCERIUM Image Tools: Refresh article image layouts** if a Live Preview embed has not refreshed.
9. Publish a representative disposable note and run:

```bash
cd Site
npm run doctor:vault
npm run build
```

10. Confirm the public article matches Obsidian and that layout flags do not appear in the image alt text.

## Verification checklist

Use [[Checklists/005a - Article Image Layout Publication Checklist|Article Image Layout Publication Checklist]] before publication.

## Stop conditions

Do not use shaped wrapping when:

- the image has no meaningful transparency;
- the remaining text line would become too narrow;
- the image is primarily a diagram, map or table that needs uninterrupted viewing;
- the composition requires text on both sides of a centred image. Use three columns for that layout.
