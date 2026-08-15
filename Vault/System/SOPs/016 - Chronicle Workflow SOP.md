# Chronicle Workflow

> **Use this workflow when:** You want to record, review, or steer VISCERIUM work across a day, week, month, quarter, or year.
>
> **Result:** Chronicle keeps private source notes and higher-level reflections without copying the same information between periods.
>
> **First action:** Open [[System/Chronicle|Chronicle]].

Chronicle is a private creator record. It is not a productivity score, attendance record, or publication queue.

Daily captures. Weekly interprets. Monthly assesses. Quarterly steers. Yearly records.

## Storage and privacy

Chronicle notes are stored beneath `Private/Journal/`:

```text
Private/Journal/Daily/<YEAR>/<YYYY-MM-DD>.md
Private/Journal/Weekly/<YEAR>/<YYYY-Www>.md
Private/Journal/Monthly/<YEAR>/<YYYY-MM>.md
Private/Journal/Quarterly/<YEAR>/<YYYY-Qn>.md
Private/Journal/Yearly/<YYYY>.md
```

`Private/` is ignored by Git.

Templates, Bases, views, plugin settings, and this SOP remain tracked so the workflow can be reproduced without publishing private entries.

## Open or create a period note

1. Open [[System/Chronicle|Chronicle]].
2. Find the period that you need.
3. Select **Open** when the note exists.
4. Select **Create** when the note does not exist.
5. Write only the reflection or context that belongs at that level.

Journal Bases creates missing notes from the configured Templater template.

Do not create future period notes only because the period will occur later.

Do not treat a missing period note as a failure.

## Use each layer

### Daily

Use **Today's Focus** for up to three things that need deliberate attention today.

Use **Ideas**, **References**, and **Notes** for ordinary capture.

Use **Upcoming** for future events, dates, or context. Do not use it as a task backlog.

Use **Decisions, Milestones & Developments** for changes that will matter when you review the project later.

Use **Vault Activity** for the sealed Daily Activity snapshot. See [[015 - Daily Journal Workflow SOP|Daily Journal Workflow]].

### Weekly

Use **Weekly Direction** to select one to three areas that need attention.

Read the automatic **This Week** evidence before you write the review.

Use **Week in Review** to record what changed, what was decided, what was completed, and what remains unresolved.

Use **Next Week** to record work that should remain alive. Do not copy the unfinished task list.

### Monthly

Use **Monthly Direction** for work that can materially change the project.

Use **Project Changes** to record how VISCERIUM changed during the month.

Use **Next Month** for work that remains important.

Do not rewrite the Weekly Reviews.

### Quarterly

Use **Quarterly Direction** for strategic attention.

Use **Strategic Review** to test meaning, results, current project need, and the current alignment between interests, strengths, and project needs.

Use **Next Quarter** to select the work that should guide the next quarter.

Do not turn the Quarterly Review into a task backlog.

### Yearly

Read **Year at a Glance** before you start the written review.

Use the prompt callouts only when they help you remember or test the year. You do not need to answer every question.

Use **The Year in Review** to record what became true about VISCERIUM.

Use **What Strengthened VISCERIUM** to identify valuable, distinctive, difficult-to-reproduce strengths and whether the project used them effectively.

Use **What Should Change** to identify friction, weak assumptions, and work that should stop, reduce, simplify, or be rebuilt.

Use **Next Year** for long-range direction. Do not create a yearly task list.

## Read source evidence

Chronicle derives evidence at the level where it is useful.

- Weekly evidence shows days, scheduled work, due work, previously scheduled work, Daily developments, and Upcoming context.
- Monthly evidence shows Weekly Reviews, Daily developments, due work, and compact vault activity by area.
- Quarterly evidence shows Monthly Reviews, Daily developments, due commitments, and activity patterns across the quarter.
- Yearly evidence shows Quarterly and Monthly Reviews, major Daily developments, active days by vault area, and activity across the year.

The source evidence is a view. It is not copied into the higher-period note.

The activity graphs use sealed Daily Activity snapshots. They do not include work outside the tracked vault paths.

## Use scheduled and due dates

Use a scheduled date when you intend to work on a task:

```markdown
- [ ] Review Frode's character arc ⏳2026-08-21
```

Use a due date when the task has an actual deadline:

```markdown
- [ ] Deliver character brief 🗓️2026-08-28
```

A task can have both dates.

Keep the task in the note where its context belongs. Chronicle surfaces the dated task without copying it into the target Daily note.

If a scheduled date passes, leave the original date intact until you deliberately reschedule, complete, or remove it.

Chronicle can show the task as **Previously scheduled**. It does not roll the task forward automatically.

Due dates remain visible when relevant. Chronicle does not use countdowns or productivity penalties.

## Use Creator Tasks

[[System/Creator Tasks|Creator Tasks]] remains the complete live list of deliberate open tasks.

Do not create parallel Weekly, Monthly, or Quarterly backlogs.

Create a checkbox only when an action genuinely needs future work.

## Backfill a missed review

You can write a review after its period has ended.

1. Open [[System/Bases/Chronicle.base|Chronicle review workspace]].
2. Navigate to the period.
3. Read the available source evidence.
4. Write only the synthesis that remains useful.

Do not add a completion property merely because the review was written later.

## Check the result

Confirm these statements:

- The note is under the correct private period folder.
- The template supplied `type: journal` and the correct `period` value.
- Daily notes also contain the correct `date` value.
- Higher-period writing adds interpretation instead of copying source material.
- Tasks remain in their canonical source notes.
- Missing reviews remain neutral.

## Stop condition

The period note contains only the capture, reflection, or direction that is useful at that timescale. Source evidence remains derived from the underlying notes.
