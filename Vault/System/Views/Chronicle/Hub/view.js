const compact = Boolean(input?.compact);
const now = window.moment();
const today = now.clone().startOf("day");
const weekStart = now.clone().startOf("isoWeek");
const weekEnd = now.clone().endOf("isoWeek");
const monthStart = now.clone().startOf("month");
const quarterStart = now.clone().startOf("quarter");
const quarterEnd = now.clone().endOf("quarter");

const periodPath = {
  daily: `Private/Journal/Daily/${today.format("YYYY")}/${today.format("YYYY-MM-DD")}.md`,
  weekly: `Private/Journal/Weekly/${weekStart.format("GGGG")}/${weekStart.format("GGGG-[W]WW")}.md`,
  monthly: `Private/Journal/Monthly/${monthStart.format("YYYY")}/${monthStart.format("YYYY-MM")}.md`,
  quarterly: `Private/Journal/Quarterly/${quarterStart.format("YYYY")}/${quarterStart.format("YYYY-[Q]Q")}.md`,
  yearly: `Private/Journal/Yearly/${now.format("YYYY")}.md`,
};

const weekRange = weekStart.month() === weekEnd.month()
  ? `${weekStart.format("D")}–${weekEnd.format("D MMMM")}`
  : `${weekStart.format("D MMM")}–${weekEnd.format("D MMM")}`;

const periods = [
  {
    type: "daily",
    label: "Today",
    detail: today.format("ddd, D MMM"),
    primary: true,
  },
  {
    type: "weekly",
    label: `Week ${String(weekStart.isoWeek()).padStart(2, "0")}`,
    detail: weekRange,
    primary: true,
  },
  {
    type: "monthly",
    label: monthStart.format("MMMM"),
    detail: monthStart.format("YYYY"),
  },
  {
    type: "quarterly",
    label: `Q${quarterStart.quarter()}`,
    detail: `${quarterStart.format("MMM")}–${quarterEnd.format("MMM YYYY")}`,
  },
  {
    type: "yearly",
    label: now.format("YYYY"),
    detail: "Annual review",
  },
];

const root = dv.container.createDiv({
  cls: `vc-chronicle-hub${compact ? " is-compact" : ""}`,
});
const grid = root.createDiv({ cls: "vc-chronicle-period-grid" });

for (const period of periods) {
  const path = periodPath[period.type];
  const exists = Boolean(app.vault.getFileByPath(path));
  const commandId = `journal-bases:open-current-${period.type}`;
  const commandAvailable = Boolean(app.commands.commands[commandId]);

  const row = grid.createDiv({
    cls: `vc-chronicle-period${period.primary ? " is-primary" : ""}`,
  });

  const copy = row.createDiv({ cls: "vc-chronicle-period-copy" });
  copy.createDiv({ text: period.label, cls: "vc-chronicle-period-label" });
  copy.createDiv({ text: period.detail, cls: "vc-chronicle-period-detail" });

  const button = row.createEl("button", {
    text: exists ? "Open" : "Create",
    cls: "vc-chronicle-period-action",
    attr: {
      title: commandAvailable
        ? `${exists ? "Open" : "Create"} the current ${period.type} note.`
        : "Journal Bases is not available. Install and enable the required plugin.",
    },
  });

  if (!commandAvailable) {
    button.disabled = true;
  } else {
    button.addEventListener("click", () => app.commands.executeCommandById(commandId));
  }
}

const footerTarget = compact ? "System/Chronicle" : "System/Bases/Chronicle.base";
const footerLabel = compact ? "Open Chronicle →" : "Open review workspace →";
const footer = root.createDiv({ cls: "vc-chronicle-footer" });
const review = footer.createEl("a", {
  text: footerLabel,
  cls: "internal-link vc-chronicle-review-link",
  attr: {
    href: footerTarget,
    "data-href": footerTarget,
  },
});
review.addEventListener("click", (event) => {
  event.preventDefault();
  app.workspace.openLinkText(
    footerTarget,
    dv.current().file.path,
    event.ctrlKey || event.metaKey,
  );
});
