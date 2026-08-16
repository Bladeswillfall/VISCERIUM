import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const REQUIRED_REPOSITORY_PATHS = Object.freeze([
  "ATTRIBUTION.md",
  "LICENSE.md",
  "LICENSE-CODE.md",
  "THIRD_PARTY_NOTICES.md",
  "LICENSES/MPL-2.0.txt",
  "LICENSES/MySnippets-NOTICE.md",
]);

export const REPOSITORY_ROOT = fileURLToPath(new URL("../../", import.meta.url));

export function findMissingRequiredPaths(repositoryRoot = REPOSITORY_ROOT) {
  return REQUIRED_REPOSITORY_PATHS.filter((relativePath) =>
    !existsSync(path.join(repositoryRoot, relativePath))
  );
}

export function findStagedRequiredDeletions(repositoryRoot = REPOSITORY_ROOT) {
  const result = spawnSync(
    "git",
    [
      "diff",
      "--cached",
      "--name-only",
      "--diff-filter=D",
      "--",
      ...REQUIRED_REPOSITORY_PATHS,
    ],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      windowsHide: true,
    },
  );

  if (result.error?.code === "ENOENT") {
    return [];
  }

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `git diff --cached failed with status ${result.status}: ${result.stderr?.trim() || "unknown error"}`,
    );
  }

  return result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function checkRepositoryBaseline({
  repositoryRoot = REPOSITORY_ROOT,
  checkStaged = false,
} = {}) {
  const missing = findMissingRequiredPaths(repositoryRoot);
  const stagedDeletions = checkStaged
    ? findStagedRequiredDeletions(repositoryRoot)
    : [];

  return {
    missing,
    stagedDeletions,
    ok: missing.length === 0 && stagedDeletions.length === 0,
  };
}

function printFailure({ missing, stagedDeletions }) {
  console.error("Repository baseline check failed.\n");

  if (missing.length > 0) {
    console.error("Required governance files are missing from the working tree:");
    for (const relativePath of missing) {
      console.error(`  - ${relativePath}`);
    }
    console.error("");
  }

  if (stagedDeletions.length > 0) {
    console.error("Required governance files are staged for deletion:");
    for (const relativePath of stagedDeletions) {
      console.error(`  - ${relativePath}`);
    }
    console.error("");
  }

  console.error(
    "If these deletions are accidental, restore them from the current commit before backing up:",
  );
  console.error(
    `  git restore --source=HEAD -- ${REQUIRED_REPOSITORY_PATHS.map((value) => `\"${value}\"`).join(" ")}`,
  );
  console.error("");
  console.error(
    "Do not bypass this check for an ordinary vault backup. Governance-file removals require a deliberate repository change.",
  );
}

function isMainModule() {
  if (!process.argv[1]) return false;
  return path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  const checkStaged = process.argv.includes("--staged");
  const result = checkRepositoryBaseline({ checkStaged });

  if (!result.ok) {
    printFailure(result);
    process.exitCode = 1;
  } else {
    console.log("Repository baseline check passed.");
  }
}
