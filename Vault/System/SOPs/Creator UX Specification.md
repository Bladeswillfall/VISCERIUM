# Creator UX Specification

> **Use this specification when:** You add or change creator-vault presentation or interaction.
>
> **Result:** The interface makes the next useful action clear and keeps dense information easy to scan.
>
> **First action:** Identify the component's purpose and whether the component is interactive.

Follow [[Documentation Writing Standard]] for operational wording.

This document defines the visual and interaction grammar for the private VISCERIUM creator vault.

The goal is not to make Obsidian look decorative.

The goal is to make the next useful action obvious.

Dense worldbuilding information must remain easy to scan.

## Core rule

**Structure comes from spacing, typography, alignment and lines. Colour communicates state or location. Rounded shapes communicate interaction.**

When a component does not need colour or a rounded shape to communicate meaning, do not add either.

## Cognitive accessibility

### Support orientation and attention

1. Show the current purpose and next useful action.
2. Keep the current location and selected state visible.
3. Keep control names and positions consistent across related views.
4. Group related actions under clear headings.
5. Put alternatives and diagnostics after the normal route.

> **Why:** A stable structure helps a creator resume work after an interruption.

### Make actions and feedback clear

1. Show one primary action in each work area.
2. Label each control with the action that it performs.
3. State file-change effects before an unfamiliar or destructive action.
4. Use text or a symbol with colour to communicate state.
5. Keep entered data visible after a validation error.

### Prevent avoidable interruption

1. Do not start sound, video, or decorative motion automatically.
2. Keep important feedback visible until the creator dismisses or resolves it.
3. Preserve a visible keyboard focus state.
4. Respect the system reduced-motion preference.

## Surface grammar

| Surface | Treatment |
| --- | --- |
| Static panel, callout, section or table shell | Use spacing or a tonal surface. Add a border only when the boundary is unclear. |
| Interactive button/control | 4px radius, clear hover/focus state |
| Clickable card | 4px radius only when the whole card is genuinely interactive |
| Static badge/status label | Square. Use colour only when status matters. |
| Selected row/file/view | Subtle background plus one accent edge/marker |
| Decorative shadow | Avoid |
| Decorative gradient | Do not use |

Do not fight Obsidian's own transient UI such as modals and popovers merely to make every native corner square. These rules govern the VISCERIUM layer.

## Colour grammar

### Location colour

Location colour answers **where does this live?** It belongs primarily in the file explorer and small provenance labels.

- Lore / canonical material: cyan
- Drafts / work in progress: amber
- Stories / writing: orange
- System / creator tools: purple
- Templates / reusable structure: green
- Private: pink

Use location colour on the root marker/label. Descendants should normally return to neutral text so the explorer does not become a rainbow tree.

### State colour

State colour answers **what needs attention?** and should take precedence over location colour inside work surfaces.

- Neutral/accent: selected, focused, ordinary primary action
- Amber: pending decision, incomplete review, draft attention
- Red: error, conflict, destructive action, duplicate/canon collision
- Green: ready, valid, completed
- Cyan/blue: canonical/reference information when a distinction is useful

Priority is not automatically a warning. A Tier 1 article should not become an amber/red card merely because it is important.

## Typography hierarchy

1. **Workspace identity:** `VISCERIUM`. Use it rarely and keep it compact.
2. **Working zones:** `FOCUS`, `CONTINUE`, `CREATE`, `WRITING`, `CREATOR ACTIVITY`, `NAVIGATE`.
3. **Object titles:** Article, project, and entity names.
4. **Metadata:** Tiers, timestamps, eras, status, and file role.

Uppercase interface labels should be small and tracked. Object titles should carry more visual weight than their containers.

## Spacing rhythm

Prefer a 4px-derived rhythm:

- 4px: Micro gap.
- 8px: Compact internal gap.
- 12px: Ordinary control padding or row separation.
- 16px: Section internal spacing.
- 24px: Major section spacing.
- 32px: Rare large separation.

Avoid accumulating near-duplicate values such as 9px, 11px, 13px and 15px unless a native Obsidian constraint requires them.

## Home information architecture

Home is a **dashboard**, not a manual and not another database.

It should answer:

1. What am I focusing on?
2. Where was I?
3. What can I do next?

The default structure is:

### Header

Compact workspace identity only. Hide the ordinary note title and Properties block in both Reading View and Live Preview.

### Focus

The current high-value body of work. During migration this is **World Anvil Migration** and links directly to the `Review first` work board.

Focus is the only strong boxed panel. Its current next action is the only solid primary button on Home.

### Continue + Create + Writing

Use the main working band for day-to-day continuation:

- **Continue** owns the larger left column and shows a dense list of recent creator notes.
- **Create** sits in the right column with outlined creation controls.
- **Writing** sits below Create and shows the active StoryLine project plus a few recent scenes.

Workspace helpers are tertiary. Diagnostics do not belong beside creation controls.

### Creator Activity

Show a thin GitHub-style 52-week strip below the main working band.

The strip records distinct creator files detected as changed between vault sessions. It is passive context only:

- No streak language.
- No score.
- No completion percentage.
- No large explanatory panel.
- No repository file solely to store activity history.

Local activity history may live in browser local storage and should prune old data automatically.

### Navigate

Keep a compact route map in the dashboard footer.

Include routes to Lore, databases, Stories, and System references.

The route map helps creators remember routes that are not clear in the explorer.

Long process explanation, system-health commands and era summaries belong on dedicated System pages rather than Home.

## File explorer

- Root folders carry role colour and compact role labels.
- Descendant folder/file text is neutral by default.
- Hierarchy is expressed through indentation and a neutral guide line.
- The active file receives one semantic accent edge/background, not several simultaneous colour treatments.
- Static role labels are square micro-labels rather than pills.
- Home should appear as the first root route without being styled as a separate card.

## Bases

### Tables

Use tables for comparison, editing and triage.

- square shell
- compact rows
- strong but quiet column labels
- subtle row hover
- no decorative shadow

### Cards

Use cards only when recognition/browsing benefits from them.

- tighter gap and padding
- no hover lift
- no decorative shadow
- 4px radius only because the card is an interactive selection surface
- use colour for actionable state, not merely category or editorial tier

## Sidebars

A pane must earn the space it occupies.

Creator Context should favour:

1. Outline
2. Backlinks
3. Local Graph
4. Git as a utility tab

The right sidebar should remain collapsible and should not be treated as permanent dashboard real estate.

## CSS ownership

Prefer one stylesheet owner per visible subsystem. Consolidate old overlapping snippets before adding another override.

Current subsystem owners include:

- `Creator UI foundation`
- `File explorer`
- `Home dashboard`
- `Bases`
- `World Anvil Import triage`

Keep genuinely independent document styling and optional behaviours modular.

## Anti-patterns

Do not:

- Wrap every section in a coloured card.
- Use colour only because a semantic colour exists.
- Use rounded pills for static labels.
- Duplicate SOP content on Home.
- Give diagnostics the same visual weight as creation actions.
- Render file-system identifiers when a human-facing title exists.
- Use activity or completion-looking telemetry as a productivity score.
- Split one visible subsystem across several snippets without a strong reason.
- Add another override when an older conflicting rule should be removed instead.
