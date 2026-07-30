# Repository agent instructions

## Mandatory preflight: read `slop.md`

Before doing any work in this repository, every AI agent **MUST**:

1. Read [`slop.md`](./slop.md) in full. Do not rely on a summary, excerpt, prior memory, or another agent's account of it.
2. Explicitly tell the user that the entire file has been read and understood before beginning the requested work.
3. Apply its rules throughout planning, implementation, review, and testing. For interface and design work, `slop.md` is the governing default whenever the user's explicit instructions do not conflict with it.
4. Before declaring the task complete, reread the entire file and perform a point-by-point audit of the work against it. Fix every issue found and test every affected interface and interactive control.

This preflight applies to **every interaction and every task in the repository**, including tasks that initially appear unrelated to UI or design. It may not be skipped because a task is small, urgent, non-visual, or because the file was read during an earlier session.

The user's specific, unambiguous instruction overrides a conflicting default in `slop.md`. Otherwise, `slop.md` wins.
