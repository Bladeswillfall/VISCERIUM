---
cssclasses:
  - viscerium-home
headerImage: Assets/Images/viscerium-banner.webp
decorativeImage: true
focusTitle: World Anvil Migration
focusDescription: Review the setting spine and era anchors before polishing secondary material.
focusPrimary: System/Bases/World Anvil Import.base
focusPrimaryLabel: Open review first
focusSecondary: Drafts/Inbox/World Anvil Migration Review
focusSecondaryLabel: Migration guide
---
> [!home-hero]
> # VISCERIUM
> **CREATOR VAULT · ERRACK**

> [!home-priority]
> > [!home-focus] CURRENT FOCUS
> > ```dataviewjs
> > const page = dv.current();
> > const root = dv.container.createDiv({ cls: "vc-home-focus-body" });
> > const title = String(page.focusTitle ?? "Current focus").trim();
> > const description = String(page.focusDescription ?? "").trim();
> > root.createDiv({ text: title, cls: "vc-home-focus-title" });
> > if (description) root.createDiv({ text: description, cls: "vc-home-focus-description" });
> > const actions = root.createDiv({ cls: "vc-home-focus-actions" });
> > const addButton = (label, target, primary = false) => {
> >   if (!target) return;
> >   const button = actions.createEl("button", {
> >     text: String(label),
> >     cls: `vc-home-button ${primary ? "vc-home-button-primary" : "vc-home-button-secondary"}`,
> >   });
> >   button.addEventListener("click", () => app.workspace.openLinkText(String(target), page.file.path));
> > };
> > addButton(page.focusPrimaryLabel ?? "Open focus", page.focusPrimary, true);
> > addButton(page.focusSecondaryLabel ?? "Open context", page.focusSecondary, false);
> > ```
>
> > [!home-create] CREATE
> > ```dataviewjs
> > const sourcePath = dv.current().file.path;
> > const root = dv.container.createDiv({ cls: "vc-home-create-root" });
> > const SVG_NS = "http://www.w3.org/2000/svg";
> > const icons = {
> >   plus: "M11 4a1 1 0 0 1 2 0v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4Z",
> >   lore: "M4 4h6v16H4V4Zm10 0h6v16h-6V4ZM9 6h6v2H9V6Zm0 10h6v2H9v-2Z",
> >   story: "M5 3h12a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2V3Zm2 3v2h9V6H7Zm0 4v2h7v-2H7Z",
> >   myrkild: "M12 2 4 5v6c0 5.2 3.4 9.4 8 11 4.6-1.6 8-5.8 8-11V5l-8-3Zm0 4 4 1.5V11c0 3.2-1.7 5.9-4 7.2-2.3-1.3-4-4-4-7.2V7.5L12 6Z",
> >   context: "M3 4h18v4H3V4Zm0 6h8v10H3V10Zm10 0h8v10h-8V10Z",
> >   timeline: "M4 3h2v18H4V3Zm4 3h12v4H8V6Zm0 8h8v4H8v-4Z",
> > };
> > const appendIcon = (element, name) => {
> >   const svg = document.createElementNS(SVG_NS, "svg");
> >   svg.setAttribute("viewBox", "0 0 24 24");
> >   svg.setAttribute("aria-hidden", "true");
> >   svg.classList.add("vc-home-button-icon");
> >   const path = document.createElementNS(SVG_NS, "path");
> >   path.setAttribute("d", icons[name]);
> >   path.setAttribute("fill", "currentColor");
> >   svg.append(path);
> >   element.prepend(svg);
> > };
> > const toggle = root.createEl("button", {
> >   text: "Create",
> >   cls: "vc-home-button vc-home-create-toggle",
> >   attr: { "aria-expanded": "false", title: "Show or hide creation shortcuts." },
> > });
> > appendIcon(toggle, "plus");
> > const panel = root.createDiv({ cls: "vc-home-create-panel" });
> > panel.hidden = true;
> > toggle.addEventListener("click", () => {
> >   const open = panel.hidden;
> >   panel.hidden = !open;
> >   root.classList.toggle("is-open", open);
> >   toggle.classList.toggle("is-open", open);
> >   toggle.setAttribute("aria-expanded", String(open));
> > });
> > const templaterCreateCommand = (templatePath) => `templater-obsidian:create-${templatePath}`;
> > const addGroup = (title) => {
> >   const section = panel.createDiv({ cls: "vc-home-create-group" });
> >   section.createDiv({ text: title, cls: "vc-home-create-heading" });
> >   return section.createDiv({ cls: "vc-home-create-grid" });
> > };
> > const addAction = (parent, { label, icon, commandId, run, title }) => {
> >   const button = parent.createEl("button", {
> >     text: label,
> >     cls: "vc-home-button vc-home-button-action",
> >     attr: { title },
> >   });
> >   appendIcon(button, icon);
> >   const available = Boolean(run) || Boolean(app.commands.commands[commandId]);
> >   if (!available) {
> >     button.disabled = true;
> >     button.title = "Required Obsidian command is unavailable.";
> >   } else {
> >     button.addEventListener("click", () => run ? run() : app.commands.executeCommandById(commandId));
> >   }
> > };
> > const worldbuilding = addGroup("WORLDBUILDING");
> > addAction(worldbuilding, {
> >   label: "Lore Entity", icon: "lore",
> >   commandId: templaterCreateCommand("Templates/Lore/New Lore Entity.md"),
> >   title: "Create a character, faction, location, event or species.",
> > });
> > const storyEntities = addGroup("STORY ENTITIES");
> > addAction(storyEntities, {
> >   label: "Story Entity", icon: "story",
> >   commandId: templaterCreateCommand("Templates/Databases/New Story Entity.md"),
> >   title: "Create fauna, flora, fungi or an item.",
> > });
> > const myrkild = addGroup("MYRKILD");
> > addAction(myrkild, {
> >   label: "Myrkild Unit", icon: "myrkild",
> >   commandId: templaterCreateCommand("Templates/Databases/New Myrkild Unit.md"),
> >   title: "Create a structured Myrkild unit.",
> > });
> > const tools = addGroup("TOOLS");
> > addAction(tools, {
> >   label: "Creator Context", icon: "context", title: "Open Outline, Backlinks and Local Graph.",
> >   run: async () => {
> >     for (const leaf of app.workspace.getLeavesOfType("graph")) leaf.detach();
> >     const views = ["outline", "backlink", "localgraph"];
> >     let firstLeaf = null;
> >     for (const type of views) {
> >       const existing = app.workspace.getLeavesOfType(type)[0];
> >       if (existing) { firstLeaf ??= existing; continue; }
> >       const leaf = app.workspace.getRightLeaf(true);
> >       if (!leaf) continue;
> >       await leaf.setViewState({ type, active: false });
> >       firstLeaf ??= leaf;
> >     }
> >     if (firstLeaf) await app.workspace.revealLeaf(firstLeaf);
> >   },
> > });
> > addAction(tools, {
> >   label: "Story Timeline", icon: "timeline",
> >   commandId: "viscerium-timelines:open-storyline-project-timeline",
> >   title: "Open the active StoryLine project timeline.",
> > });
> > const footer = panel.createDiv({ cls: "vc-home-create-footer" });
> > const reference = footer.createEl("a", {
> >   text: "Command reference →",
> >   cls: "internal-link vc-home-inline-link",
> >   attr: { href: "System/SOPs/Creator Command Reference", "data-href": "System/SOPs/Creator Command Reference" },
> > });
> > reference.addEventListener("click", (event) => {
> >   event.preventDefault();
> >   app.workspace.openLinkText("System/SOPs/Creator Command Reference", sourcePath, event.ctrlKey || event.metaKey);
> > });
> > ```

