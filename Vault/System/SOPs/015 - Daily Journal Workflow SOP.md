# Daily Journal Workflow

> **Use this workflow when:** You want a private dated note for ideas, references, goals, planned posts, challenges, or a readable record of vault work.
>
> **Result:** The day's creator memory lives in one private note, and file activity can be sealed into it once the session is ending.
>
> **First action:** Run **Open today's daily note** or **VISCERIUM Journal Tools: Seal Today's Activity**.

Daily notes are dated capture surfaces, not mandatory attendance records. Create one only when the date needs a note.

## Storage and privacy

Daily notes are created beneath:

```text
Private/Journal/Daily/<YEAR>/<YYYY-MM-DD>.md
```

`Private/` is ignored by Git. Do not move personal journal material into `Lore/` merely to make it visible to repository tools.

The template remains under `Templates/Journal/Daily Note.md` so the structure is shared without publishing personal entries.

## Capture during the day

Use the daily note for:

- up to three deliberate tasks under **Today**;
- undeveloped thoughts under **Ideas**;
- links and source observations under **References**;
- general process memory under **Notes**; and
- future posts, events, challenges, or deadlines under **Planned**.

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
