# Daily Journal Workflow

> **Use this workflow when:** You want a private dated note for ideas, references, goals, planned posts, challenges, or a readable record of vault work.
>
> **Result:** The day's creator memory lives in one private note, and file activity can be sealed into it once the session is ending.
>
> **First action:** Open [[System/Chronicle|Chronicle]], run **Open today's daily note**, or run **VISCERIUM Journal Tools: Seal Today's Activity**.

Daily notes are dated capture surfaces, not mandatory attendance records. Create one only when the date needs a note.

Daily notes are the atomic source layer for [[016 - Chronicle Workflow SOP|Chronicle]]. Higher-period notes derive evidence from them and store only new reflection.

## Storage and privacy

Daily notes are created beneath:

```text
Private/Journal/Daily/<YEAR>/<YYYY-MM-DD>.md
```

`Private/` is ignored by Git. Do not move personal journal material into `Lore/` merely to make it visible to repository tools.

The template remains under `Templates/Journal/Daily Note.md` so the structure is shared without publishing personal entries.

## Capture during the day

Use the daily note for:

- up to three deliberate tasks under **Today's Focus**;
- undeveloped thoughts under **Ideas**;
- links and source observations under **References**;
- general process memory under **Notes**;
- future events, dates, or context under **Upcoming**; and
- important decisions, milestones, breakthroughs, reversals, or other changes under **Decisions, Milestones & Developments**.

**Today's Focus** is a working shortlist. It is not the project backlog.

**Upcoming** is temporal context. If an item is an action, keep the checkbox in the note where its context belongs and add a scheduled or due date when useful.

Plain bullets are observations. Markdown checkboxes are deliberate future actions and will appear in [[System/Creator Tasks|Creator Tasks]]. Do not turn every idea into a task.

## Seal vault activity

Daily Activity records file creation, modification, deletion, and rename/move events in the background. Repeated edits are batched after a short period of inactivity.

Near the end of the work session:

1. Run **VISCERIUM Journal Tools: Seal Today's Activity** from the Command Palette, or assign that command a local hotkey.
2. The command opens or creates today's daily note.
3. It places the cursor beneath **Vault Activity**.
4. It runs Daily Activity's **Today's Timeline** command.
5. It refuses to add a second timeline while the first one remains in the activity section.

The command changes the private daily note. It does not change Lore, publish material, or commit anything to Git.

> [!warning] Snapshot, not live feed
> Seal once when wrapping up. The journal stores a readable snapshot while Daily Activity remains the live local event record.

Chronicle can derive higher-period activity evidence from these sealed snapshots. The derived activity views describe tracked vault work only. They do not measure work completed outside the vault.

## Tracked and excluded paths

The shared Daily Activity settings track ordinary creator files, including `Lore/`, `Drafts/`, `Stories/`, and `System/`.

They exclude:

- `Private/Journal/`, preventing the generated log from logging itself;
- `Templates/`;
- `Assets/`;
- `.obsidian/`; and
- `.trash/`.

Activity data is device-local until it is sealed into a daily note. The private journal itself is not stored in the public Git repository.

## Hotkey

The repository does not impose a shared key combination.

To assign one:

1. Open **Settings → Hotkeys**.
2. Search for **Seal Today's Activity**.
3. Add a binding that does not conflict with an existing command.

## Stop condition

Today's journal contains the notes you chose to keep, and the activity timeline has been sealed no more than once for the day.
