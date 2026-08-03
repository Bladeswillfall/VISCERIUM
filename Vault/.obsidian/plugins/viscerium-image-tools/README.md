# VISCERIUM Image Tools

First-party Obsidian renderer for VISCERIUM article images.

## Frontmatter header images

When an open Markdown note contains:

```yaml
headerImage: example.webp
```

the plugin resolves the image from `Vault/Assets/Images` and renders it as a generated banner at the top of the note in Reading View and Live Preview.

The banner is presentation-only. It is not inserted into the Markdown body and `headerImage` remains the single source of truth shared with the public Codex.

Supported values include:

- a unique filename such as `example.webp`;
- a vault path such as `Assets/Images/example.webp`;
- an Obsidian wikilink such as `[[example.webp]]`;
- an external `https://` image URL.

The plugin uses the note's `alt` property for accessible alternative text. Set `decorativeImage: true` when the image is purely decorative.

If the property is blank, removed, ambiguous, or cannot be resolved to an image, no banner is rendered.

The visual treatment is owned by:

```text
Vault/.obsidian/snippets/Image styling.css
```

## Authored image layouts

The plugin also preserves VISCERIUM image flags in ordinary Markdown embeds:

```markdown
![[image.webp|left|320]]
![[image.webp|right|320|shape|gap=16]]
![[image.webp|center|480]]
![[image.webp|wide]]
```

Use the command **VISCERIUM Image Tools: Refresh article image layouts** to force a manual refresh after changing plugin or snippet files without restarting Obsidian.
