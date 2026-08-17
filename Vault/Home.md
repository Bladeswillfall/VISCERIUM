---
cssclasses:
  - viscerium-home
headerImage: Assets/Images/errack-header.webp
decorativeImage: true
homeImagePosition: 50% 46%
homeCreativeLine: Make something worth returning to.
focusTitle: World Anvil Migration
focusDescription: Review the setting spine and era anchors before polishing secondary material.
focusPrimary: System/Bases/World Anvil Import.base
focusPrimaryLabel: Continue focus
focusSecondary: Drafts/Inbox/World Anvil Migration Review
focusSecondaryLabel: Migration guide
---
> [!home-hero]
> ```dataviewjs
> const page = dv.current();
> const sourcePath = page.file.path;
> const root = dv.container.createDiv({ cls: "vc-home-hero-content" });
> const SVG_NS = "http://www.w3.org/2000/svg";
> const icons = {
>   target: "M12 2a10 10 0 1 0 10 10h-3a7 7 0 1 1-7-7V2Zm1 5h3v3h3v3h-6V7Z",
>   play: "M7 4v16l13-8L7 4Z",
>   plus: "M11 4a1 1 0 0 1 2 0v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4Z",
>   close: "M5.6 4.2 12 10.6l6.4-6.4 1.4 1.4-6.4 6.4 6.4 6.4-1.4 1.4-6.4-6.4-6.4 6.4-1.4-1.4 6.4-6.4-6.4-6.4 1.4-1.4Z",
>   world: "M3 18 9.4 8l3.4 5.1L15.6 9 21 18H3Zm0 2h18v2H3v-2Z",
>   book: "M4 4h7c1.2 0 2 .8 2 2v14c0-1.1-.9-2-2-2H4V4Zm16 0h-7c-1.2 0-2 .8-2 2v14c0-1.1.9-2 2-2h7V4Z",
>   shield: "M12 2 4 5v6c0 5.2 3.4 9.4 8 11 4.6-1.6 8-5.8 8-11V5l-8-3Zm0 4 4 1.5V11c0 3.2-1.7 5.9-4 7.2-2.3-1.3-4-4-4-7.2V7.5L12 6Z",
>   calendar: "M5 3h2v2h10V3h2v2h2v16H3V5h2V3Zm0 7v9h14v-9H5Z",
>   timeline: "M4 3h2v18H4V3Zm4 3h12v4H8V6Zm0 8h8v4H8v-4Z",
> };
> const setIcon = (element, name) => {
>   let svg = element.querySelector(":scope > svg.vc-home-button-icon");
>   if (!svg) {
>     svg = document.createElementNS(SVG_NS, "svg");
>     svg.setAttribute("viewBox", "0 0 24 24");
>     svg.setAttribute("aria-hidden", "true");
>     svg.classList.add("vc-home-button-icon");
>     const path = document.createElementNS(SVG_NS, "path");
>     path.setAttribute("fill", "currentColor");
>     svg.append(path);
>     element.prepend(svg);
>   }
>   svg.querySelector("path").setAttribute("d", icons[name]);
> };
> const heroCallout = dv.container.closest('.callout[data-callout="home-hero"]');
> const rawImage = String(page.headerImage ?? "").replace(/^!?\[\[|\]\]$/g, "").split("|")[0].trim();
> let heroSource = "";
> if (/^https:\/\//i.test(rawImage)) heroSource = rawImage;
> else if (rawImage) {
>   const direct = app.vault.getAbstractFileByPath(rawImage.replace(/^\/+/, ""));
>   const file = direct?.extension ? direct : app.metadataCache.getFirstLinkpathDest(rawImage, sourcePath);
>   if (file?.extension) heroSource = app.vault.getResourcePath(file);
> }
> if (heroCallout && heroSource) heroCallout.style.setProperty("--vc-home-hero-image", `url("${heroSource.replace(/"/g, '\\"')}")`);
> if (heroCallout) heroCallout.style.setProperty("--vc-home-hero-position", String(page.homeImagePosition ?? "50% 46%"));
>
> root.createDiv({ text: "CREATOR VAULT · ERRACK", cls: "vc-home-eyebrow" });
> root.createEl("h1", { text: "VISCERIUM" });
> root.createDiv({ text: String(page.homeCreativeLine ?? "Make something worth returning to."), cls: "vc-home-creative-line" });
>
> const launch = root.createDiv({ cls: "vc-home-launch" });
> const focus = launch.createDiv({ cls: "vc-home-launch-focus" });
> const kicker = focus.createDiv({ cls: "vc-home-focus-kicker" });
> const kickerIcon = kicker.createSpan({ cls: "vc-home-kicker-icon" });
> const kickerSvg = document.createElementNS(SVG_NS, "svg");
> kickerSvg.setAttribute("viewBox", "0 0 24 24");
> kickerSvg.setAttribute("aria-hidden", "true");
> const kickerPath = document.createElementNS(SVG_NS, "path");
> kickerPath.setAttribute("d", icons.target);
> kickerPath.setAttribute("fill", "currentColor");
> kickerSvg.append(kickerPath);
> kickerIcon.append(kickerSvg);
> kicker.createSpan({ text: "CURRENT FOCUS · MANUAL" });
> focus.createDiv({ text: String(page.focusTitle ?? "Current focus"), cls: "vc-home-focus-title" });
> const description = String(page.focusDescription ?? "").trim();
> if (description) focus.createDiv({ text: description, cls: "vc-home-focus-description" });
>
> const actions = launch.createDiv({ cls: "vc-home-launch-actions" });
> const addLaunchButton = (label, target, primary, icon) => {
>   const button = actions.createEl("button", {
>     text: String(label),
>     cls: `vc-home-button ${primary ? "vc-home-button-primary" : "vc-home-button-secondary"}`,
>   });
>   setIcon(button, icon);
>   if (target) button.addEventListener("click", () => app.workspace.openLinkText(String(target), sourcePath));
>   return button;
> };
> addLaunchButton(page.focusPrimaryLabel ?? "Continue focus", page.focusPrimary, true, "play");
> const createToggle = addLaunchButton("Create new", null, false, "plus");
> createToggle.classList.add("vc-home-create-toggle");
> createToggle.setAttribute("aria-expanded", "false");
>
> const panel = launch.createDiv({ cls: "vc-home-create-panel" });
> panel.hidden = true;
> createToggle.addEventListener("click", () => {
>   const open = panel.hidden;
>   panel.hidden = !open;
>   launch.classList.toggle("is-create-open", open);
>   createToggle.classList.toggle("is-open", open);
>   createToggle.setAttribute("aria-expanded", String(open));
>   const label = createToggle.querySelector(":scope > span.vc-home-button-label");
>   if (label) label.textContent = open ? "Close create" : "Create new";
>   else {
>     const textNode = [...createToggle.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
>     if (textNode) textNode.nodeValue = open ? "Close create" : "Create new";
>   }
>   setIcon(createToggle, open ? "close" : "plus");
> });
>
> panel.createDiv({ text: "Create something new", cls: "vc-home-create-panel-title" });
> panel.createDiv({ text: "One level. Choose the action you need.", cls: "vc-home-create-panel-copy" });
> const sections = panel.createDiv({ cls: "vc-home-create-sections" });
> const templaterCreateCommand = (templatePath) => `templater-obsidian:create-${templatePath}`;
> const addGroup = (title, icon) => {
>   const section = sections.createDiv({ cls: "vc-home-create-group" });
>   const heading = section.createDiv({ cls: "vc-home-create-heading" });
>   const iconWrap = heading.createSpan({ cls: "vc-home-create-heading-icon" });
>   const svg = document.createElementNS(SVG_NS, "svg");
>   svg.setAttribute("viewBox", "0 0 24 24");
>   svg.setAttribute("aria-hidden", "true");
>   const path = document.createElementNS(SVG_NS, "path");
>   path.setAttribute("d", icons[icon]);
>   path.setAttribute("fill", "currentColor");
>   svg.append(path);
>   iconWrap.append(svg);
>   heading.createSpan({ text: title });
>   return section.createDiv({ cls: "vc-home-create-actions" });
> };
> const addAction = (parent, { label, icon, commandId, run, title }) => {
>   const button = parent.createEl("button", { text: label, cls: "vc-home-button vc-home-button-action", attr: { title } });
>   setIcon(button, icon);
>   const available = Boolean(run) || Boolean(app.commands.commands[commandId]);
>   if (!available) { button.disabled = true; button.title = "Required Obsidian command is unavailable."; }
>   else button.addEventListener("click", () => run ? run() : app.commands.executeCommandById(commandId));
> };
> const worldbuilding = addGroup("Worldbuilding", "world");
> addAction(worldbuilding, { label: "Lore entity", icon: "world", commandId: templaterCreateCommand("Templates/Lore/New Lore Entity.md"), title: "Create a character, faction, location, event or species." });
> const story = addGroup("Story", "book");
> addAction(story, { label: "Story entity", icon: "book", commandId: templaterCreateCommand("Templates/Databases/New Story Entity.md"), title: "Create fauna, flora, fungi or an item." });
> addAction(story, { label: "Story timeline", icon: "timeline", commandId: "viscerium-timelines:open-storyline-project-timeline", title: "Open the active StoryLine project timeline." });
> const myrkild = addGroup("Myrkild", "shield");
> addAction(myrkild, { label: "Myrkild unit", icon: "shield", commandId: templaterCreateCommand("Templates/Databases/New Myrkild Unit.md"), title: "Create a structured Myrkild unit." });
> const chronicle = addGroup("Chronicle", "calendar");
> addAction(chronicle, { label: "Today", icon: "calendar", commandId: "journal-bases:open-current-daily", title: "Open or create today's Chronicle." });
> addAction(chronicle, { label: "Week", icon: "calendar", commandId: "journal-bases:open-current-weekly", title: "Open or create this week's review." });
> addAction(chronicle, { label: "Month", icon: "calendar", commandId: "journal-bases:open-current-monthly", title: "Open or create this month's review." });
> ```

> [!home-continue] Continue working
> ```dataviewjs
> const sourcePath = dv.current().file.path;
> const root = dv.container.createDiv({ cls: "vc-home-continue-root" });
> root.createDiv({ text: "Your most recent creative threads, without the database chrome.", cls: "vc-home-section-copy" });
> const grid = root.createDiv({ cls: "vc-home-continue-grid" });
> const internalLink = (parent, label, target, className = "vc-home-row-link") => {
>   const link = parent.createEl("a", { text: label, cls: `internal-link ${className}`, attr: { href: target, "data-href": target } });
>   link.addEventListener("click", (event) => { event.preventDefault(); app.workspace.openLinkText(target, sourcePath, event.ctrlKey || event.metaKey); });
>   return link;
> };
> const relativeTime = (value) => { try { return value?.toRelative?.() ?? value?.toFormat?.("dd LLL") ?? ""; } catch { return ""; } };
> const card = (title, kicker, tone) => {
>   const section = grid.createDiv({ cls: `vc-home-recent-card is-${tone}` });
>   const heading = section.createDiv({ cls: "vc-home-column-heading" });
>   heading.createDiv({ text: title, cls: "vc-home-column-title" });
>   heading.createDiv({ text: kicker, cls: "vc-home-column-kicker" });
>   return section;
> };
> const world = card("Worldbuilding", "recently edited", "world");
> const worldList = world.createDiv({ cls: "vc-home-recent-list" });
> const worldPages = Array.from(dv.pages("").where((p) => p.file.path.startsWith("Lore/") || p.file.path.startsWith("Drafts/")).sort((p) => p.file.mtime, "desc")).slice(0, 4);
> if (!worldPages.length) worldList.createDiv({ text: "No recent worldbuilding edits.", cls: "vc-home-empty" });
> for (const item of worldPages) {
>   const row = worldList.createDiv({ cls: "vc-home-recent-row" });
>   const copy = row.createDiv({ cls: "vc-home-recent-copy" });
>   internalLink(copy, String(item.title ?? item.file.name), item.file.path, "vc-home-row-link vc-home-row-link-strong");
>   const meta = copy.createDiv({ cls: "vc-home-recent-meta" });
>   const area = item.file.path.startsWith("Lore/") ? "CANON" : "WIP";
>   meta.createSpan({ text: area, cls: `vc-home-area vc-home-area-${area.toLowerCase()}` });
>   const era = Array.isArray(item.eras) ? item.eras.filter(Boolean).join(" · ") : String(item.era ?? "").trim();
>   if (item.type || era) meta.createSpan({ text: [item.type, era].filter(Boolean).join(" · ") });
>   row.createSpan({ text: relativeTime(item.file.mtime), cls: "vc-home-row-time" });
> }
> const worldFooter = world.createDiv({ cls: "vc-home-card-footer" });
> internalLink(worldFooter, "Open Lore Registry", "System/Bases/Lore Registry.base", "vc-home-inline-link");
>
> const stories = card("Stories", "active + recent", "story");
> const storyList = stories.createDiv({ cls: "vc-home-recent-list" });
> let settings = {};
> try { settings = JSON.parse(await app.vault.adapter.read(".obsidian/plugins/storyline/data.json")); }
> catch (error) { console.warn("StoryLine settings could not be read from Home.", error); }
> const activeProjectFile = String(settings.activeProjectFile ?? "").trim();
> if (!activeProjectFile) {
>   storyList.createDiv({ text: "No active StoryLine project configured.", cls: "vc-home-empty" });
> } else {
>   const projectDir = activeProjectFile.slice(0, activeProjectFile.lastIndexOf("/"));
>   const scenesPrefix = `${projectDir}/Scenes/`;
>   const projectName = activeProjectFile.split("/").pop().replace(/\.md$/i, "");
>   const scenes = Array.from(dv.pages("").where((p) => p.file.path.startsWith(scenesPrefix)).sort((p) => p.file.mtime, "desc"));
>   const dated = scenes.filter((p) => Boolean(p.storyDate)).length;
>   const project = storyList.createDiv({ cls: "vc-home-active-story" });
>   const projectCopy = project.createDiv({ cls: "vc-home-active-story-copy" });
>   projectCopy.createDiv({ text: "ACTIVE STORY", cls: "vc-home-area vc-home-area-writing" });
>   internalLink(projectCopy, projectName, activeProjectFile, "vc-home-active-story-title");
>   projectCopy.createDiv({ text: `${scenes.length} scene${scenes.length === 1 ? "" : "s"} · ${dated} dated`, cls: "vc-home-active-story-meta" });
>   internalLink(project, "Continue manuscript", activeProjectFile, "vc-home-story-continue");
>   for (const scene of scenes.slice(0, 3)) {
>     const row = storyList.createDiv({ cls: "vc-home-recent-row" });
>     const copy = row.createDiv({ cls: "vc-home-recent-copy" });
>     internalLink(copy, String(scene.title ?? scene.file.name), scene.file.path, "vc-home-row-link vc-home-row-link-strong");
>     const meta = copy.createDiv({ cls: "vc-home-recent-meta" });
>     meta.createSpan({ text: "SCENE", cls: "vc-home-area vc-home-area-writing" });
>     if (scene.storyDate) meta.createSpan({ text: String(scene.storyDate) });
>     row.createSpan({ text: relativeTime(scene.file.mtime), cls: "vc-home-row-time" });
>   }
> }
> const storyFooter = stories.createDiv({ cls: "vc-home-card-footer" });
> internalLink(storyFooter, activeProjectFile ? "Open active story" : "StoryLine integration", activeProjectFile || "System/StoryLine Integration", "vc-home-inline-link");
>
> const toggleRow = root.createDiv({ cls: "vc-home-recent-toggle-row" });
> const toggle = toggleRow.createEl("button", { text: "Show all recent work", cls: "vc-home-quiet-button", attr: { "aria-expanded": "false" } });
> const drawer = root.createDiv({ cls: "vc-home-recent-drawer" });
> drawer.hidden = true;
> let built = false;
> const buildDrawer = () => {
>   if (built) return;
>   built = true;
>   const all = Array.from(dv.pages("").where((p) => p.file.path.startsWith("Lore/") || p.file.path.startsWith("Drafts/") || p.file.path.startsWith("Stories/")).sort((p) => p.file.mtime, "desc"));
>   for (const item of all) {
>     const row = drawer.createDiv({ cls: "vc-home-recent-all-row" });
>     internalLink(row, String(item.title ?? item.file.name), item.file.path, "vc-home-row-link vc-home-row-link-strong");
>     row.createSpan({ text: item.file.path.startsWith("Stories/") ? "Stories" : "Worldbuilding", cls: "vc-home-recent-all-area" });
>     row.createSpan({ text: relativeTime(item.file.mtime), cls: "vc-home-row-time" });
>   }
> };
> toggle.addEventListener("click", () => {
>   const open = drawer.hidden;
>   if (open) buildDrawer();
>   drawer.hidden = !open;
>   toggle.textContent = open ? "Show less recent work" : "Show all recent work";
>   toggle.setAttribute("aria-expanded", String(open));
> });
> ```

> [!home-attention] Needs attention
> ```dataviewjs
> const sourcePath = dv.current().file.path;
> const root = dv.container.createDiv({ cls: "vc-home-attention-root" });
> const ERA_SENSITIVE_TYPES = new Set(["character", "faction", "location", "event", "species", "fauna", "flora", "fungi", "item", "myrkild-unit"]);
> const isEmpty = (value) => value == null || (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0) || (typeof value?.length === "number" && value.length === 0);
> const asArray = (value) => value == null ? [] : Array.isArray(value) ? value.filter((entry) => entry != null) : typeof value?.array === "function" ? value.array().filter((entry) => entry != null) : [value];
> const eraCount = (p) => asArray(p.eras).length || (isEmpty(p.era) ? 0 : 1);
> const analyse = (p) => {
>   const labels = []; let count = 0;
>   if (isEmpty(p.title)) { labels.push("Missing title"); count += 1; }
>   if (isEmpty(p.description)) { labels.push("Missing description"); count += 1; }
>   if (isEmpty(p.type)) { labels.push("Missing type"); count += 1; }
>   if (ERA_SENSITIVE_TYPES.has(String(p.type ?? "")) && eraCount(p) === 0) { labels.push("Missing era"); count += 1; }
>   const migrationIssues = asArray(p.import_issues).length;
>   if (migrationIssues > 0) { labels.push(`${migrationIssues} migration issue${migrationIssues === 1 ? "" : "s"}`); count += migrationIssues; }
>   const severity = count >= 4 ? "critical" : count === 3 ? "urgent" : count === 2 ? "elevated" : "notice";
>   return { page: p, labels, count, severity };
> };
> const internalLink = (parent, label, target, className = "vc-home-row-link") => {
>   const link = parent.createEl("a", { text: label, cls: `internal-link ${className}`, attr: { href: target, "data-href": target } });
>   link.addEventListener("click", (event) => { event.preventDefault(); app.workspace.openLinkText(target, sourcePath, event.ctrlKey || event.metaKey); });
>   return link;
> };
> const candidates = Array.from(dv.pages("").where((p) => p.file.path.startsWith("Lore/") || p.file.path.startsWith("Drafts/WorldAnvil Import/")));
> const flagged = candidates.map(analyse).filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count || b.page.file.mtime.toMillis() - a.page.file.mtime.toMillis());
> const totalIssues = flagged.reduce((sum, entry) => sum + entry.count, 0);
> const criticalCount = flagged.filter((entry) => entry.severity === "critical").length;
> const ready = candidates.filter((p) => p.file.path.startsWith("Lore/") && String(p.status ?? "") !== "published" && [p.title, p.description, p.type, p.status].filter(isEmpty).length === 0).sort((a, b) => b.file.mtime.toMillis() - a.file.mtime.toMillis());
> const summary = root.createDiv({ cls: "vc-home-attention-summary" });
> const copy = summary.createDiv({ cls: "vc-home-attention-copy" });
> copy.createDiv({ text: "Surface what blocks, breaks, or waits for a decision. Everything else stays in the tracker.", cls: "vc-home-section-copy" });
> const stats = summary.createDiv({ cls: "vc-home-attention-stats" });
> const stat = (value, label, tone) => {
>   const item = stats.createDiv({ cls: `vc-home-stat is-${tone}` });
>   item.createSpan({ text: String(value), cls: "vc-home-stat-value" });
>   item.createSpan({ text: label, cls: "vc-home-stat-label" });
> };
> stat(criticalCount, "Critical", criticalCount ? "critical" : "quiet");
> stat(totalIssues, "Total issues", totalIssues ? "attention" : "quiet");
> const list = root.createDiv({ cls: "vc-home-attention-list" });
> if (!flagged.length) list.createDiv({ text: "No current publishing or migration blockers.", cls: "vc-home-empty" });
> for (const entry of flagged.slice(0, 3)) {
>   const row = list.createDiv({ cls: "vc-home-attention-row" });
>   row.dataset.severity = entry.severity;
>   row.createSpan({ text: entry.severity === "critical" ? "Critical" : "Review", cls: "vc-home-attention-severity" });
>   internalLink(row, String(entry.page.title ?? entry.page.file.name), entry.page.file.path, "vc-home-attention-note");
>   row.createDiv({ text: entry.labels.join(" · "), cls: "vc-home-attention-detail" });
>   row.createSpan({ text: "Broken", cls: "vc-home-attention-state" });
> }
> const footer = root.createDiv({ cls: "vc-home-attention-footer" });
> const readyNote = footer.createDiv({ cls: "vc-home-ready-note" });
> readyNote.createSpan({ text: `${ready.length} structurally ready`, cls: "vc-home-ready-count" });
> readyNote.createSpan({ text: "Required publishing fields exist; this is not editorial approval.", cls: "vc-home-ready-copy" });
> const links = footer.createDiv({ cls: "vc-home-attention-actions" });
> internalLink(links, "Open issue tracker", "System/Bases/Needs Attention.base", "vc-home-inline-link");
> internalLink(links, "Publishing gate", "System/Bases/Publishing.base", "vc-home-inline-link vc-home-inline-link-muted");
> ```

> [!home-secondary]
> > [!home-chronicle] Chronicle
> > ```dataviewjs
> > const sourcePath = dv.current().file.path;
> > const root = dv.container.createDiv({ cls: "vc-home-chronicle-root" });
> > root.createDiv({ text: "Build the habit by making today's entry the obvious next step.", cls: "vc-home-section-copy" });
> > const now = window.moment();
> > const today = now.clone().startOf("day");
> > const week = now.clone().startOf("isoWeek");
> > const month = now.clone().startOf("month");
> > const year = now.clone().startOf("year");
> > const todayPath = `Private/Journal/Daily/${today.format("YYYY")}/${today.format("YYYY-MM-DD")}.md`;
> > const todayExists = Boolean(app.vault.getFileByPath(todayPath));
> > const prompt = root.createDiv({ cls: "vc-home-chronicle-prompt" });
> > const copy = prompt.createDiv({ cls: "vc-home-chronicle-prompt-copy" });
> > copy.createDiv({ text: todayExists ? "Today's Chronicle is ready to continue." : "Today hasn't been chronicled yet.", cls: "vc-home-chronicle-prompt-title" });
> > copy.createDiv({ text: today.format("dddd · D MMMM YYYY"), cls: "vc-home-chronicle-prompt-date" });
> > const button = prompt.createEl("button", { text: todayExists ? "Open today's Chronicle" : "Write today's Chronicle", cls: "vc-home-button vc-home-button-secondary" });
> > const dailyCommand = "journal-bases:open-current-daily";
> > if (!app.commands.commands[dailyCommand]) button.disabled = true;
> > else button.addEventListener("click", () => app.commands.executeCommandById(dailyCommand));
> > const periods = root.createDiv({ cls: "vc-home-chronicle-periods" });
> > const defs = [
> >   { label: `Week ${String(week.isoWeek()).padStart(2, "0")}`, detail: `${week.format("D")}–${week.clone().endOf("isoWeek").format("D MMM")}`, command: "journal-bases:open-current-weekly" },
> >   { label: month.format("MMMM"), detail: "Monthly review", command: "journal-bases:open-current-monthly" },
> >   { label: year.format("YYYY"), detail: "Annual review", command: "journal-bases:open-current-yearly" },
> > ];
> > for (const def of defs) {
> >   const period = periods.createEl("button", { cls: "vc-home-chronicle-period", attr: { title: `Open ${def.label}` } });
> >   period.createSpan({ text: def.label, cls: "vc-home-chronicle-period-label" });
> >   period.createSpan({ text: def.detail, cls: "vc-home-chronicle-period-detail" });
> >   if (!app.commands.commands[def.command]) period.disabled = true;
> >   else period.addEventListener("click", () => app.commands.executeCommandById(def.command));
> > }
> > const footer = root.createDiv({ cls: "vc-home-card-footer" });
> > const link = footer.createEl("a", { text: "Open Chronicle", cls: "internal-link vc-home-inline-link", attr: { href: "System/Chronicle", "data-href": "System/Chronicle" } });
> > link.addEventListener("click", (event) => { event.preventDefault(); app.workspace.openLinkText("System/Chronicle", sourcePath, event.ctrlKey || event.metaKey); });
> > ```
>
> > [!home-activity] Progress
> > ```dataviewjs
> > const activityKey = `viscerium-creator-activity:v2:${app.vault.getName()}`;
> > let activity = { days: {} };
> > try { activity = JSON.parse(localStorage.getItem(activityKey) ?? "{}") ?? {}; }
> > catch (error) { console.warn("VISCERIUM creator activity could not be read from local storage.", error); }
> > const days = activity.days ?? {};
> > const root = dv.container.createDiv({ cls: "vc-home-activity-root" });
> > root.createDiv({ text: "Enough evidence of momentum to encourage another session.", cls: "vc-home-section-copy" });
> > const today = new Date(); today.setHours(0, 0, 0, 0);
> > const start = new Date(today); start.setDate(start.getDate() - start.getDay() - (25 * 7));
> > const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
> > let total = 0; let activeDays = 0;
> > const counts = [];
> > for (let index = 0; index < 182; index += 1) {
> >   const date = new Date(start); date.setDate(start.getDate() + index);
> >   const key = dayKey(date); const count = Number(days[key] ?? 0);
> >   total += count; if (count > 0) activeDays += 1; counts.push({ key, count });
> > }
> > const metrics = root.createDiv({ cls: "vc-home-activity-metrics" });
> > const metric = (value, label) => { const item = metrics.createDiv({ cls: "vc-home-activity-metric" }); item.createSpan({ text: String(value), cls: "vc-home-activity-metric-value" }); item.createSpan({ text: label, cls: "vc-home-activity-metric-label" }); };
> > metric(activeDays, "active days"); metric(total, "changed files");
> > const heatmap = root.createDiv({ cls: "vc-home-heatmap" });
> > for (const { key, count } of counts) {
> >   const cell = heatmap.createSpan({ cls: "vc-home-heatmap-cell" });
> >   cell.dataset.level = String(count === 0 ? 0 : Math.min(4, count));
> >   cell.title = `${key} · ${count} changed file${count === 1 ? "" : "s"}`;
> > }
> > ```

> [!home-navigate] Navigate
> ```dataviewjs
> const sourcePath = dv.current().file.path;
> const root = dv.container.createDiv({ cls: "vc-home-navigate-root" });
> root.createDiv({ text: "Important gateways only; the sidebar remains the filesystem.", cls: "vc-home-section-copy" });
> const SVG_NS = "http://www.w3.org/2000/svg";
> const icons = {
>   world: "M3 18 9.4 8l3.4 5.1L15.6 9 21 18H3Zm0 2h18v2H3v-2Z",
>   database: "M4 5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 5c0 1.7 3.6 3 8 3s8-1.3 8-3V7c-1.7 1.2-4.8 2-8 2s-6.3-.8-8-2v3Zm0 5c0 1.7 3.6 3 8 3s8-1.3 8-3v-3c-1.7 1.2-4.8 2-8 2s-6.3-.8-8-2v3Zm0 5c0 1.7 3.6 3 8 3s8-1.3 8-3v-3c-1.7 1.2-4.8 2-8 2s-6.3-.8-8-2v3Z",
>   book: "M4 4h7c1.2 0 2 .8 2 2v14c0-1.1-.9-2-2-2H4V4Zm16 0h-7c-1.2 0-2 .8-2 2v14c0-1.1.9-2 2-2h7V4Z",
>   tools: "M14.7 4.3a5 5 0 0 0-6.6 6.6L3 16v5h5l5.1-5.1a5 5 0 0 0 6.6-6.6l-3.2 3.2-3-3 3.2-3.2Z",
> };
> const groups = [
>   { title: "Lore", icon: "world", links: [["CITADEL", "Lore/Eras/CITADEL"], ["SMOG", "Lore/Eras/SMOG"], ["NEARSIGHT", "Lore/Eras/NEARSIGHT"], ["ENTROPY", "Lore/Eras/ENTROPY"]] },
>   { title: "Databases", icon: "database", links: [["Lore Registry", "System/Bases/Lore Registry.base"], ["Needs Attention", "System/Bases/Needs Attention.base"], ["Publishing", "System/Bases/Publishing.base"], ["Story Entities", "System/Bases/Story Entities.base"], ["Myrkild Units", "System/Bases/Myrkild Units.base"]] },
>   { title: "Stories", icon: "book", links: [["StoryLine integration", "System/StoryLine Integration"], ["Storyteller workflow", "System/SOPs/Storyteller View SOP"]] },
>   { title: "Tools", icon: "tools", links: [["Chronicle", "System/Chronicle"], ["Creator tasks", "System/Creator Tasks"], ["SOP Index", "System/SOPs/SOP Index"], ["Publishing Rules", "System/Publishing Rules"], ["Creator Sidebar", "System/Creator Sidebar"]] },
> ];
> const grid = root.createDiv({ cls: "vc-home-nav-grid" });
> for (const group of groups) {
>   const section = grid.createDiv({ cls: "vc-home-nav-group" });
>   const heading = section.createDiv({ cls: "vc-home-nav-heading" });
>   const svg = document.createElementNS(SVG_NS, "svg"); svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true");
>   const path = document.createElementNS(SVG_NS, "path"); path.setAttribute("d", icons[group.icon]); path.setAttribute("fill", "currentColor"); svg.append(path); heading.append(svg);
>   heading.createSpan({ text: group.title });
>   const links = section.createDiv({ cls: "vc-home-nav-links" });
>   for (const [label, target] of group.links) {
>     const link = links.createEl("a", { text: label, cls: "internal-link vc-home-nav-link", attr: { href: target, "data-href": target } });
>     link.addEventListener("click", (event) => { event.preventDefault(); app.workspace.openLinkText(target, sourcePath, event.ctrlKey || event.metaKey); });
>   }
> }
> ```