> [!home-continue] CONTINUE WORKING
> ```dataviewjs
> const sourcePath = dv.current().file.path;
> const root = dv.container.createDiv({ cls: "vc-home-continue-grid" });
> const internalLink = (parent, label, target, className = "vc-home-row-link") => {
>   const link = parent.createEl("a", {
>     text: label,
>     cls: `internal-link ${className}`,
>     attr: { href: target, "data-href": target },
>   });
>   link.addEventListener("click", (event) => {
>     event.preventDefault();
>     app.workspace.openLinkText(target, sourcePath, event.ctrlKey || event.metaKey);
>   });
>   return link;
> };
> const relativeTime = (value) => {
>   try { return value?.toRelative?.() ?? value?.toFormat?.("dd LLL") ?? ""; }
>   catch { return ""; }
> };
> const column = (title, kicker) => {
>   const section = root.createDiv({ cls: "vc-home-continue-column" });
>   const heading = section.createDiv({ cls: "vc-home-column-heading" });
>   heading.createDiv({ text: title, cls: "vc-home-column-title" });
>   heading.createDiv({ text: kicker, cls: "vc-home-column-kicker" });
>   return section;
> };
> const world = column("Worldbuilding", "recent lore + drafts");
> const worldList = world.createDiv({ cls: "vc-home-recent-list" });
> const worldPages = Array.from(
>   dv.pages("")
>     .where((page) => page.file.path.startsWith("Lore/") || page.file.path.startsWith("Drafts/"))
>     .sort((page) => page.file.mtime, "desc")
> ).slice(0, 5);
> if (worldPages.length === 0) worldList.createDiv({ text: "No recent worldbuilding edits.", cls: "vc-home-empty" });
> for (const page of worldPages) {
>   const row = worldList.createDiv({ cls: "vc-home-recent-row" });
>   const main = row.createDiv({ cls: "vc-home-recent-main" });
>   const area = page.file.path.startsWith("Lore/") ? "CANON" : "WIP";
>   main.createSpan({ text: area, cls: `vc-home-area vc-home-area-${area.toLowerCase()}` });
>   internalLink(main, String(page.title ?? page.file.name), page.file.path);
>   row.createSpan({ text: relativeTime(page.file.mtime), cls: "vc-home-row-time" });
> }
> const worldFooter = world.createDiv({ cls: "vc-home-column-footer" });
> internalLink(worldFooter, "Open Lore Registry →", "System/Bases/Lore Registry.base", "vc-home-inline-link");
> const stories = column("Stories", "active StoryLine project");
> const storyList = stories.createDiv({ cls: "vc-home-recent-list" });
> let settings = {};
> try { settings = JSON.parse(await app.vault.adapter.read(".obsidian/plugins/storyline/data.json")); }
> catch (error) { console.warn("StoryLine settings could not be read from Home.", error); }
> const activeProjectFile = String(settings.activeProjectFile ?? "").trim();
> if (!activeProjectFile) {
>   storyList.createDiv({ text: "No active StoryLine project configured.", cls: "vc-home-empty" });
>   const footer = stories.createDiv({ cls: "vc-home-column-footer" });
>   internalLink(footer, "StoryLine integration →", "System/StoryLine Integration", "vc-home-inline-link");
> } else {
>   const projectDir = activeProjectFile.slice(0, activeProjectFile.lastIndexOf("/"));
>   const scenesPrefix = `${projectDir}/Scenes/`;
>   const projectName = activeProjectFile.split("/").pop().replace(/\.md$/i, "");
>   const scenes = Array.from(dv.pages("").where((page) => page.file.path.startsWith(scenesPrefix)).sort((page) => page.file.mtime, "desc"));
>   const dated = scenes.filter((page) => Boolean(page.storyDate)).length;
>   const projectRow = storyList.createDiv({ cls: "vc-home-story-project" });
>   const projectMain = projectRow.createDiv({ cls: "vc-home-recent-main" });
>   projectMain.createSpan({ text: "PROJECT", cls: "vc-home-area vc-home-area-writing" });
>   internalLink(projectMain, projectName, activeProjectFile, "vc-home-row-link vc-home-row-link-strong");
>   projectRow.createSpan({ text: `${scenes.length} scene${scenes.length === 1 ? "" : "s"} · ${dated} dated`, cls: "vc-home-row-time" });
>   for (const scene of scenes.slice(0, 4)) {
>     const row = storyList.createDiv({ cls: "vc-home-recent-row" });
>     const main = row.createDiv({ cls: "vc-home-recent-main" });
>     main.createSpan({ text: "SCENE", cls: "vc-home-area vc-home-area-writing" });
>     internalLink(main, String(scene.title ?? scene.file.name), scene.file.path);
>     row.createSpan({ text: scene.storyDate ? String(scene.storyDate) : relativeTime(scene.file.mtime), cls: "vc-home-row-time" });
>   }
>   const footer = stories.createDiv({ cls: "vc-home-column-footer" });
>   internalLink(footer, "Open active story →", activeProjectFile, "vc-home-inline-link");
> }
> ```

