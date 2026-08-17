const sourcePath = dv.currentFilePath || "Home.md";
const root = dv.container.createDiv({ cls: "vc-home-navigate-root" });
root.createDiv({ text: "Important gateways only; the sidebar remains the filesystem.", cls: "vc-home-section-copy" });
const SVG_NS = "http://www.w3.org/2000/svg";
const icons = {
  world: "M3 18 9.4 8l3.4 5.1L15.6 9 21 18H3Zm0 2h18v2H3v-2Z",
  database: "M4 5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 5c0 1.7 3.6 3 8 3s8-1.3 8-3V7c-1.7 1.2-4.8 2-8 2s-6.3-.8-8-2v3Zm0 5c0 1.7 3.6 3 8 3s8-1.3 8-3v-3c-1.7 1.2-4.8 2-8 2s-6.3-.8-8-2v3Zm0 5c0 1.7 3.6 3 8 3s8-1.3 8-3v-3c-1.7 1.2-4.8 2-8 2s-6.3-.8-8-2v3Z",
  book: "M4 4h7c1.2 0 2 .8 2 2v14c0-1.1-.9-2-2-2H4V4Zm16 0h-7c-1.2 0-2 .8-2 2v14c0-1.1.9-2 2-2h7V4Z",
  tools: "M14.7 4.3a5 5 0 0 0-6.6 6.6L3 16v5h5l5.1-5.1a5 5 0 0 0 6.6-6.6l-3.2 3.2-3-3 3.2-3.2Z",
};
const groups = [
  { title: "Lore", icon: "world", links: [["CITADEL", "Lore/Eras/CITADEL"], ["SMOG", "Lore/Eras/SMOG"], ["NEARSIGHT", "Lore/Eras/NEARSIGHT"], ["ENTROPY", "Lore/Eras/ENTROPY"]] },
  { title: "Databases", icon: "database", links: [["Lore Registry", "System/Bases/Lore Registry.base"], ["Needs Attention", "System/Bases/Needs Attention.base"], ["Publishing", "System/Bases/Publishing.base"], ["Story Entities", "System/Bases/Story Entities.base"], ["Myrkild Units", "System/Bases/Myrkild Units.base"]] },
  { title: "Stories", icon: "book", links: [["StoryLine integration", "System/StoryLine Integration"], ["Storyteller workflow", "System/SOPs/Storyteller View SOP"]] },
  { title: "Tools", icon: "tools", links: [["Chronicle", "System/Chronicle"], ["Creator tasks", "System/Creator Tasks"], ["SOP Index", "System/SOPs/SOP Index"], ["Publishing Rules", "System/Publishing Rules"], ["Creator Sidebar", "System/Creator Sidebar"]] },
];
const grid = root.createDiv({ cls: "vc-home-nav-grid" });
for (const group of groups) {
  const section = grid.createDiv({ cls: "vc-home-nav-group" });
  const heading = section.createDiv({ cls: "vc-home-nav-heading" });
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", icons[group.icon]);
  path.setAttribute("fill", "currentColor");
  svg.append(path);
  heading.append(svg);
  heading.createSpan({ text: group.title });
  const links = section.createDiv({ cls: "vc-home-nav-links" });
  for (const [label, target] of group.links) {
    const link = links.createEl("a", { text: label, cls: "internal-link vc-home-nav-link", attr: { href: target, "data-href": target } });
    link.addEventListener("click", (event) => {
      event.preventDefault();
      app.workspace.openLinkText(target, sourcePath, event.ctrlKey || event.metaKey);
    });
  }
}
