# Site tests

This directory owns repository-level tests for the public site, content pipeline, creator contracts, and cross-component integration.

## Test layout

- Root `*.test.mjs` files are Node unit, contract, and regression tests. `npm run test:unit` runs them.
- `browser/` contains Playwright browser tests.
- `accessibility/` contains Axe browser checks.
- `*.postbuild.mjs` files validate generated output after a production build when a package script calls them explicitly.
- A packaged service can own its tests inside that service. `Services/comment-gateway/tests/` is the current example.

Keep one file per coherent test concern. Do not create one file for every individual assertion.

## Explain what a test file protects

Use a descriptive filename and descriptive `test()` names first. Add a short file header only when the purpose, fixtures, or cross-component dependency is not obvious from those names.

Do not create a Markdown sidecar for every test file. Separate sidecars duplicate information and can drift away from the tests they describe.

## Adding subdirectories

Create a subdirectory when a test family has a separate runner or has enough files to improve navigation. Update the runner at the same time. The current `test:unit` command intentionally runs root `tests/*.test.mjs`, so moving an existing unit test into a subdirectory without changing that command will silently stop running it.

## CI selection

Pull requests use `.github/scripts/select-checks.mjs` to choose affected CI jobs. Changes to a single unit-test file run the unit suite; browser or accessibility test changes run the relevant suite and its required build. Site or Vault content and source changes run all site checks. Comment gateway and timeline plugin edits use their dedicated jobs. Changes to the CI configuration, unfamiliar paths, or an unreadable diff trigger the full suite. Pushes to `main` always run everything. The repository policy job always runs, and the final verification job requires selected jobs to succeed and skipped jobs to be intentionally excluded.

This selects test **jobs**, not individual unit assertions. The full site test set remains the default when a change could affect more than one area.

## Measuring responsive cache performance

The separate **Responsive cache benchmark** workflow runs when its own files change, or on demand through GitHub Actions after merging. Its cold job generates responsive derivatives without the image cache. Its warm job restores that run's cache through the real GitHub cache service, then builds the same commit on a fresh runner. The workflow reports both build times, restore time, cached entry counts and Atlas cache status. The warm result includes restore overhead, but excludes dependency installation and cache-save time. One pair is an initial measurement, not enough to claim a lasting performance improvement.
