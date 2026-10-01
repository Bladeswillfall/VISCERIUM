# Inline artifacts

Lore remains in Vault Markdown. The site renders authored artifact containers into era-specific document treatments without changing the article's era. The Markdown inside the container is the sole source of text.

## Example

```markdown
[artifact:citadel-note date="27/08/24ce" title="An account from the chamber" condition=field hand=field ink=worn]

I couldn't look away. [marginalia note="I thought I was dead."]I couldn't move.[/marginalia]

The account continues using **ordinary Markdown** and [article links](/).

[/artifact]
```

Short artifacts render as one leaf. Long artifacts paginate by rendered size; leaf counts can differ by device and font. Readers can always choose **Original text**, which keeps marginal notes in reading order. In print, the original text is used.

## Presets

| Shortcode | Initial treatment |
| --- | --- |
| `[artifact:citadel-note]` | Parchment manuscript; handwritten ink and marginal notes. |
| `[artifact:smog-dispatch]` | Worn paper; typewritten field report. |
| `[artifact:nearsight-terminal]` | Low-light, monochrome cassette-era terminal. |
| `[artifact:entropy-diagnostic]` | Dark technical diagnostic with restrained holographic colour. |

These are presentation presets, **not era restrictions**. A CITADEL artifact may appear within an ENTROPY article.

The preset provides defaults. Optional `date="..."` and `title="..."` appear in the document header and controls. CITADEL also accepts `condition=archive|field|battered`, `hand=copy|field|urgent`, and `ink=fresh|worn|feathered`. Avoid relying on pagination as a stable reference; it is responsive.

## Marginalia

Write `[marginalia note="..."]annotated words[/marginalia]` **inside** an artifact. The enclosed words determine where the note belongs. The browser positions it beside those words on wider documents. On narrow documents it becomes a keyboard-accessible and tappable inline marker. If margin space runs out, the interactive marker remains available. Notes retain text in Original text view.

Do not insert manual pixel positions. Do not nest marginalia. Put each opening/closing pair in prose, not inside a fenced code block. Standard Markdown emphasis and links remain supported. Very large indivisible content such as a table may extend a single leaf rather than disappear.

## Implementation ownership

- Source content: `Vault/Lore/**/*.md`.
- Shortcode conversion: `Site/scripts/codex-formatting.mjs` within the existing content build pipeline.
- Feature CSS: `Site/src/styles/artifact-documents.css`.
- Feature runtime: `Site/src/lib/ui/artifact-documents.mjs`.
- Lazy loader: `Site/src/components/CodexPageFrame.astro`.
- Parser tests: `Site/tests/codex-formatting.test.mjs`.

Keep presets scoped to artifacts. Use existing site tokens for controls and shell. Manuscript lettering is an approximation; font licensing and self-hosting should be reviewed before treating these as final production assets.
