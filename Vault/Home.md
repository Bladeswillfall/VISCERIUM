---
cssclasses:
  - viscerium-home
---
> [!home-header]
> # VISCERIUM
> **CREATOR VAULT · ERRACK**
> `Lore/` · `Drafts/` · `Stories/` · `System/`

> [!home-focus] FOCUS
> ### World Anvil Migration
> Review the setting spine and era anchors before spending time polishing secondary material.
>
> ```dataviewjs
> const row = dv.container.createDiv({ cls: "vc-home-focus-actions" });
> const openButton = row.createEl("button", {
>   text: "Open Review First",
>   cls: "vc-home-button vc-home-button-primary",
>   attr: { title: "Open the World Anvil Import Base. Review first is the default priority view." },
> });
> openButton.addEventListener("click", () => app.workspace.openLinkText("System/Bases/World Anvil Import.base", "Home.md"));
>
> const guideButton = row.createEl("button", {
>   text: "Migration Guide",
>   cls: "vc-home-button vc-home-button-secondary",
> });
> guideButton.addEventListener("click", () => app.workspace.openLinkText("Drafts/Inbox/World Anvil Migration Review", "Home.md"));
> ```
>
> **Priority:** Tier 1 → Tier 2 → Tier 3 → Tier 4  
> **Work order:** Existing matches → Duplicate titles → Type decisions → Era editions → Missing era
>
> → [[System/Creator Tasks|All creator tasks]]

> [!home-navigate] CHRONICLE
> ```dataviewjs
> await dv.view("System/Views/Chronicle/Hub", { compact: true })
> ```

