<%*
const source = tp.file.title;
const month = moment(source, "YYYY-MM", true);
const period = month.isValid() ? month : moment().startOf("month");
tR += `---\ntype: journal\nperiod: monthly\n---\n\n# ${period.format("MMMM YYYY")}\n`;
%>

## Monthly Direction

%% Select the areas that need attention this month.
Include only work that can materially change the project. %%

-

## Source Evidence

```dataviewjs
await dv.view("System/Views/Chronicle/Evidence", { period: "monthly" })
```

## Project Changes

%% Record the important changes from this month.
Record major decisions, completed work, new directions, and abandoned directions.
Record changes that will be important later. %%

-

## Next Month

%% Select the work that should continue next month.
Do not copy unfinished tasks.
Include only work that is still important. %%

-
