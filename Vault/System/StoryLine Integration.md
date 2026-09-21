# StoryLine Integration

StoryLine is the private/offline narrative-planning layer for VISCERIUM. Its project root is:

`Vault/Stories/`

Everything beneath `Stories/` is excluded from Codex publishing. Only `Vault/Lore/` can become public.

## Source-of-truth rule

Story projects must remain portable Markdown and YAML.

- StoryLine owns project structure, scene prose, `sequence`, `chronologicalOrder`, POV, characters, locations, status, synopsis and other story-planning fields.
- StoryLine project-local `System/` JSON may store plugin UI/layout state, but it is not authoritative story lore.
- VISCERIUM Timelines reads StoryLine scene frontmatter and builds its timeline view in memory.
- Do not manually duplicate StoryLine chronology into `calendarDate`, native Chronos blocks, or generated timeline files.

## VISCERIUM story-state layer

Write the story in StoryLine. The VISCERIUM layer should lead from the interface rather than require a separate worksheet.

StoryLine's native custom scene fields carry the five recurring scene prompts:

- **Want** — what the POV character wants in this scene;
- **Pressure** — what makes that difficult now;
- **After** — what is true after the scene that was not true before;
- **Turn** — what changes the direction of the scene;
- **Cost** — what is lost, risked, sacrificed or worsened.

The fields are seeded into the active StoryLine project's own `System/field-templates.json`. StoryLine continues to own their Inspector presentation and stores the entered values in scene frontmatter. Templater seeds or repairs the definitions on startup and on first use; do not maintain a second copy of the scene state elsewhere.

For a meaningful change that needs to carry forward, run the hotkey-enabled **Add Story Change** Templater template from the active scene. It records only the change that occurred:

- **Information** — learning, suspicion, belief, revelation, concealment or misleading;
- **Relationship** — a directional shift in trust, affection, dependence, resentment or fear;
- **Power / leverage** — authority, access, resources, obligations or position gained, lost or committed;
- **Consequence** — future pressure created by the scene, later resolved, transformed or expired.

These entries are appended to the scene's `viscerium_events` frontmatter array. Treat that array as an authored event history. Do not rewrite earlier scene events merely to make a later state look tidy.

Run the hotkey-enabled **Open Story State** Templater template to open `System/Views/Story State.md`. Dataview derives four read-only working views from the StoryLine scenes:

1. Current Pressures
2. Character State
3. Information Map
4. Relationships / Power

Derived current state is deliberately not written back into scene YAML. Edit the source scene when the story changes; let the view recalculate the result.

No tracked story-change module is mandatory. A simple scene can use only Want, Pressure and After. Add structured changes only when the change matters beyond the current scene.

## Story dates

For StoryLine scenes, `storyDate` is the single date field used by the VISCERIUM story-timeline adapter.

Preferred readable form:

```yaml
storyDate: "16 Sólmanuthur, 9250"
```

Compact form:

```yaml
storyDate: "9250-solmanuthur-16"
```

Explicit calendar form:

```yaml
storyDate: "okse:16 Sólmanuthur, 9250"
```

StoryLine can continue to use `chronologicalOrder` for its chronological scene ordering. VISCERIUM Timelines converts `storyDate` to the registered fictional calendar only when rendering the story timeline.

Scenes without a supported `storyDate` remain valid StoryLine scenes. They are simply listed as unplaced in the VISCERIUM story-timeline view until a date is supplied.

## Open the VISCERIUM story timeline

Run **VISCERIUM Timelines: Open StoryLine project timeline** from the command palette.

The bridge resolves the project from, in order:

1. an active StoryLine project/scene Markdown file beneath `Stories/`;
2. StoryLine's live `activeProjectFile` setting, which also works from Corkboard, PlotGrid, Timeline and other StoryLine custom views;
3. StoryLine's saved `data.json` active project;
4. the sole StoryLine project beneath `Stories/`, when exactly one exists.

The generated view reads that project's `Scenes/` folder and opens scene notes when timeline entries are selected. No shortcode is inserted into the project and no generated timeline file is written.

Use **VISCERIUM Timelines: Diagnose StoryLine integration** when troubleshooting. It reports whether StoryLine is loaded, the configured root, active project, discovered project/scene counts, dated scenes, and scenes that can be placed on the VISCERIUM calendar.

## Plugin setup

StoryLine's executable bundle is managed normally by Obsidian Community Plugins. Its plugin ID is `storyline`.

`Vault/.obsidian/plugins/storyline/data.json` is plugin-managed, device-local, and ignored by Git. It may expand to contain StoryLine's complete settings after first use. The required local invariant is:

```json
{
  "storyLineRoot": "Stories"
}
```

The active project may also be stored there as `activeProjectFile`. VISCERIUM Timelines and the story-state helpers intentionally read that value rather than asking authors to duplicate project selection elsewhere. Pulls and repository maintenance therefore leave each creator's active-project state untouched.

VISCERIUM Timelines is maintained in this repository and its runnable bundle is tracked beneath:

`Vault/.obsidian/plugins/viscerium-timelines/`

That plugin is enabled alongside StoryLine and Chronos, so pulling the vault is sufficient to install the bridge. The source remains in `Tools/obsidian-viscerium-timelines/`, and CI rebuilds the same bundle for verification.

The VISCERIUM story-state workflow additionally relies on the already-required Templater and Dataview plugins. Its Templater user script is `Templates/_Scripts/storyline_state.js`; the derived view is `System/Views/Story State.md`.

## Canonical Lore as StoryLine source material

StoryLine supports Additional Source Folders and can route external `type: character`, `type: location`, `type: world`, scene, and enabled Codex-category notes into its views. However, those external files are editable from StoryLine and may be modified by it.

Do not point StoryLine at all of `Lore/` by default. Shared canon folders should only be added after their frontmatter schema has been checked for StoryLine write-compatibility. Story-specific entities should stay inside the StoryLine project/series Codex until that compatibility decision is made.