> [!home-attention] NEEDS ATTENTION
> ```dataviewjs
> const sourcePath = dv.current().file.path;
> const root = dv.container.createDiv({ cls: "vc-home-attention-root" });
> const ERA_SENSITIVE_TYPES = new Set(["character", "faction", "location", "event", "species", "fauna", "flora", "fungi", "item", "myrkild-unit"]);
> const isEmpty = (value) => value == null || (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0) || (typeof value?.length === "number" && value.length === 0);
> const asArray = (value) => value == null ? [] : Array.isArray(value) ? value.filter((entry) => entry != null) : typeof value?.array === "function" ? value.array().filter((entry) => entry != null) : [value];
> const eraCount = (page) => asArray(page.eras).length || (isEmpty(page.era) ? 0 : 1);
> const analyse = (page) => {
>   const labels = [];
>   let count = 0;
>   if (isEmpty(page.title)) { labels.push("Missing title"); count += 1; }
>   if (isEmpty(page.description)) { labels.push("Missing description"); count += 1; }
>   if (isEmpty(page.type)) { labels.push("Missing type"); count += 1; }
>   if (ERA_SENSITIVE_TYPES.has(String(page.type ?? "")) && eraCount(page) === 0) { labels.push("Missing era"); count += 1; }
>   const migrationIssues = asArray(page.import_issues).length;
>   if (migrationIssues > 0) { labels.push(`${migrationIssues} migration issue${migrationIssues === 1 ? "" : "s"}`); count += migrationIssues; }
>   const severity = count >= 4 ? "critical" : count === 3 ? "urgent" : count === 2 ? "elevated" : "notice";
>   return { page, labels, count, severity };
> };
> const internalLink = (parent, label, target, className = "vc-home-row-link") => {
>   const link = parent.createEl("a", { text: label, cls: `internal-link ${className}`, attr: { href: target, "data-href": target } });
>   link.addEventListener("click", (event) => { event.preventDefault(); app.workspace.openLinkText(target, sourcePath, event.ctrlKey || event.metaKey); });
>   return link;
> };
> const candidates = Array.from(dv.pages("").where((page) => page.file.path.startsWith("Lore/") || page.file.path.startsWith("Drafts/WorldAnvil Import/")));
> const flagged = candidates.map(analyse).filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count || b.page.file.mtime.toMillis() - a.page.file.mtime.toMillis());
> const totalIssues = flagged.reduce((sum, entry) => sum + entry.count, 0);
> const criticalCount = flagged.filter((entry) => entry.severity === "critical").length;
> const ready = candidates.filter((page) => page.file.path.startsWith("Lore/") && String(page.status ?? "") !== "published" && [page.title, page.description, page.type, page.status].filter(isEmpty).length === 0).sort((a, b) => b.file.mtime.toMillis() - a.file.mtime.toMillis());
> const summary = root.createDiv({ cls: "vc-home-attention-summary" });
> const stats = summary.createDiv({ cls: "vc-home-attention-stats" });
> const stat = (value, label, tone) => {
>   const item = stats.createDiv({ cls: `vc-home-stat is-${tone}` });
>   item.createSpan({ text: String(value), cls: "vc-home-stat-value" });
>   item.createSpan({ text: label, cls: "vc-home-stat-label" });
> };
> stat(totalIssues, totalIssues === 1 ? "issue" : "issues", totalIssues ? "attention" : "quiet");
> stat(criticalCount, "critical", criticalCount ? "critical" : "quiet");
> stat(ready.length, "ready", ready.length ? "ready" : "quiet");
> const actions = summary.createDiv({ cls: "vc-home-attention-actions" });
> internalLink(actions, "All issues →", "System/Bases/Needs Attention.base", "vc-home-inline-link");
> internalLink(actions, "Publishing gate →", "System/Bases/Publishing.base", "vc-home-inline-link");
> const list = root.createDiv({ cls: "vc-home-attention-list" });
> if (flagged.length === 0) list.createDiv({ text: "No current publishing or migration blockers.", cls: "vc-home-empty" });
> for (const entry of flagged.slice(0, 3)) {
>   const row = list.createDiv({ cls: "vc-home-attention-row" });
>   row.dataset.severity = entry.severity;
>   const main = row.createDiv({ cls: "vc-home-attention-main" });
>   main.createSpan({ text: entry.severity.toUpperCase(), cls: "vc-home-attention-severity" });
>   internalLink(main, String(entry.page.title ?? entry.page.file.name), entry.page.file.path);
>   row.createDiv({ text: entry.labels.join(" · "), cls: "vc-home-attention-detail" });
> }
> if (ready.length > 0) {
>   const readyNote = root.createDiv({ cls: "vc-home-ready-note" });
>   readyNote.createSpan({ text: `${ready.length} structurally ready`, cls: "vc-home-ready-count" });
>   readyNote.createSpan({ text: "Required publishing fields exist; this is not editorial approval.", cls: "vc-home-ready-copy" });
> }
> ```

