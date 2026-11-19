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
const createButton = addLaunchButton("Create new", null, false, "plus");
const createCommandId = "viscerium-creator-tools:create";
const createAvailable = Boolean(app.commands?.commands?.[createCommandId]);
if (!createAvailable) {
  createButton.disabled = true;
  createButton.title = "VISCERIUM Creator Tools is unavailable.";
} else {
  createButton.addEventListener("click", () => app.commands.executeCommandById(createCommandId));
}
