const sourcePath = dv.currentFilePath || "Home.md";
const root = dv.container.createDiv({ cls: "vc-home-continue-root" });
root.createDiv({ text: "Your most recent creative threads, without the database chrome.", cls: "vc-home-section-copy" });

const loading = root.createDiv({ text: "Loading recent work…", cls: "vc-home-empty vc-home-loading" });
const indexReady = () => Boolean(dv.index?.initialized);
const startedAt = Date.now();
while (!indexReady() && Date.now() - startedAt < 30000) {
  await new Promise((resolve) => window.setTimeout(resolve, 120));
}
if (!indexReady()) {
  loading.setText("Recent work is still indexing. It will appear after Dataview finishes starting.");
  return;
}
loading.remove();
await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));

const grid = root.createDiv({ cls: "vc-home-continue-grid" });
const internalLink = (parent, label, target, className = "vc-home-row-link") => {
  const link = parent.createEl("a", { text: label, cls: `internal-link ${className}`, attr: { href: target, "data-href": target } });
  link.addEventListener("click", (event) => {
    event.preventDefault();
    app.workspace.openLinkText(target, sourcePath, event.ctrlKey || event.metaKey);
  });
  return link;
};
const relativeTime = (value) => {
  try { return value?.toRelative?.() ?? value?.toFormat?.("dd LLL") ?? ""; }
  catch { return ""; }
};
const card = (title, kicker, tone) => {
  const section = grid.createDiv({ cls: `vc-home-recent-card is-${tone}` });
  const heading = section.createDiv({ cls: "vc-home-column-heading" });
  heading.createDiv({ text: title, cls: "vc-home-column-title" });
  heading.createDiv({ text: kicker, cls: "vc-home-column-kicker" });
  return section;
};

const pages = dv.pages("");
const hasPath = (p) => typeof p?.file?.path === "string";

const world = card("Worldbuilding", "recently edited", "world");
const worldList = world.createDiv({ cls: "vc-home-recent-list" });
const worldPages = Array.from(
  pages
    .where((p) => hasPath(p) && (p.file.path.startsWith("Lore/") || p.file.path.startsWith("Drafts/")))
    .sort((p) => p.file.mtime, "desc")
).slice(0, 4);
if (!worldPages.length) worldList.createDiv({ text: "No recent worldbuilding edits.", cls: "vc-home-empty" });
for (const item of worldPages) {
  const row = worldList.createDiv({ cls: "vc-home-recent-row" });
  const copy = row.createDiv({ cls: "vc-home-recent-copy" });
  internalLink(copy, String(item.title ?? item.file.name), item.file.path, "vc-home-row-link vc-home-row-link-strong");
  const meta = copy.createDiv({ cls: "vc-home-recent-meta" });
  const area = item.file.path.startsWith("Lore/") ? "CANON" : "WIP";
  meta.createSpan({ text: area, cls: `vc-home-area vc-home-area-${area.toLowerCase()}` });
  const era = Array.isArray(item.eras) ? item.eras.filter(Boolean).join(" · ") : String(item.era ?? "").trim();
  if (item.type || era) meta.createSpan({ text: [item.type, era].filter(Boolean).join(" · ") });
  row.createSpan({ text: relativeTime(item.file.mtime), cls: "vc-home-row-time" });
}
const worldFooter = world.createDiv({ cls: "vc-home-card-footer" });
internalLink(worldFooter, "Open Lore Registry", "System/Bases/Lore Registry.base", "vc-home-inline-link");

const stories = card("Stories", "active + recent", "story");
const storyList = stories.createDiv({ cls: "vc-home-recent-list" });
let settings = {};
try { settings = JSON.parse(await app.vault.adapter.read(".obsidian/plugins/storyline/data.json")); }
catch (error) { console.warn("StoryLine settings could not be read from Home.", error); }
const activeProjectFile = String(settings.activeProjectFile ?? "").trim();
if (!activeProjectFile) {
  storyList.createDiv({ text: "No active StoryLine project configured.", cls: "vc-home-empty" });
} else {
  const projectDir = activeProjectFile.includes("/") ? activeProjectFile.slice(0, activeProjectFile.lastIndexOf("/")) : "";
  const scenesPrefix = projectDir ? `${projectDir}/Scenes/` : "Scenes/";
  const projectName = activeProjectFile.split("/").pop().replace(/\.md$/i, "");
  const scenes = Array.from(
    pages.where((p) => hasPath(p) && p.file.path.startsWith(scenesPrefix)).sort((p) => p.file.mtime, "desc")
  );
  const dated = scenes.filter((p) => Boolean(p.storyDate)).length;
  const project = storyList.createDiv({ cls: "vc-home-active-story" });
  const projectCopy = project.createDiv({ cls: "vc-home-active-story-copy" });
  projectCopy.createDiv({ text: "ACTIVE STORY", cls: "vc-home-area vc-home-area-writing" });
  internalLink(projectCopy, projectName, activeProjectFile, "vc-home-active-story-title");
  projectCopy.createDiv({ text: `${scenes.length} scene${scenes.length === 1 ? "" : "s"} · ${dated} dated`, cls: "vc-home-active-story-meta" });
  internalLink(project, "Continue manuscript", activeProjectFile, "vc-home-story-continue");
  for (const scene of scenes.slice(0, 3)) {
    const row = storyList.createDiv({ cls: "vc-home-recent-row" });
    const copy = row.createDiv({ cls: "vc-home-recent-copy" });
    internalLink(copy, String(scene.title ?? scene.file.name), scene.file.path, "vc-home-row-link vc-home-row-link-strong");
    const meta = copy.createDiv({ cls: "vc-home-recent-meta" });
    meta.createSpan({ text: "SCENE", cls: "vc-home-area vc-home-area-writing" });
    if (scene.storyDate) meta.createSpan({ text: String(scene.storyDate) });
    row.createSpan({ text: relativeTime(scene.file.mtime), cls: "vc-home-row-time" });
  }
}
const storyFooter = stories.createDiv({ cls: "vc-home-card-footer" });
internalLink(storyFooter, activeProjectFile ? "Open active story" : "StoryLine integration", activeProjectFile || "System/StoryLine Integration", "vc-home-inline-link");

const toggleRow = root.createDiv({ cls: "vc-home-recent-toggle-row" });
const toggle = toggleRow.createEl("button", { text: "Show all recent work", cls: "vc-home-quiet-button", attr: { "aria-expanded": "false" } });
const drawer = root.createDiv({ cls: "vc-home-recent-drawer" });
drawer.hidden = true;
let built = false;
const buildDrawer = () => {
  if (built) return;
  built = true;
  const all = Array.from(
    pages
      .where((p) => hasPath(p) && (p.file.path.startsWith("Lore/") || p.file.path.startsWith("Drafts/") || p.file.path.startsWith("Stories/")))
      .sort((p) => p.file.mtime, "desc")
  );
  for (const item of all) {
    const row = drawer.createDiv({ cls: "vc-home-recent-all-row" });
    internalLink(row, String(item.title ?? item.file.name), item.file.path, "vc-home-row-link vc-home-row-link-strong");
    row.createSpan({ text: item.file.path.startsWith("Stories/") ? "Stories" : "Worldbuilding", cls: "vc-home-recent-all-area" });
    row.createSpan({ text: relativeTime(item.file.mtime), cls: "vc-home-row-time" });
  }
};
toggle.addEventListener("click", () => {
  const open = drawer.hidden;
  if (open) buildDrawer();
  drawer.hidden = !open;
  toggle.textContent = open ? "Show less recent work" : "Show all recent work";
  toggle.setAttribute("aria-expanded", String(open));
});
