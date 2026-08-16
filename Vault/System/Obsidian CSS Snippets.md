# Obsidian CSS Snippets

The vault keeps Obsidian presentation tweaks in:

`Vault/.obsidian/snippets/`

Use **MySnippets** to toggle files while testing the creator UI.

Use **Settings → Style Settings** for deliberate variants exposed by an enabled snippet. Shared VISCERIUM defaults are tracked in `.obsidian/plugins/obsidian-style-settings/data.json`; do not create a parallel snippet just to represent another appearance of the same component.

Read [[System/SOPs/Creator UX Specification|Creator UX Specification]] before adding or substantially changing presentation rules.

## Visual grammar

The creator vault follows one shared rule:

**Structure comes from spacing, typography, alignment and lines. Colour communicates state or location. Rounded shapes communicate interaction.**

`Creator UI foundation` owns the shared spacing, radius, surface and semantic-colour vocabulary. Other snippets should consume those variables rather than inventing near-duplicate values.

Static VISCERIUM surfaces such as callouts, tables, embeds, image frames and code blocks are square. Interactive controls/cards may use the small control radius. Hashtags stay restrained by default with the Compact treatment; the fully rounded Pretty Pills treatment is an explicit Style Settings option rather than a vault-wide metadata default.

## Snippet ownership

Prefer one owner per visible subsystem. Do not split one component across several toggles unless the behaviours are genuinely independent.

A visual variant belongs inside its existing component owner where possible. `Tag styling`, `Callout styling` and `Hover previews` therefore own their Style Settings variants rather than relying on separate Pretty Tags, Strong Callouts or Bigger Popovers files.

### Foundation

- **Creator UI foundation** - shared spacing, radii and semantic colours.

### Workspace

- **File explorer** - explorer density, hierarchy, root role markers/labels, active-file state and Home placement.
- **Compact tabs** - tab density.
- **Scrollbars** - scrollbar treatment.
- **Outline panel** - outline density/presentation.
- **Search results** - search-result presentation.

Folder icons are owned by **Iconic**, not CSS.

The explorer uses location colour only where it adds information:

- Lore - cyan marker / `CANON`;
- Stories - orange marker / `WRITING`;
- Drafts - amber marker / `WIP`;
- Private - rose marker / `PRIVATE`;
- System - violet marker / `TOOLS`;
- Templates - mint marker / `REUSE`.

Nested folders and ordinary files are neutral. The active file may reuse its root location colour as one small edge/background cue. Article-wide descendant tinting is deliberately removed.

### Home

- **Home dashboard** - all Home layout, hierarchy, responsive behaviour, controls and compact activity strip.

[[Home]] is an interface rather than long-form prose, so this snippet also lets it use the available pane width and suppresses the duplicate inline title/Properties chrome in both Reading View and Live Preview.

Home currently contains:

1. **Focus** - the current high-value body of work;
2. **Continue** - recent creator notes;
3. **Create** - creation controls;
4. **Writing** - active StoryLine project context;
5. **Creator Activity** - a thin 52-week local activity history;
6. **Navigate** - persistent quick links that act as the dashboard footer.

Focus is the only strong panel. Continue, Create, Writing, Creator Activity and Navigate should rely on headings, rules and spacing rather than repeated boxed cards.

The activity strip is not a streak, score or completion metric. It records distinct creator files detected as changed between vault sessions. Tracking state and history live in browser local storage, so the feature does not create repository churn.

### Bases

- **Bases** - generic compact cards and dense table views.
- **World Anvil Import triage** - migration-specific state presentation.

Use tables for comparison/editing and cards when visual recognition is genuinely useful.

World Anvil triage colour means migration state, not editorial importance:

- red - conflict;
- amber - structural decision;
- blue - reference/link repair;
- green - ready;
- neutral - ordinary/low-priority review.

### Reading and rendered content

- Article widths
- Heading hierarchy
- Paragraph spacing
- Link styling
- Blockquote styling
- Code block styling
- Horizontal rules
- Compact properties
- Table styling
- Image styling
- Callout styling
- Embed styling
- Timeline styling
- Tag styling
- Checkbox styling
- Hover previews
- List hierarchy
- Text accents

`Article widths` owns the responsive article lane for ordinary Markdown notes in Reading View and Live Preview. It widens the header image, Properties block, article body, tables, callouts and embeds together while preserving safe gutters. `Home dashboard` remains the owner for [[Home]].

`Tag styling` defaults to **Compact** and also exposes **Pretty Pills** and **Minimal** appearances in Style Settings. Pretty Pills remains available for intentional use but is not the repository-wide fallback. The implementation follows Baseline/Obsidian colour variables and covers Reading View plus CM6 Live Preview; do not add another hashtag/pill snippet alongside it.

`Callout styling` exposes **Balanced**, **Strong edge** and **Bar only** variants. `Hover previews` exposes **Compact**, **Comfortable** and **Large** desktop sizes while retaining explicit narrow-pane constraints.

`List hierarchy` owns the optional nested-list relationship guides and bullet-level variation. Both are disabled by default. `Text accents` owns optional Soft/Marker highlights and compact footnotes; theme-default highlights and normal footnotes remain the shared defaults.

`Timeline styling` is the Obsidian presentation bridge for Chronos and the shared VISCERIUM timeline renderer. It does not introduce timeline syntax or duplicate chronology metadata.

The old Obsidian-only Dataview infobox/sidebar remains removed. Templates should use clean frontmatter for structured data and ordinary Markdown for article content.

### Behavioural

- **Autohide properties** - collapses the ordinary Live Preview Properties block until hovered/focused.

Home explicitly opts out of this behaviour because its document chrome is hidden entirely.

## Removed snippets

The following older snippets were folded into clearer subsystem owners or removed as unused:

- Active file indicator
- Article list colors
- Bases cards
- Bases table
- Compact file explorer
- Compact status bar
- Folder colors
- Folder hierarchy
- List spacing
- MySnippets menu
- VISCERIUM Home file
- VISCERIUM Homepage
- VISCERIUM Homepage responsive
- VISCERIUM UI tokens
- Workspace labels

Do not recreate one of these as another parallel override. Change the owning subsystem snippet instead.

## Article width

`Article widths.css` owns ordinary Markdown sizing. It applies the same centred, responsive lane to Reading View and Live Preview, with a `92rem` maximum and gutters that contract safely in narrow panes.

Do not add competing global `markdown-preview-sizer`, `.cm-sizer`, readable-line-width or theme overrides in another snippet. Change `Article widths.css` when ordinary article sizing needs adjustment.

[[Home]] is excluded because it is a dashboard rather than prose. `Home dashboard.css` owns that page's full-width layout.

## MySnippets plugin

The enabled community-plugin list includes `mysnippets-plugin`. The repository vendors its compatibility runtime so a normal Git pull delivers the working plugin code and configuration.

Original repository: https://github.com/chetachiezikeuzor/MySnippets-Plugin

Compatibility baseline: https://github.com/Moyf/MySnippets

Local notes: `Vault/.obsidian/plugins/mysnippets-plugin/COMPATIBILITY.md`

## Compatibility rule

Prefer CSS that styles Obsidian's UI and rendered Markdown without requiring extra frontmatter, special tags, image syntax or duplicate layout conventions.

If a visual feature requires authoring syntax, it should use syntax already supported by the Codex or be implemented through an automated shared renderer. Do not create separate authoring conventions for Obsidian and the public Codex.

Creator-only control surfaces such as [[Home]] may use a dedicated `cssclasses` value when clearly scoped to the interface note rather than ordinary lore content.
