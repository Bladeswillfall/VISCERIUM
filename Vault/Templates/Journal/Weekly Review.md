<%*
const source = tp.file.title;
const week = moment(source, "GGGG-[W]WW", true);
const start = week.isValid() ? week.clone().startOf("isoWeek") : moment().startOf("isoWeek");
const end = start.clone().endOf("isoWeek");
const range = start.year() !== end.year()
  ? `${start.format("D MMMM YYYY")}–${end.format("D MMMM YYYY")}`
  : start.month() !== end.month()
    ? `${start.format("D MMMM")}–${end.format("D MMMM YYYY")}`
    : `${start.format("D")}–${end.format("D MMMM YYYY")}`;
tR += `---\ntype: journal\nperiod: weekly\n---\n\n# Week ${String(start.isoWeek()).padStart(2, "0")} · ${range}\n`;
%>

## Weekly Direction

%% Select one to three areas that need your attention this week.
Include only work that is important now. %%

-

## This Week

```dataviewjs
await dv.view("System/Views/Chronicle/Evidence", { period: "weekly" })
```

## Week in Review

%% Record the important changes from this week.
Record the decisions that you made.
Record important work that you completed.
Record unresolved problems that still need your attention. %%

-

## Next Week

%% Select the work that must continue next week.
Do not copy unfinished tasks.
Include only work that still needs your attention. %%

-
