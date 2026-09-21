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
