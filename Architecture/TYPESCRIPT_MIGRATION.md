# TypeScript migration plan

This plan covers the first-party VISCERIUM repository, starting with `Site/`. TypeScript must improve correctness without changing published output, authoring workflows, or browser fallbacks.

## Baseline

Inventory of `main` on 15 October 2026:

- 332 tracked `.js` and `.mjs` files and 18 TypeScript files across the repository.
- The website contains 104 non-test JavaScript files: 51 under `Site/src/`, 48 under `Site/scripts/`, two under `Site/functions/`, and three top-level configuration modules.
- Another 178 JavaScript files belong to the website test suite. Keep those as JavaScript initially.
- `Site/` already depends on TypeScript 6 and Astro's strict TypeScript configuration.
- The Obsidian timeline plugin already uses a TypeScript entry point, but imports shared website `.mjs` modules. The other four Obsidian plugins copy JavaScript sources to the Vault.

These are file counts, not a claim that each file can be renamed independently.

## Rules for each migration pull request

1. Identify every import, script entry point, test, and generated/runtime consumer of a target module.
2. Preserve exported names and runtime behaviour. Keep `.js` payloads when a consumer requires them.
3. Add explicit types at data boundaries. Avoid `any` to silence errors, new build dependencies, and unrelated refactors.
4. Run TypeScript checking, relevant Node unit tests, the production Astro build, and browser tests when an interaction changes.
5. Verify the changed output, not just successful compilation. Preserve `Site/PROGRESSIVE_ENHANCEMENT.md` fallbacks.
6. Stop if a module requires a broader build change. Put that work in a separate PR.

## Sequence

| Stage | Scope | Exit condition |
| --- | --- | --- |
| 0. Checks | Run existing `check:astro` in CI; keep complexity checks covering converted TypeScript using the installed TypeScript compiler | Type check and complexity check pass |
| 1. Pilot | Convert `frontmatter-date.mjs` and `feed-dates.mjs` to TypeScript; update direct consumers and tests | Unit tests, type check and build pass without a behaviour change |
| 2. Website helpers | Convert small, isolated `Site/src/lib` and data modules in dependency order | No unresolved imports; appropriate unit tests pass |
| 3. Calendar and timelines | Migrate shared calendar/timeline implementations together; retain compatible outputs for Astro, content generation and the Obsidian timeline bundle | Calendar/timeline tests and Obsidian bundle checks pass |
| 4. Browser and APIs | Convert browser controllers and Cloudflare Pages Functions by feature | Browser, accessibility, API and non-JavaScript fallback tests pass |
| 5. Node scripts and services | Migrate Node entry points in coherent groups after checking Node 24 execution and import paths | Publishing and service test commands still work |
| 6. Obsidian | Type the four JavaScript plugin sources only with a tested build-and-sync path; leave distributed `main.js` and Templater/view scripts in JavaScript as required | Sync checks and Obsidian plugin checks pass |

## Current pilot

This PR begins stages 0 and 1. It deliberately leaves tests, timeline internals, content transforms, Cloudflare Functions, plugin bundles, and generated assets unchanged. Direct Node consumers run on the repository's declared Node 24 runtime, which can execute erasable TypeScript; Astro handles its website imports.

TypeScript checking and transpiled complexity checks are separate. Transpiling a `.ts` file for ESLint does **not** replace TypeScript's type checker.

## Before merging

- `cd Site && npm run check:astro`
- `cd Site && npm run baseline:check`
- `cd Site && npm run test:unit`
- `cd Site && npm run build`
- Review CI results, including generated content, browser checks triggered by the affected-file selector, and the repository's changelog policy.
- If existing type errors emerge, document and resolve them before making the new check mandatory on the default branch.

No bulk rename, framework change, or plugin bundle rewrite is part of this pilot.