> [!home-secondary]
> > [!home-chronicle] CHRONICLE
> > ```dataviewjs
> > await dv.view("System/Views/Chronicle/Hub", { compact: true })
> > ```
>
> > [!home-activity] CREATOR PROGRESS
> > ```dataviewjs
> > const activityKey = `viscerium-creator-activity:v2:${app.vault.getName()}`;
> > let activity = { days: {} };
> > try { activity = JSON.parse(localStorage.getItem(activityKey) ?? "{}") ?? {}; }
> > catch (error) { console.warn("VISCERIUM creator activity could not be read from local storage.", error); }
> > const days = activity.days ?? {};
> > const root = dv.container.createDiv({ cls: "vc-home-activity-root" });
> > const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
> > const today = new Date();
> > today.setHours(0, 0, 0, 0);
> > const start = new Date(today);
> > start.setDate(start.getDate() - start.getDay() - (51 * 7));
> > const header = root.createDiv({ cls: "vc-home-activity-header" });
> > const copy = header.createDiv({ cls: "vc-home-activity-copy" });
> > copy.createDiv({ text: "52-week activity", cls: "vc-home-column-title" });
> > copy.createDiv({ text: "changed creator files", cls: "vc-home-column-kicker" });
> > const scroll = root.createDiv({ cls: "vc-home-activity-scroll" });
> > const heatmap = scroll.createDiv({ cls: "vc-home-heatmap" });
> > let total = 0;
> > let activeDays = 0;
> > for (let index = 0; index < 364; index += 1) {
> >   const date = new Date(start);
> >   date.setDate(start.getDate() + index);
> >   const key = dayKey(date);
> >   const count = Number(days[key] ?? 0);
> >   total += count;
> >   if (count > 0) activeDays += 1;
> >   const cell = heatmap.createDiv({ cls: "vc-home-heatmap-cell" });
> >   cell.dataset.level = String(count === 0 ? 0 : Math.min(4, count));
> >   cell.title = `${key} · ${count} changed file${count === 1 ? "" : "s"}`;
> > }
> > header.createDiv({ text: `${total} changes · ${activeDays} active day${activeDays === 1 ? "" : "s"}`, cls: "vc-home-activity-summary" });
> > ```

