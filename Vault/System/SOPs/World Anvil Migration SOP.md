---
document_type: sop
sop_id: SOP-001
---
# World Anvil Migration SOP

> **Use this SOP when:** You integrate, triage, or file articles under `Drafts/WorldAnvil Import`.
>
> **Result:** Mechanical cleanup is automated, while canon decisions remain explicit and reviewable.
>
> **First action:** Open a terminal in `Site` and run the migration integration command.

Follow [[Documentation Writing Standard]] for operational wording.

## Purpose

Reduce repetitive migration work without silently deciding canon, continuity, relationships, publication, or historical metadata.

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
- derives a working `description` from the first useful prose paragraph when possible;
- excludes generated migration tasks and checklist paragraphs from descriptions;
- adds a blank `updated:` key when it is absent;
- reports descriptions that remain unresolved;
- refreshes note-level migration tasks;
- refreshes the World Anvil Base, migration review note, and generated report.

The command deliberately does not add `created:` to an import.

> **Why:** Auto-Properties derives `created` from the filesystem birth time. For a migrated file, that normally records export, copy, or import time rather than the article's real source creation date.

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

The second command reports:

- descriptions that can be generated;
- descriptions that remain missing or blank because no usable prose exists;
- missing `updated:` keys;
- files without valid frontmatter.

A zero value for **Would change** does not mean every description is resolved. Read **Descriptions still unresolved** as well.

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
4. Confirm that the generated description is accurate. Write one manually when the audit reports it as unresolved.
5. Add `created` only when an authoritative source creation date is known. Otherwise leave it absent.
6. Move the note to its deliberate Drafts or Lore destination.
7. Edit the note once after the move.
8. Confirm that Auto-Properties fills `updated`, `word_count`, and `open_task_count` as applicable.
9. Keep `status: draft` until publication is deliberate.

The import queue is excluded from Auto-Properties. The migration pass seeds `updated:` there so normal editing can maintain it after filing. It does not seed `created:`.

> **Why:** Moving a file preserves its filesystem creation time on common systems. A blank `created:` key would therefore invite Auto-Properties to lock in a false import-time date.

### 5. Normalise filed import filenames

From `Site`, audit the filed Lore corpus with:

```bash
npm run migration:worldanvil:filenames
```

Apply safe renames with:

```bash
npm run migration:worldanvil:filenames:write
```

This removes the World Anvil type prefix and trailing export ID from filed note names, for example `Organization-Drai Dynasty-40e.md` becomes `Drai Dynasty.md`. It preserves `import_source_file` inside the note and updates matching Obsidian wikilinks.

The command compares proposed targets against existing notes using case-insensitive, Unicode-normalised paths. It reports and skips collisions rather than overwriting a note, including collisions such as `FOO.md` against `foo.md` that would be unsafe on Windows or macOS.

## Check the result

Run:

```bash
npm run doctor:vault
npm run test:unit
npm run build
```

Confirm these conditions:

1. The resolved note has one frontmatter block.
2. `updated` exists and reflects maintained authoring activity after filing.
3. `created` is either an authoritative source date or absent.
4. The description is accurate enough for a card or public summary.
5. No unresolved migration task remains hidden by a move.
6. The note has a deliberate destination and status.

## Stop condition

Stop when the highest-priority imports have no unresolved structural decisions and every newly filed note passes Vault Doctor.

Do not block new article creation on low-priority World Anvil cleanup. Tier 4 imports can remain deferred when they do not obstruct the setting spine, an era anchor, or an active story.
