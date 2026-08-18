const sourcePath = dv.currentFilePath || "Home.md";
const homeFile = app.vault.getFileByPath?.(sourcePath) ?? app.vault.getAbstractFileByPath(sourcePath);
const frontmatter = homeFile ? (app.metadataCache.getFileCache(homeFile)?.frontmatter ?? {}) : {};
const page = {
  headerImage: frontmatter.headerImage ?? "Assets/Images/errack-header.webp",
  homeImagePosition: frontmatter.homeImagePosition ?? "50% 46%",
  homeCreativeLine: frontmatter.homeCreativeLine ?? "Make something worth returning to.",
  focusTitle: frontmatter.focusTitle ?? "World Anvil Migration",
  focusDescription: frontmatter.focusDescription ?? "Review the setting spine and era anchors before polishing secondary material.",
  focusPrimary: frontmatter.focusPrimary ?? "System/Bases/World Anvil Import.base",
  focusPrimaryLabel: frontmatter.focusPrimaryLabel ?? "Continue focus",
};

const root = dv.container.createDiv({ cls: "vc-home-hero-content" });
const SVG_NS = "http://www.w3.org/2000/svg";
const icons = {
  target: "M12 2a10 10 0 1 0 10 10h-3a7 7 0 1 1-7-7V2Zm1 5h3v3h3v3h-6V7Z",
  play: "M7 4v16l13-8L7 4Z",
  plus: "M11 4a1 1 0 0 1 2 0v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4Z",
  close: "M5.6 4.2 12 10.6l6.4-6.4 1.4 1.4-6.4 6.4 6.4 6.4-1.4 1.4-6.4-6.4-6.4 6.4-1.4-1.4 6.4-6.4-6.4-6.4 1.4-1.4Z",
  world: "M3 18 9.4 8l3.4 5.1L15.6 9 21 18H3Zm0 2h18v2H3v-2Z",
  book: "M4 4h7c1.2 0 2 .8 2 2v14c0-1.1-.9-2-2-2H4V4Zm16 0h-7c-1.2 0-2 .8-2 2v14c0-1.1.9-2 2-2h7V4Z",
  shield: "M12 2 4 5v6c0 5.2 3.4 9.4 8 11 4.6-1.6 8-5.8 8-11V5l-8-3Zm0 4 4 1.5V11c0 3.2-1.7 5.9-4 7.2-2.3-1.3-4-4-4-7.2V7.5L12 6Z",
  calendar: "M5 3h2v2h10V3h2v2h2v16H3V5h2V3Zm0 7v9h14v-9H5Z",
  timeline: "M4 3h2v18H4V3Zm4 3h12v4H8V6Zm0 8h8v4H8v-4Z",
};

const setIcon = (element, name) => {
  let svg = element.querySelector(":scope > svg.vc-home-button-icon");
  if (!svg) {
    svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("vc-home-button-icon");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("fill", "currentColor");
    svg.append(path);
    element.prepend(svg);
  }
  svg.querySelector("path")?.setAttribute("d", icons[name] ?? "");
};

