const sourcePath = dv.currentFilePath || "Home.md";
const root = dv.container.createDiv({ cls: "vc-home-attention-root" });
const loading = root.createDiv({ text: "Checking project state…", cls: "vc-home-empty vc-home-loading" });
const indexReady = () => Boolean(dv.index?.initialized);
const startedAt = Date.now();
while (!indexReady() && Date.now() - startedAt < 30000) {
  await new Promise((resolve) => window.setTimeout(resolve, 150));
}
if (!indexReady()) {
  loading.setText("Project state is still indexing. It will appear after Dataview finishes starting.");
  return;
}
loading.remove();
await new Promise((resolve) => {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => resolve(), { timeout: 500 });
  else window.setTimeout(resolve, 0);
});

const ERA_SENSITIVE_TYPES = new Set(["character", "faction", "location", "event", "species", "fauna", "flora", "fungi", "item", "myrkild-unit"]);
const isEmpty = (value) => value == null || (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0) || (typeof value?.length === "number" && value.length === 0);
const asArray = (value) => value == null ? [] : Array.isArray(value) ? value.filter((entry) => entry != null) : typeof value?.array === "function" ? value.array().filter((entry) => entry != null) : [value];
const eraCount = (p) => asArray(p.eras).length || (isEmpty(p.era) ? 0 : 1);
const analyse = (p) => {
  const labels = [];
  let count = 0;
  if (isEmpty(p.title)) { labels.push("Missing title"); count += 1; }
  if (isEmpty(p.description)) { labels.push("Missing description"); count += 1; }
  if (isEmpty(p.type)) { labels.push("Missing type"); count += 1; }
  if (ERA_SENSITIVE_TYPES.has(String(p.type ?? "")) && eraCount(p) === 0) { labels.push("Missing era"); count += 1; }
  const migrationIssues = asArray(p.import_issues).length;
  if (migrationIssues > 0) {
    labels.push(`${migrationIssues} migration issue${migrationIssues === 1 ? "" : "s"}`);
    count += migrationIssues;
  }
  const severity = count >= 4 ? "critical" : count === 3 ? "urgent" : count === 2 ? "elevated" : "notice";
  return { page: p, labels, count, severity };
};
const internalLink = (parent, label, target, className = "vc-home-row-link") => {
  const link = parent.createEl("a", { text: label, cls: `internal-link ${className}`, attr: { href: target, "data-href": target } });
  link.addEventListener("click", (event) => {
    event.preventDefault();
    app.workspace.openLinkText(target, sourcePath, event.ctrlKey || event.metaKey);
  });
  return link;
};

const candidates = Array.from(
  dv.pages("").where((p) => typeof p?.file?.path === "string" && (p.file.path.startsWith("Lore/") || p.file.path.startsWith("Drafts/WorldAnvil Import/")))
);
const flagged = candidates
  .map(analyse)
  .filter((entry) => entry.count > 0)
  .sort((a, b) => b.count - a.count || (b.page.file.mtime?.toMillis?.() ?? 0) - (a.page.file.mtime?.toMillis?.() ?? 0));
const totalIssues = flagged.reduce((sum, entry) => sum + entry.count, 0);
const criticalCount = flagged.filter((entry) => entry.severity === "critical").length;
const ready = candidates
  .filter((p) => p.file.path.startsWith("Lore/") && String(p.status ?? "") !== "published" && [p.title, p.description, p.type, p.status].filter(isEmpty).length === 0)
  .sort((a, b) => (b.file.mtime?.toMillis?.() ?? 0) - (a.file.mtime?.toMillis?.() ?? 0));

const summary = root.createDiv({ cls: "vc-home-attention-summary" });
const copy = summary.createDiv({ cls: "vc-home-attention-copy" });
copy.createDiv({ text: "Surface what blocks, breaks, or waits for a decision. Everything else stays in the tracker.", cls: "vc-home-section-copy" });
const stats = summary.createDiv({ cls: "vc-home-attention-stats" });
const stat = (value, label, tone) => {
  const item = stats.createDiv({ cls: `vc-home-stat is-${tone}` });
  item.createSpan({ text: String(value), cls: "vc-home-stat-value" });
  item.createSpan({ text: label, cls: "vc-home-stat-label" });
};
stat(criticalCount, "Critical", criticalCount ? "critical" : "quiet");
stat(totalIssues, "Total issues", totalIssues ? "attention" : "quiet");

const list = root.createDiv({ cls: "vc-home-attention-list" });
if (!flagged.length) list.createDiv({ text: "No current publishing or migration blockers.", cls: "vc-home-empty" });
for (const entry of flagged.slice(0, 3)) {
  const row = list.createDiv({ cls: "vc-home-attention-row" });
  row.dataset.severity = entry.severity;
  row.createSpan({ text: entry.severity === "critical" ? "Critical" : "Review", cls: "vc-home-attention-severity" });
  internalLink(row, String(entry.page.title ?? entry.page.file.name), entry.page.file.path, "vc-home-attention-note");
  row.createDiv({ text: entry.labels.join(" · "), cls: "vc-home-attention-detail" });
  row.createSpan({ text: "Broken", cls: "vc-home-attention-state" });
}

const footer = root.createDiv({ cls: "vc-home-attention-footer" });
const readyNote = footer.createDiv({ cls: "vc-home-ready-note" });
readyNote.createSpan({ text: `${ready.length} structurally ready`, cls: "vc-home-ready-count" });
readyNote.createSpan({ text: "Required publishing fields exist; this is not editorial approval.", cls: "vc-home-ready-copy" });
const links = footer.createDiv({ cls: "vc-home-attention-actions" });
internalLink(links, "Open issue tracker", "System/Bases/Needs Attention.base", "vc-home-inline-link");
internalLink(links, "Publishing gate", "System/Bases/Publishing.base", "vc-home-inline-link vc-home-inline-link-muted");