> [!home-workspace]
> > [!home-continue] CONTINUE
> > ![[System/Bases/Lore Registry.base#Recently edited]]
> >
> > → [[System/Bases/Lore Registry.base|Open the full Lore Registry]]
>
> > [!home-side]
> > > [!home-create] CREATE
> > > ```dataviewjs
> > > const templaterCreateCommand = (templatePath) => `templater-obsidian:create-${templatePath}`;
> > >
> > > const openCreatorContext = async () => {
> > >   for (const leaf of app.workspace.getLeavesOfType("graph")) leaf.detach();
> > >   const views = [
> > >     { type: "outline", name: "Outline" },
> > >     { type: "backlink", name: "Backlinks" },
> > >     { type: "localgraph", name: "Local Graph" },
> > >   ];
> > >   let firstCreatorLeaf = null;
> > >   for (const view of views) {
> > >     const existing = app.workspace.getLeavesOfType(view.type)[0];
> > >     if (existing) {
> > >       firstCreatorLeaf ??= existing;
> > >       continue;
> > >     }
> > >     const leaf = app.workspace.getRightLeaf(true);
> > >     if (!leaf) continue;
> > >     await leaf.setViewState({ type: view.type, active: false });
> > >     firstCreatorLeaf ??= leaf;
> > >   }
> > >   if (firstCreatorLeaf) await app.workspace.revealLeaf(firstCreatorLeaf);
> > > };
> > >
> > > const primary = [
> > >   {
> > >     label: "+ Story Entity",
> > >     id: templaterCreateCommand("Templates/Databases/New Story Entity.md"),
> > >     title: "Create fauna, flora, fungi or an item.",
> > >   },
> > >   {
> > >     label: "+ Lore Entity",
> > >     id: templaterCreateCommand("Templates/Lore/New Lore Entity.md"),
> > >     title: "Create a character, faction, location, event or species.",
> > >   },
> > >   {
> > >     label: "+ Myrkild Unit",
> > >     id: templaterCreateCommand("Templates/Databases/New Myrkild Unit.md"),
> > >     title: "Create a structured Myrkild unit.",
> > >   },
> > > ];
> > >
> > > const primaryStrip = dv.container.createDiv({ cls: "vc-home-create-primary" });
> > > for (const action of primary) {
> > >   const button = primaryStrip.createEl("button", {
> > >     text: action.label,
> > >     cls: "vc-home-button vc-home-button-create",
> > >     attr: { title: action.title },
> > >   });
> > >   const exists = Boolean(app.commands.commands[action.id]);
> > >   if (!exists) {
> > >     button.disabled = true;
> > >     button.title = "Required Obsidian command is unavailable. See Creator Command Reference.";
> > >   } else {
> > >     button.addEventListener("click", () => app.commands.executeCommandById(action.id));
> > >   }
> > > }
> > >
> > > const secondaryStrip = dv.container.createDiv({ cls: "vc-home-create-secondary" });
> > > const secondary = [
> > >   { label: "Creator Context", run: openCreatorContext },
> > >   {
> > >     label: "Story Timeline",
> > >     id: "viscerium-timelines:open-storyline-project-timeline",
> > >     unavailable: "VISCERIUM Timelines is unavailable. See Creator Command Reference.",
> > >   },
> > > ];
> > > for (const action of secondary) {
> > >   const button = secondaryStrip.createEl("button", {
> > >     text: action.label,
> > >     cls: "vc-home-button vc-home-button-tertiary",
> > >   });
> > >   const exists = Boolean(action.run) || Boolean(app.commands.commands[action.id]);
> > >   if (!exists) {
> > >     button.disabled = true
> > >     button.title = action.unavailable ?? "This action is unavailable. See Creator Command Reference."
> > >   }
> > >   else button.addEventListener("click", () => action.run ? action.run() : app.commands.executeCommandById(action.id));
> > > }
> > > ```
> > > → [[System/SOPs/Creator Command Reference|Command reference]]
> >
> > > [!home-writing] WRITING
> > > ```dataviewjs
> > > const settingsPath = ".obsidian/plugins/storyline/data.json";
> > > let settings = {};
> > > try {
> > >   settings = JSON.parse(await app.vault.adapter.read(settingsPath));
> > > } catch (error) {
> > >   console.warn("StoryLine settings could not be read from Home.", error);
> > > }
> > >
> > > const activeProjectFile = settings.activeProjectFile;
> > > if (!activeProjectFile) {
> > >   dv.paragraph("No active StoryLine project configured.");
> > > } else {
> > >   const projectDir = activeProjectFile.slice(0, activeProjectFile.lastIndexOf("/"));
> > >   const scenesPrefix = `${projectDir}/Scenes/`;
> > >   const scenes = dv.pages("")
> > >     .where((page) => page.file.path.startsWith(scenesPrefix))
> > >     .sort((page) => page.file.mtime, "desc");
> > >   const dated = scenes.where((page) => Boolean(page.storyDate)).length;
> > >
> > >   const desk = dv.container.createDiv({ cls: "vc-home-writing-desk" });
> > >   const project = desk.createDiv({ cls: "vc-home-writing-project" });
> > >   const projectName = activeProjectFile.split("/").pop().replace(/\.md$/i, "");
> > >   const projectLink = project.createEl("a", {
> > >     text: projectName,
> > >     cls: "internal-link vc-home-writing-project-link",
> > >     attr: { href: activeProjectFile, "data-href": activeProjectFile },
> > >   });
> > >   projectLink.addEventListener("click", (event) => {
> > >     event.preventDefault();
> > >     app.workspace.openLinkText(activeProjectFile, "Home.md", event.ctrlKey || event.metaKey);
> > >   });
> > >   project.createSpan({
> > >     text: `${scenes.length} scene${scenes.length === 1 ? "" : "s"} · ${dated} dated`,
> > >     cls: "vc-home-writing-meta",
> > >   });
> > >
> > >   const recentScenes = Array.from(scenes).slice(0, 3);
> > >   if (recentScenes.length > 0) {
> > >     const list = desk.createDiv({ cls: "vc-home-writing-scenes" });
> > >     for (const scene of recentScenes) {
> > >       const row = list.createDiv({ cls: "vc-home-writing-scene" });
> > >       const link = row.createEl("a", {
> > >         text: String(scene.title ?? scene.file.name),
> > >         cls: "internal-link vc-home-writing-scene-link",
> > >         attr: { href: scene.file.path, "data-href": scene.file.path },
> > >       });
> > >       link.addEventListener("click", (event) => {
> > >         event.preventDefault();
> > >         app.workspace.openLinkText(scene.file.path, "Home.md", event.ctrlKey || event.metaKey);
> > >       });
> > >       row.createSpan({
> > >         text: scene.storyDate ? String(scene.storyDate) : (scene.file.mtime.toRelative() ?? scene.file.mtime.toFormat("dd LLL yyyy")),
> > >         cls: "vc-home-writing-scene-meta",
> > >       });
> > >     }
> > >   }
> > > }
> > > ```

> [!home-navigate] PROJECT STATUS
> **Needs attention**
>
> ![[System/Bases/Needs Attention.base#Homepage]]
>
> → [[System/Bases/Needs Attention.base|Open all issues]]
>
> **Structurally ready**
>
> ![[System/Bases/Publishing.base#Homepage]]
>
> *Structurally ready means the required publishing fields exist. It is not an editorial approval.*
>
> → [[System/Bases/Publishing.base|Open the publishing gate]]

> [!home-activity] CREATOR ACTIVITY
> ```dataviewjs
> const activityKey = `viscerium-creator-activity:v2:${app.vault.getName()}`;
> let activity = { days: {} };
> try {
>   activity = JSON.parse(localStorage.getItem(activityKey) ?? "{}") ?? {};
> } catch (error) {
>   console.warn("VISCERIUM creator activity could not be read from local storage.", error);
> }
> const days = activity.days ?? {};
> const dayKey = (date) => {
>   const year = date.getFullYear();
>   const month = String(date.getMonth() + 1).padStart(2, "0");
>   const day = String(date.getDate()).padStart(2, "0");
>   return `${year}-${month}-${day}`;
> };
>
> const today = new Date();
> today.setHours(0, 0, 0, 0);
> const start = new Date(today);
> start.setDate(start.getDate() - start.getDay() - (51 * 7));
>
> const activityRow = dv.container.createDiv({ cls: "vc-home-activity-row" });
> const scroll = activityRow.createDiv({ cls: "vc-home-activity-scroll" });
> const heatmap = scroll.createDiv({ cls: "vc-home-heatmap" });
> let total = 0;
> for (let index = 0; index < 364; index += 1) {
>   const date = new Date(start);
>   date.setDate(start.getDate() + index);
>   const key = dayKey(date);
>   const count = Number(days[key] ?? 0);
>   total += count;
>   const level = count === 0 ? 0 : Math.min(4, count);
>   const cell = heatmap.createDiv({ cls: "vc-home-heatmap-cell" });
>   cell.dataset.level = String(level);
>   cell.title = `${key} · ${count} changed file${count === 1 ? "" : "s"}`;
> }
> activityRow.createDiv({
>   text: `${total} changed file${total === 1 ? "" : "s"} · 52 weeks`,
>   cls: "vc-home-activity-summary",
> });
> ```

> [!home-navigate] NAVIGATE
> ```dataviewjs
> const groups = [
>   {
>     title: "LORE",
>     links: [
>       ["CITADEL", "Lore/Eras/CITADEL"],
>       ["SMOG", "Lore/Eras/SMOG"],
>       ["NEARSIGHT", "Lore/Eras/NEARSIGHT"],
>       ["ENTROPY", "Lore/Eras/ENTROPY"],
>     ],
>   },
>   {
>     title: "DATABASES",
>     links: [
>       ["Lore Registry", "System/Bases/Lore Registry.base"],
>       ["Needs Attention", "System/Bases/Needs Attention.base"],
>       ["Publishing", "System/Bases/Publishing.base"],
>       ["Story Entities", "System/Bases/Story Entities.base"],
>       ["Myrkild Units", "System/Bases/Myrkild Units.base"],
>       ["World Anvil Import", "System/Bases/World Anvil Import.base"],
>     ],
>   },
>   {
>     title: "STORIES",
>     links: [
>       ["StoryLine integration", "System/StoryLine Integration"],
>       ["Storyteller workflow", "System/SOPs/Storyteller View SOP"],
>     ],
>   },
>   {
>     title: "TOOLS",
>     links: [
>       ["Chronicle", "System/Chronicle"],
>       ["SOP Index", "System/SOPs/SOP Index"],
>       ["Publishing Rules", "System/Publishing Rules"],
>       ["Creator UX", "System/SOPs/Creator UX Specification"],
>       ["Creator Sidebar", "System/Creator Sidebar"],
>     ],
>   },
> ];
>
> const grid = dv.container.createDiv({ cls: "vc-home-nav-grid" });
> for (const group of groups) {
>   const section = grid.createDiv({ cls: "vc-home-nav-group" });
>   section.createDiv({ text: group.title, cls: "vc-home-nav-heading" });
>   for (const [label, target] of group.links) {
>     const link = section.createEl("a", {
>       text: label,
>       cls: "internal-link vc-home-nav-link",
>       attr: { href: target, "data-href": target },
>     });
>     link.addEventListener("click", (event) => {
>       event.preventDefault();
>       app.workspace.openLinkText(target, "Home.md", event.ctrlKey || event.metaKey);
>     });
>   }
> }
> ```
