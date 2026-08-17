const sourcePath = dv.currentFilePath || "Home.md";
const root = dv.container.createDiv({ cls: "vc-home-chronicle-root" });
root.createDiv({ text: "Build the habit by making today's entry the obvious next step.", cls: "vc-home-section-copy" });
const now = window.moment();
const today = now.clone().startOf("day");
const week = now.clone().startOf("isoWeek");
const month = now.clone().startOf("month");
const year = now.clone().startOf("year");
const todayPath = `Private/Journal/Daily/${today.format("YYYY")}/${today.format("YYYY-MM-DD")}.md`;
const todayExists = Boolean(app.vault.getFileByPath?.(todayPath) ?? app.vault.getAbstractFileByPath(todayPath));
const prompt = root.createDiv({ cls: "vc-home-chronicle-prompt" });
const copy = prompt.createDiv({ cls: "vc-home-chronicle-prompt-copy" });
copy.createDiv({ text: todayExists ? "Today's Chronicle is ready to continue." : "Today hasn't been chronicled yet.", cls: "vc-home-chronicle-prompt-title" });
copy.createDiv({ text: today.format("dddd · D MMMM YYYY"), cls: "vc-home-chronicle-prompt-date" });
const button = prompt.createEl("button", { text: todayExists ? "Open today's Chronicle" : "Write today's Chronicle", cls: "vc-home-button vc-home-button-secondary" });
const dailyCommand = "journal-bases:open-current-daily";
if (!app.commands?.commands?.[dailyCommand]) button.disabled = true;
else button.addEventListener("click", () => app.commands.executeCommandById(dailyCommand));

const periods = root.createDiv({ cls: "vc-home-chronicle-periods" });
const defs = [
  { label: `Week ${String(week.isoWeek()).padStart(2, "0")}`, detail: `${week.format("D")}–${week.clone().endOf("isoWeek").format("D MMM")}`, command: "journal-bases:open-current-weekly" },
  { label: month.format("MMMM"), detail: "Monthly review", command: "journal-bases:open-current-monthly" },
  { label: year.format("YYYY"), detail: "Annual review", command: "journal-bases:open-current-yearly" },
];
for (const def of defs) {
  const period = periods.createEl("button", { cls: "vc-home-chronicle-period", attr: { title: `Open ${def.label}` } });
  period.createSpan({ text: def.label, cls: "vc-home-chronicle-period-label" });
  period.createSpan({ text: def.detail, cls: "vc-home-chronicle-period-detail" });
  if (!app.commands?.commands?.[def.command]) period.disabled = true;
  else period.addEventListener("click", () => app.commands.executeCommandById(def.command));
}
const footer = root.createDiv({ cls: "vc-home-card-footer" });
const link = footer.createEl("a", { text: "Open Chronicle", cls: "internal-link vc-home-inline-link", attr: { href: "System/Chronicle", "data-href": "System/Chronicle" } });
link.addEventListener("click", (event) => {
  event.preventDefault();
  app.workspace.openLinkText("System/Chronicle", sourcePath, event.ctrlKey || event.metaKey);
});
