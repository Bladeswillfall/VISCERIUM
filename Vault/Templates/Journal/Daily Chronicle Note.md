<%*
const source = tp.file.title;
const parsed = moment(source, "YYYY-MM-DD", true);
const date = parsed.isValid() ? parsed : moment();
tR += `---\ntype: journal\nperiod: daily\ndate: "${date.format("YYYY-MM-DD")}"\n---\n\n# ${date.format("dddd, D MMMM YYYY")}\n`;
%>

## Today's Focus

%% Select up to three things that need your attention today.
Do not use this section as a backlog. %%

- [ ]
- [ ]
- [ ]

## Ideas

-

## References

-

## Notes

-

## Upcoming

%% Record future events, dates, or context that you want to remember.
Use a scheduled or due date on a task when the item is an action. %%

-

## Decisions, Milestones & Developments

%% Record decisions, milestones, breakthroughs, reversals, or other important changes from this date.
Leave this section blank if nothing significant occurred. %%

-

## Vault Activity

<!-- Run the "Seal Today's Activity" command, or its assigned hotkey, once near the end of your work session to insert today's activity timeline below. -->
