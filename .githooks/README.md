# VISCERIUM Git hooks

These hooks protect repository-level governance files from accidental deletion by local vault-backup commits.

Git does not activate hooks stored in a working tree automatically. Activate them once for each desktop clone:

```bash
cd Site
npm run hooks:install
```

The installer sets the clone-local Git option `core.hooksPath=.githooks`.

The `pre-commit` hook runs the same repository-baseline check used by CI and rejects an ordinary commit when a required governance file is missing or staged for deletion.

This hook is a local first line of defence. CI repeats the baseline check so a commit path that does not execute native Git hooks still cannot merge unnoticed.
