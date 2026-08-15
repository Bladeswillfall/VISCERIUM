const period = String(input?.period ?? dv.current()?.period ?? "").toLowerCase();
const currentPath = dv.current()?.file?.path ?? "System/Chronicle.md";
const currentName = dv.current()?.file?.name ?? "";
const moment = window.moment;
const today = moment().startOf("day");

const root = dv.container.createDiv({ cls: `vc-chronicle-evidence vc-chronicle-evidence-${period}` });

function resolveRange(name, layer) {
  if (layer === "weekly") {
    const parsed = moment(name, "GGGG-[W]WW", true);
    if (!parsed.isValid()) return null;
    return { start: parsed.clone().startOf("isoWeek"), end: parsed.clone().endOf("isoWeek") };
  }
  if (layer === "monthly") {
    const parsed = moment(name, "YYYY-MM", true);
    if (!parsed.isValid()) return null;
    return { start: parsed.clone().startOf("month"), end: parsed.clone().endOf("month") };
  }
  if (layer === "quarterly") {
    const match = name.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return null;
    const start = moment({ year: Number(match[1]), month: (Number(match[2]) - 1) * 3, day: 1 }).startOf("month");
    return { start, end: start.clone().add(2, "months").endOf("month") };
  }
  if (layer === "yearly") {
    const match = name.match(/^(\d{4})$/);
    if (!match) return null;
    const start = moment({ year: Number(match[1]), month: 0, day: 1 }).startOf("year");
    return { start, end: start.clone().endOf("year") };
  }
  return null;
}

const range = resolveRange(currentName, period);
if (!range) {
  root.createDiv({ text: "Chronicle could not determine this note's period from its filename.", cls: "vc-chronicle-empty" });
  return;
}

function inRange(date, start = range.start, end = range.end) {
  return date && date.isBetween(start, end, "day", "[]");
}

function parseDailyName(name) {
  const parsed = moment(name, "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed.startOf("day") : null;
}

function parseWeeklyName(name) {
  const parsed = moment(name, "GGGG-[W]WW", true);
  return parsed.isValid() ? parsed.startOf("isoWeek") : null;
}

function parseMonthlyName(name) {
  const parsed = moment(name, "YYYY-MM", true);
  return parsed.isValid() ? parsed.startOf("month") : null;
}

function parseQuarterlyName(name) {
  const match = name.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return null;
  return moment({ year: Number(match[1]), month: (Number(match[2]) - 1) * 3, day: 1 }).startOf("month");
}

function toMoment(value) {
  if (!value) return null;
  if (typeof value.toISODate === "function") {
    const parsed = moment(value.toISODate(), "YYYY-MM-DD", true);
    return parsed.isValid() ? parsed.startOf("day") : null;
  }
  if (typeof value.ts === "number") return moment(value.ts).startOf("day");
  if (value instanceof Date) return moment(value).startOf("day");
  const match = String(value).match(/\d{4}-\d{2}-\d{2}/);
  if (!match) return null;
  const parsed = moment(match[0], "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed.startOf("day") : null;
}

function stripDelimitedBlocks(text, openToken, closeToken = openToken) {
  let output = String(text ?? "");
  if (!openToken || !closeToken) return output;

  while (true) {
    const start = output.indexOf(openToken);
    if (start === -1) return output;

    const end = output.indexOf(closeToken, start + openToken.length);
    if (end === -1) return output.slice(0, start);

    output = output.slice(0, start) + output.slice(end + closeToken.length);
  }
}

function cleanSection(section) {
  const withoutObsidianComments = stripDelimitedBlocks(section, "%%");
  return stripDelimitedBlocks(withoutObsidianComments, "<!--", "-->").trim();
}

function extractSection(text, heading) {
  const lines = text.split(/\r?\n/);
  const wanted = heading.trim().toLowerCase();
  const body = [];
  let active = false;

  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      if (active) break;
      active = match[1].trim().toLowerCase() === wanted;
      continue;
    }
    if (active) body.push(line);
  }

  const cleaned = cleanSection(body.join("\n"));
  if (!cleaned || cleaned === "-" || cleaned === "- [ ]") return "";
  return cleaned;
}

function plainSection(section) {
  return section
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label ?? target.split("/").pop())
    .replace(/\s+/g, " ")
    .trim();
}

function addInternalLink(parent, label, path, cls = "") {
  const link = parent.createEl("a", {
    text: label,
    cls: `internal-link ${cls}`.trim(),
    attr: { href: path, "data-href": path },
  });
  link.addEventListener("click", (event) => {
    event.preventDefault();
    app.workspace.openLinkText(path, currentPath, event.ctrlKey || event.metaKey);
  });
  return link;
}

