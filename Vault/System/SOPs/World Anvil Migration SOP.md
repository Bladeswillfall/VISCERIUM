# World Anvil Migration SOP

> **Use this SOP when:** You integrate, triage, or file articles under `Drafts/WorldAnvil Import`.
>
> **Result:** Mechanical cleanup is automated, while canon decisions remain explicit and reviewable.
>
> **First action:** Open a terminal in `Site` and run the migration integration command.

Follow [[Documentation Writing Standard]] for operational wording.

## Purpose

Reduce repetitive migration work without silently deciding canon, continuity, relationships, or publication.

## Before you start

1. Pull the latest repository changes.
2. Confirm that the exported notes are under `Vault/Drafts/WorldAnvil Import`.
3. Close Obsidian before a bulk write if it is actively changing the same files.
4. Open a terminal in `Site`.

The import folder is local authoring data and is excluded from Git.

> **Why:** GitHub and pull requests can improve the migration tooling, but they cannot inspect or edit the local imported articles themselves.

## Procedure

### 1. Run the mechanical pass

Run:

```bash
npm run migration:worldanvil:integrate:write
```

This command performs only repeatable mechanical work:

- adds baseline import metadata;
- converts legacy article links only when one target is certain;
- derives a working `description` from the first useful prose paragraph when no description exists;
- adds blank `created:` and `updated:` keys when they are absent;
- refreshes note-level migration tasks;
- refreshes the World Anvil Base, migration review note, and generated report.

The command does not decide:

- final canon;
- era or Universal scope;
- continuity identity;
- whether duplicate titles are the same subject;
- whether an existing Codex note should absorb an import;
- semantic relationships;
- image rights or replacement artwork.

> **Why:** These decisions can change meaning. Automating them would reduce work by silently creating bad canon.

### 2. Audit without changing files

Run either command when you need a report only:

```bash
npm run migration:worldanvil:integrate
npm run migration:worldanvil:prepare
```

The second command reports how many imports still lack a generated description or timestamp keys.

### 3. Process the queue

1. Open `World Anvil Import.base`.
2. Start with **Review first**.
3. Complete Tier 1 before expanding Tier 3 or Tier 4 cleanup.
4. Resolve identity conflicts before type, era, links, or artwork.
5. Complete only the first unresolved task shown on the card.
6. Re-run the mechanical pass after a batch of decisions.

Do not insert a full creation template into an imported note.

> **Why:** Full templates contain another frontmatter block and article skeleton. The migration command supplies the safe baseline instead.

### 4. File a resolved import

1. Confirm the title and final `type`.
2. Set `era` or Universal scope with VISCERIUM Creator Tools.
3. Set `entity_id` only when continuity requires it.
4. Confirm that the generated description is accurate. Rewrite it when it is only a useful placeholder.
5. Move the note to its deliberate Drafts or Lore destination.
6. Edit the note once after the move.
7. Confirm that Auto-Properties fills `created`, `updated`, `word_count`, and `open_task_count` as applicable.
8. Keep `status: draft` until publication is deliberate.

The import queue is excluded from Auto-Properties. Timestamp keys are seeded there, but values populate only after the note leaves the import folder and enters a managed authoring folder.

> **Why:** Bulk timestamp updates inside the import queue would record import or checkout dates as if they were historical article dates.

## Check the result

Run:

```bash
npm run doctor:vault
npm run test:unit
npm run build
```

Confirm these conditions:

1. The resolved note has one frontmatter block.
2. `created` and `updated` exist.
3. The description is accurate enough for a card or public summary.
4. No unresolved migration task remains hidden by a move.
5. The note has a deliberate destination and status.

## Stop condition

Stop when the highest-priority imports have no unresolved structural decisions and every newly filed note passes Vault Doctor.

Do not block new article creation on low-priority World Anvil cleanup. Tier 4 imports can remain deferred when they do not obstruct the setting spine, an era anchor, or an active story.