const heroCallout = dv.container.closest('.callout[data-callout="home-hero"]');
const rawImage = String(page.headerImage ?? "").replace(/^!?\[\[|\]\]$/g, "").split("|")[0].trim();
let heroSource = "";
if (/^https:\/\//i.test(rawImage)) heroSource = rawImage;
else if (rawImage) {
  const cleanPath = rawImage.replace(/^\/+/, "");
  const direct = app.vault.getFileByPath?.(cleanPath) ?? app.vault.getAbstractFileByPath(cleanPath);
  const file = direct?.extension ? direct : app.metadataCache.getFirstLinkpathDest(rawImage, sourcePath);
  if (file?.extension) heroSource = app.vault.getResourcePath(file);
}
if (heroCallout && heroSource) {
  const heroImageValue = `url(${JSON.stringify(heroSource)})`;
  heroCallout.style.setProperty("--vc-home-hero-image", heroImageValue);
}
if (heroCallout) heroCallout.style.setProperty("--vc-home-hero-position", String(page.homeImagePosition));

root.createDiv({ text: "CREATOR VAULT · ERRACK", cls: "vc-home-eyebrow" });
root.createEl("h1", { text: "VISCERIUM" });
root.createDiv({ text: String(page.homeCreativeLine), cls: "vc-home-creative-line" });

const launch = root.createDiv({ cls: "vc-home-launch" });
const focus = launch.createDiv({ cls: "vc-home-launch-focus" });
const kicker = focus.createDiv({ cls: "vc-home-focus-kicker" });
const kickerIcon = kicker.createSpan({ cls: "vc-home-kicker-icon" });
const kickerSvg = document.createElementNS(SVG_NS, "svg");
kickerSvg.setAttribute("viewBox", "0 0 24 24");
kickerSvg.setAttribute("aria-hidden", "true");
const kickerPath = document.createElementNS(SVG_NS, "path");
kickerPath.setAttribute("d", icons.target);
kickerPath.setAttribute("fill", "currentColor");
kickerSvg.append(kickerPath);
kickerIcon.append(kickerSvg);
kicker.createSpan({ text: "CURRENT FOCUS · MANUAL" });
focus.createDiv({ text: String(page.focusTitle), cls: "vc-home-focus-title" });
const description = String(page.focusDescription ?? "").trim();
if (description) focus.createDiv({ text: description, cls: "vc-home-focus-description" });

const actions = launch.createDiv({ cls: "vc-home-launch-actions" });
const addLaunchButton = (label, target, primary, icon) => {
  const button = actions.createEl("button", {
    text: String(label),
    cls: `vc-home-button ${primary ? "vc-home-button-primary" : "vc-home-button-secondary"}`,
  });
  setIcon(button, icon);
  if (target) button.addEventListener("click", () => app.workspace.openLinkText(String(target), sourcePath));
  return button;
};
addLaunchButton(page.focusPrimaryLabel, page.focusPrimary, true, "play");
const createToggle = addLaunchButton("Create new", null, false, "plus");
createToggle.classList.add("vc-home-create-toggle");
createToggle.setAttribute("aria-expanded", "false");

const panel = launch.createDiv({ cls: "vc-home-create-panel" });
panel.hidden = true;
createToggle.addEventListener("click", () => {
  const open = panel.hidden;
  panel.hidden = !open;
  launch.classList.toggle("is-create-open", open);
  createToggle.classList.toggle("is-open", open);
  createToggle.setAttribute("aria-expanded", String(open));
  const label = createToggle.querySelector(":scope > span.vc-home-button-label");
  if (label) label.textContent = open ? "Close create" : "Create new";
  else {
    const textNode = [...createToggle.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.nodeValue = open ? "Close create" : "Create new";
  }
  setIcon(createToggle, open ? "close" : "plus");
});

panel.createDiv({ text: "Create something new", cls: "vc-home-create-panel-title" });
panel.createDiv({ text: "One level. Choose the action you need.", cls: "vc-home-create-panel-copy" });
const sections = panel.createDiv({ cls: "vc-home-create-sections" });
const templaterCreateCommand = (templatePath) => `templater-obsidian:create-${templatePath}`;
const addGroup = (title, icon) => {
  const section = sections.createDiv({ cls: "vc-home-create-group" });
  const heading = section.createDiv({ cls: "vc-home-create-heading" });
  const iconWrap = heading.createSpan({ cls: "vc-home-create-heading-icon" });
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", icons[icon]);
  path.setAttribute("fill", "currentColor");
  svg.append(path);
  iconWrap.append(svg);
  heading.createSpan({ text: title });
  return section.createDiv({ cls: "vc-home-create-actions" });
};
const addAction = (parent, { label, icon, commandId, run, title }) => {
  const button = parent.createEl("button", { text: label, cls: "vc-home-button vc-home-button-action", attr: { title } });
  setIcon(button, icon);
  const available = Boolean(run) || Boolean(app.commands?.commands?.[commandId]);
  if (!available) {
    button.disabled = true;
    button.title = "Required Obsidian command is unavailable.";
  } else {
    button.addEventListener("click", () => run ? run() : app.commands.executeCommandById(commandId));
  }
};
const worldbuilding = addGroup("Worldbuilding", "world");
addAction(worldbuilding, { label: "Lore entity", icon: "world", commandId: templaterCreateCommand("Templates/Lore/New Lore Entity.md"), title: "Create a character, faction, location, event or species." });
const story = addGroup("Story", "book");
addAction(story, { label: "Story entity", icon: "book", commandId: templaterCreateCommand("Templates/Databases/New Story Entity.md"), title: "Create fauna, flora, fungi or an item." });
addAction(story, { label: "Story timeline", icon: "timeline", commandId: "viscerium-timelines:open-storyline-project-timeline", title: "Open the active StoryLine project timeline." });
const myrkild = addGroup("Myrkild", "shield");
addAction(myrkild, { label: "Myrkild unit", icon: "shield", commandId: templaterCreateCommand("Templates/Databases/New Myrkild Unit.md"), title: "Create a structured Myrkild unit." });
const chronicle = addGroup("Chronicle", "calendar");
addAction(chronicle, { label: "Today", icon: "calendar", commandId: "journal-bases:open-current-daily", title: "Open or create today's Chronicle." });
addAction(chronicle, { label: "Week", icon: "calendar", commandId: "journal-bases:open-current-weekly", title: "Open or create this week's review." });
addAction(chronicle, { label: "Month", icon: "calendar", commandId: "journal-bases:open-current-monthly", title: "Open or create this month's review." });
