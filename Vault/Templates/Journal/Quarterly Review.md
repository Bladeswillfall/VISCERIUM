<%*
const match = tp.file.title.match(/^(\d{4})-Q([1-4])$/);
const year = match ? Number(match[1]) : moment().year();
const quarter = match ? Number(match[2]) : moment().quarter();
const start = moment({ year, month: (quarter - 1) * 3, day: 1 }).startOf("month");
const end = start.clone().add(2, "months").endOf("month");
tR += `---\ntype: journal\nperiod: quarterly\n---\n\n# Q${quarter} · ${start.format("MMMM")}–${end.format("MMMM YYYY")}\n`;
%>

## Quarterly Direction

%% Select the areas that need strategic attention this quarter.
Include only work that can change the direction, quality, or structure of VISCERIUM. %%

-

## Source Evidence

```dataviewjs
await dv.view("System/Views/Chronicle/Evidence", { period: "quarterly" })
```

## Strategic Review

%% Record the important changes from this quarter.
Record what worked and what did not work.

Consider these questions:
- What work felt most meaningful or rewarding?
- What work produced the strongest results?
- What does VISCERIUM need most now?
- Where do your interests, strengths, and the needs of the project currently align?
- What are you spending time on that no longer serves the project?
- What should change before the next quarter?

Record important decisions, risks, and unresolved problems.
Record any change to the direction of the project. %%

-

## Next Quarter

%% Select the work that should guide the next quarter.
Do not copy unfinished tasks.
Include only work that remains strategically important. %%

-