const dailyEntries = [];
for (const page of dv.pages('"Private/Journal/Daily"')) {
  const date = parseDailyName(page.file.name);
  if (!inRange(date)) continue;
  const file = app.vault.getFileByPath(page.file.path);
  if (!file) continue;
  const text = await app.vault.cachedRead(file);
  dailyEntries.push({
    page,
    date,
    path: page.file.path,
    developments: extractSection(text, "Decisions, Milestones & Developments"),
    upcoming: extractSection(text, "Upcoming"),
    activity: extractSection(text, "Vault Activity"),
  });
}
dailyEntries.sort((a, b) => a.date.valueOf() - b.date.valueOf());

function getOpenTasks() {
  const tasks = [];
  for (const page of dv.pages("")) {
    const path = page.file.path;
    if (path === "Home.md" || path.startsWith("System/") || path.startsWith("Templates/")) continue;
    for (const task of page.file.tasks ?? []) {
      if (task.completed) continue;
      tasks.push({
        task,
        path: task.path ?? path,
        scheduled: toMoment(task.scheduled),
        due: toMoment(task.due),
      });
    }
  }
  return tasks;
}

function taskLabel(task) {
  return String(task.text ?? "")
    .replace(/[⏳🗓️]\s*\d{4}-\d{2}-\d{2}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderTasks(title, items, dateKey, open = false) {
  if (!items.length) return;
  const details = root.createEl("details", { cls: "vc-chronicle-details" });
  details.open = open;
  const summary = details.createEl("summary");
  summary.createSpan({ text: title, cls: "vc-chronicle-details-title" });
  summary.createSpan({ text: String(items.length), cls: "vc-chronicle-count" });

  const list = details.createDiv({ cls: "vc-chronicle-task-list" });
  const visible = items.slice(0, 8);
  for (const item of visible) {
    const row = list.createDiv({ cls: "vc-chronicle-task" });
    addInternalLink(row, taskLabel(item.task) || "Untitled task", item.path, "vc-chronicle-task-link");
    const date = item[dateKey];
    if (date) row.createSpan({ text: date.format("D MMM"), cls: "vc-chronicle-task-date" });
  }
  if (items.length > visible.length) {
    const more = list.createDiv({ cls: "vc-chronicle-more" });
    more.createSpan({ text: `+${items.length - visible.length} more · ` });
    addInternalLink(more, "Creator Tasks", "System/Creator Tasks");
  }
}

function renderDevelopments(entries, open = false) {
  const items = entries.filter((entry) => entry.developments);
  if (!items.length) return;
  const details = root.createEl("details", { cls: "vc-chronicle-details" });
  details.open = open;
  const summary = details.createEl("summary");
  summary.createSpan({ text: "Decisions, milestones & developments", cls: "vc-chronicle-details-title" });
  summary.createSpan({ text: String(items.length), cls: "vc-chronicle-count" });

  const list = details.createDiv({ cls: "vc-chronicle-development-list" });
  for (const entry of items) {
    const row = list.createDiv({ cls: "vc-chronicle-development" });
    addInternalLink(row, entry.date.format("D MMM"), entry.path, "vc-chronicle-development-date");
    row.createDiv({ text: plainSection(entry.developments), cls: "vc-chronicle-development-copy" });
  }
}

function renderUpcoming(entries) {
  const items = entries.filter((entry) => entry.upcoming);
  if (!items.length) return;
  const details = root.createEl("details", { cls: "vc-chronicle-details" });
  const summary = details.createEl("summary");
  summary.createSpan({ text: "Upcoming context", cls: "vc-chronicle-details-title" });
  summary.createSpan({ text: String(items.length), cls: "vc-chronicle-count" });
  const list = details.createDiv({ cls: "vc-chronicle-development-list" });
  for (const entry of items) {
    const row = list.createDiv({ cls: "vc-chronicle-development" });
    addInternalLink(row, entry.date.format("D MMM"), entry.path, "vc-chronicle-development-date");
    row.createDiv({ text: plainSection(entry.upcoming), cls: "vc-chronicle-development-copy" });
  }
}

function classifyPath(path) {
  const target = String(path).replace(/\\/g, "/").replace(/\.md$/i, "");
  const rootFolder = target.split("/")[0];
  if (["Lore", "Stories", "Drafts", "System"].includes(rootFolder)) return rootFolder;
  return "Other";
}

function activityRecords(entries) {
  const records = [];
  const linkPattern = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  for (const entry of entries) {
    if (!entry.activity) continue;
    const areas = new Set();
    let match;
    while ((match = linkPattern.exec(entry.activity)) !== null) {
      areas.add(classifyPath(match[1]));
    }
    if (areas.size) records.push({ date: entry.date.clone(), areas });
  }
  return records;
}

const activity = activityRecords(dailyEntries);
const activityAreas = ["Lore", "Stories", "Drafts", "System", "Other"];

function areaCounts(records = activity) {
  const counts = Object.fromEntries(activityAreas.map((area) => [area, 0]));
  for (const record of records) {
    for (const area of record.areas) counts[area] = (counts[area] ?? 0) + 1;
  }
  return counts;
}

function renderActivityBars(title = "Vault activity by area") {
  if (!activity.length) return;
  const section = root.createDiv({ cls: "vc-chronicle-activity" });
  section.createDiv({ text: title, cls: "vc-chronicle-subheading" });
  const counts = areaCounts();
  const maximum = Math.max(1, ...Object.values(counts));

  for (const area of activityAreas) {
    const count = counts[area] ?? 0;
    const row = section.createDiv({ cls: "vc-chronicle-bar-row" });
    row.createDiv({ text: area, cls: "vc-chronicle-bar-label" });
    const track = row.createDiv({ cls: "vc-chronicle-bar-track" });
    const fill = track.createDiv({ cls: "vc-chronicle-bar-fill" });
    fill.style.width = `${(count / maximum) * 100}%`;
    track.setAttribute("aria-label", `${area}: ${count} active day${count === 1 ? "" : "s"}`);
    row.createDiv({ text: `${count}d`, cls: "vc-chronicle-bar-value" });
  }
}

function monthStarts(start, end) {
  const months = [];
  const cursor = start.clone().startOf("month");
  while (cursor.isSameOrBefore(end, "month")) {
    months.push(cursor.clone());
    cursor.add(1, "month");
  }
  return months;
}

function renderActivityMatrix(title = "Vault activity across the period") {
  if (!activity.length) return;
  const months = monthStarts(range.start, range.end);
  const counts = {};
  let maximum = 0;
  for (const area of activityAreas) {
    counts[area] = {};
    for (const monthStart of months) {
      const key = monthStart.format("YYYY-MM");
      const value = activity.filter((record) => record.date.format("YYYY-MM") === key && record.areas.has(area)).length;
      counts[area][key] = value;
      maximum = Math.max(maximum, value);
    }
  }
  maximum = Math.max(1, maximum);

  const section = root.createDiv({ cls: "vc-chronicle-matrix-section" });
  section.createDiv({ text: title, cls: "vc-chronicle-subheading" });
  const matrix = section.createDiv({ cls: "vc-chronicle-matrix" });
  matrix.style.setProperty("--chronicle-month-count", String(months.length));

  matrix.createDiv({ text: "", cls: "vc-chronicle-matrix-corner" });
  for (const monthStart of months) {
    matrix.createDiv({ text: monthStart.format("MMM").slice(0, 1), cls: "vc-chronicle-matrix-month", attr: { title: monthStart.format("MMMM YYYY") } });
  }

  for (const area of activityAreas) {
    matrix.createDiv({ text: area, cls: "vc-chronicle-matrix-label" });
    for (const monthStart of months) {
      const key = monthStart.format("YYYY-MM");
      const count = counts[area][key] ?? 0;
      const level = count === 0 ? 0 : Math.max(1, Math.ceil((count / maximum) * 4));
      matrix.createDiv({
        text: count ? String(count) : "·",
        cls: "vc-chronicle-matrix-cell",
        attr: {
          "data-level": String(level),
          title: `${monthStart.format("MMMM")} · ${area} · ${count} active day${count === 1 ? "" : "s"}`,
          "aria-label": `${monthStart.format("MMMM")} ${area}: ${count} active day${count === 1 ? "" : "s"}`,
        },
      });
    }
  }
}

function renderActivityNote() {
  if (!activity.length) return;
  root.createDiv({
    text: "Vault activity is derived from sealed Daily Activity snapshots. Work outside the tracked vault paths is not included.",
    cls: "vc-chronicle-source-note",
  });
}

function periodPages(folder, parser, start = range.start, end = range.end, overlapEnd = null) {
  const pages = [];
  for (const page of dv.pages(`"${folder}"`)) {
    const date = parser(page.file.name);
    if (!date) continue;
    const itemEnd = overlapEnd ? overlapEnd(date.clone()) : date.clone();
    if (itemEnd.isBefore(start, "day") || date.isAfter(end, "day")) continue;
    pages.push({ page, date, path: page.file.path });
  }
  pages.sort((a, b) => a.date.valueOf() - b.date.valueOf());
  return pages;
}

function renderPeriodLinks(title, items, labeler) {
  if (!items.length) return;
  const section = root.createDiv({ cls: "vc-chronicle-period-links" });
  section.createDiv({ text: title, cls: "vc-chronicle-subheading" });
  const line = section.createDiv({ cls: "vc-chronicle-link-line" });
  items.forEach((item, index) => {
    if (index > 0) line.createSpan({ text: " · ", cls: "vc-chronicle-link-separator" });
    addInternalLink(line, labeler(item), item.path, "vc-chronicle-source-link");
  });
}

function renderWeekStrip() {
  const strip = root.createDiv({ cls: "vc-chronicle-week-strip" });
  for (let offset = 0; offset < 7; offset += 1) {
    const date = range.start.clone().add(offset, "day");
    const expectedPath = `Private/Journal/Daily/${date.format("YYYY")}/${date.format("YYYY-MM-DD")}.md`;
    const exists = Boolean(app.vault.getFileByPath(expectedPath));
    const cell = strip.createDiv({ cls: `vc-chronicle-day${exists ? " has-note" : " no-note"}` });
    cell.createDiv({ text: date.format("dd").slice(0, 1), cls: "vc-chronicle-day-name" });
    const dateLabel = date.format("D");
    if (exists) addInternalLink(cell, dateLabel, expectedPath, "vc-chronicle-day-date");
    else cell.createDiv({ text: dateLabel, cls: "vc-chronicle-day-date" });
    cell.createDiv({ text: exists ? "●" : "○", cls: "vc-chronicle-day-state", attr: { title: exists ? "Daily note exists" : "No Daily note" } });
  }
}

if (period === "weekly") {
  renderWeekStrip();

  const tasks = getOpenTasks();
  const scheduled = tasks.filter((item) => inRange(item.scheduled)).sort((a, b) => a.scheduled - b.scheduled);
  const due = tasks.filter((item) => inRange(item.due)).sort((a, b) => a.due - b.due);
  const isCurrentWeek = today.isBetween(range.start, range.end, "day", "[]");
  const previouslyScheduled = isCurrentWeek
    ? tasks.filter((item) => item.scheduled?.isBefore(today, "day")).sort((a, b) => b.scheduled - a.scheduled)
    : [];

  renderTasks("Scheduled", scheduled, "scheduled", true);
  renderTasks("Due", due, "due", due.some((item) => item.due?.isSame(today, "day")));
  renderTasks("Previously scheduled", previouslyScheduled, "scheduled", false);
  renderDevelopments(dailyEntries, true);
  renderUpcoming(dailyEntries);
}

if (period === "monthly") {
  const weeks = periodPages(
    "Private/Journal/Weekly",
    parseWeeklyName,
    range.start,
    range.end,
    (start) => start.clone().endOf("isoWeek"),
  );
  renderPeriodLinks("Weekly reviews", weeks, (item) => `W${String(item.date.isoWeek()).padStart(2, "0")}`);
  renderDevelopments(dailyEntries);
  renderActivityBars();

  const due = getOpenTasks().filter((item) => inRange(item.due)).sort((a, b) => a.due - b.due);
  renderTasks("Due this month", due, "due", false);
  renderActivityNote();
}

if (period === "quarterly") {
  const months = periodPages("Private/Journal/Monthly", parseMonthlyName);
  renderPeriodLinks("Monthly reviews", months, (item) => item.date.format("MMM"));
  renderDevelopments(dailyEntries);
  renderActivityBars();
  renderActivityMatrix("Vault activity by month");

  const due = getOpenTasks().filter((item) => inRange(item.due)).sort((a, b) => a.due - b.due);
  renderTasks("Open due commitments", due, "due", false);
  renderActivityNote();
}

if (period === "yearly") {
  const quarters = periodPages(
    "Private/Journal/Quarterly",
    parseQuarterlyName,
    range.start,
    range.end,
    (start) => start.clone().add(2, "months").endOf("month"),
  );
  const months = periodPages("Private/Journal/Monthly", parseMonthlyName);
  renderPeriodLinks("Quarterly reviews", quarters, (item) => `Q${item.date.quarter()}`);
  renderPeriodLinks("Monthly reviews", months, (item) => item.date.format("MMM"));
  renderActivityBars("Active days by area");
  renderActivityMatrix("Activity across the year");
  renderDevelopments(dailyEntries);
  renderActivityNote();
}

if (!root.children.length) {
  root.createDiv({ text: "No source evidence is available for this period yet.", cls: "vc-chronicle-empty" });
}
