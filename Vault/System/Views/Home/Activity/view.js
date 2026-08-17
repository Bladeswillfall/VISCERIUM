const activityKey = `viscerium-creator-activity:v2:${app.vault.getName()}`;
let activity = { days: {} };
try { activity = JSON.parse(localStorage.getItem(activityKey) ?? "{}") ?? {}; }
catch (error) { console.warn("VISCERIUM creator activity could not be read from local storage.", error); }
const days = activity.days ?? {};
const root = dv.container.createDiv({ cls: "vc-home-activity-root" });
root.createDiv({ text: "Enough evidence of momentum to encourage another session.", cls: "vc-home-section-copy" });
const today = new Date();
today.setHours(0, 0, 0, 0);
const start = new Date(today);
start.setDate(start.getDate() - start.getDay() - (25 * 7));
const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
let total = 0;
let activeDays = 0;
const counts = [];
for (let index = 0; index < 182; index += 1) {
  const date = new Date(start);
  date.setDate(start.getDate() + index);
  const key = dayKey(date);
  const count = Number(days[key] ?? 0);
  total += count;
  if (count > 0) activeDays += 1;
  counts.push({ key, count });
}
const metrics = root.createDiv({ cls: "vc-home-activity-metrics" });
const metric = (value, label) => {
  const item = metrics.createDiv({ cls: "vc-home-activity-metric" });
  item.createSpan({ text: String(value), cls: "vc-home-activity-metric-value" });
  item.createSpan({ text: label, cls: "vc-home-activity-metric-label" });
};
metric(activeDays, "active days");
metric(total, "changed files");
const heatmap = root.createDiv({ cls: "vc-home-heatmap" });
for (const { key, count } of counts) {
  const cell = heatmap.createSpan({ cls: "vc-home-heatmap-cell" });
  cell.dataset.level = String(count === 0 ? 0 : Math.min(4, count));
  cell.title = `${key} · ${count} changed file${count === 1 ? "" : "s"}`;
}