> [!home-navigate] NAVIGATE
> ```dataviewjs
> const sourcePath = dv.current().file.path;
> const groups = [
>   { title: "LORE", links: [["CITADEL", "Lore/Eras/CITADEL"], ["SMOG", "Lore/Eras/SMOG"], ["NEARSIGHT", "Lore/Eras/NEARSIGHT"], ["ENTROPY", "Lore/Eras/ENTROPY"]] },
>   { title: "DATABASES", links: [["Lore Registry", "System/Bases/Lore Registry.base"], ["Needs Attention", "System/Bases/Needs Attention.base"], ["Publishing", "System/Bases/Publishing.base"], ["Story Entities", "System/Bases/Story Entities.base"], ["Myrkild Units", "System/Bases/Myrkild Units.base"]] },
>   { title: "STORIES", links: [["StoryLine integration", "System/StoryLine Integration"], ["Storyteller workflow", "System/SOPs/Storyteller View SOP"]] },
>   { title: "TOOLS", links: [["Chronicle", "System/Chronicle"], ["Creator tasks", "System/Creator Tasks"], ["SOP Index", "System/SOPs/SOP Index"], ["Publishing Rules", "System/Publishing Rules"], ["Creator Sidebar", "System/Creator Sidebar"]] },
> ];
> const grid = dv.container.createDiv({ cls: "vc-home-nav-grid" });
> for (const group of groups) {
>   const section = grid.createDiv({ cls: "vc-home-nav-group" });
>   section.createDiv({ text: group.title, cls: "vc-home-nav-heading" });
>   const links = section.createDiv({ cls: "vc-home-nav-links" });
>   for (const [label, target] of group.links) {
>     const link = links.createEl("a", { text: label, cls: "internal-link vc-home-nav-link", attr: { href: target, "data-href": target } });
>     link.addEventListener("click", (event) => { event.preventDefault(); app.workspace.openLinkText(target, sourcePath, event.ctrlKey || event.metaKey); });
>   }
> }
> ```
