# Repository Backup Safety

VISCERIUM uses one Git repository for the public Codex, repository tooling and the Obsidian creator vault. Obsidian should open only `Vault/`, but the checked-in Obsidian Git profile deliberately uses `basePath: ".."`, so Git operations can see the repository root.

That arrangement is useful, but it means a local clone that is missing a tracked root file can make an ordinary vault backup look like an intentional repository deletion.

## Protected repository baseline

The following governance/compliance files are required:

- `ATTRIBUTION.md`
- `LICENSE.md`
- `LICENSE-CODE.md`
- `THIRD_PARTY_NOTICES.md`
- `LICENSES/MPL-2.0.txt`
- `LICENSES/MySnippets-NOTICE.md`

`Site/scripts/check-repository-baseline.mjs` fails when one of these files is absent. In pre-commit mode it also fails when one is staged for deletion.

## One-time setup for each desktop clone

After cloning the repository, or after pulling the change that introduced this protection, run:

```bash
cd Site
npm run hooks:install
```

This sets the clone-local Git configuration:

```text
core.hooksPath=.githooks
```

Git intentionally does not allow a repository to activate a working-tree hook merely by being pulled, so this one local setup step is required.

## Obsidian Git safety

The shared Obsidian Git profile keeps the repository root as its base path, but enables **auto commit only staged files**. Automatic backup must therefore operate on files that were deliberately staged rather than sweeping every unrelated working-tree difference into a backup commit.

For manual commits, review Obsidian Git's Source Control view before committing. Prefer staging the intended Vault changes instead of using an indiscriminate **Commit all changes** action.

The native Git pre-commit hook is the local hard stop when the commit path executes Git hooks. GitHub CI repeats `npm run baseline:check`, so the protected files are also enforced server-side before merge.

## If the guard fails

For an accidental local deletion, restore the protected files from the current commit:

```bash
git restore --source=HEAD -- ATTRIBUTION.md LICENSE.md LICENSE-CODE.md THIRD_PARTY_NOTICES.md LICENSES/MPL-2.0.txt LICENSES/MySnippets-NOTICE.md
```

Then review `git status --short` before committing again.

Do not weaken or bypass this protection for an ordinary vault backup. A deliberate change to repository licensing or attribution should be made in a focused branch/PR and reviewed as a governance change.
