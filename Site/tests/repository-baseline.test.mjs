import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  REQUIRED_REPOSITORY_PATHS,
  findMissingRequiredPaths,
} from "../scripts/check-repository-baseline.mjs";

const siteRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const repositoryRoot = path.resolve(siteRoot, "..");

function writeRequiredBaseline(root) {
  for (const relativePath of REQUIRED_REPOSITORY_PATHS) {
    const absolutePath = path.join(root, relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, "protected\n", "utf8");
  }
}

test("the checked-out repository contains every protected governance file", () => {
  assert.deepEqual(findMissingRequiredPaths(repositoryRoot), []);
});

test("the baseline checker reports a missing protected file", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "viscerium-baseline-"));

  try {
    writeRequiredBaseline(tempRoot);
    assert.deepEqual(findMissingRequiredPaths(tempRoot), []);

    rmSync(path.join(tempRoot, "LICENSE.md"));
    assert.deepEqual(findMissingRequiredPaths(tempRoot), ["LICENSE.md"]);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("CI, package scripts, Git hooks, and Obsidian Git all carry the repository guard", () => {
  const packageJson = JSON.parse(readFileSync(path.join(siteRoot, "package.json"), "utf8"));
  const workflow = readFileSync(path.join(repositoryRoot, ".github/workflows/checks.yml"), "utf8");
  const hook = readFileSync(path.join(repositoryRoot, ".githooks/pre-commit"), "utf8");
  const gitSettings = JSON.parse(
    readFileSync(path.join(repositoryRoot, "Vault/.obsidian/plugins/obsidian-git/data.json"), "utf8"),
  );

  assert.equal(packageJson.scripts["baseline:check"], "node scripts/check-repository-baseline.mjs");
  assert.equal(packageJson.scripts["hooks:install"], "node scripts/install-git-hooks.mjs");
  assert.match(workflow, /npm run baseline:check/u);
  assert.match(hook, /check-repository-baseline\.mjs" --staged/u);
  assert.equal(gitSettings.basePath, "..");
  assert.equal(gitSettings.autoCommitOnlyStaged, true);
});
