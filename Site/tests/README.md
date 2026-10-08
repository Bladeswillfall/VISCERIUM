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

Pull requests use `.github/scripts/select-checks.mjs` to select affected checks. A changed browser spec runs even if it is outside the fast smoke list. Accessibility spec changes run Axe. CI config and unfamiliar file changes fall back to the full browser and accessibility set.

A weekly scheduled Checks run builds the site and runs every browser spec plus Axe and the enabled contact form fixture. Manual workflow dispatch runs the full check plan. Pushes to `main` build and optionally deploy production, while the `verify` status is required before normal PR merges. The small browser list exists only to make routine PR checks faster, not as an inventory of all browser tests.

## Measuring responsive cache performance

The separate **Responsive cache benchmark** workflow runs when its own files change, or on demand through GitHub Actions after merging. Its cold job generates responsive derivatives without the image cache. Its warm job restores that run's cache through the real GitHub cache service, then builds the same commit on a fresh runner. The workflow reports both build times, restore time, cached entry counts and Atlas cache status. The warm result includes restore overhead, but excludes dependency installation and cache-save time. One pair is an initial measurement, not enough to claim a lasting performance improvement. Each run uploads a JSON measurement artifact for comparing later repeats.
