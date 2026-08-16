import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || `git ${args.join(" ")} failed`);
  }
  return result.stdout.trim();
}

runGit(["rev-parse", "--show-toplevel"]);
runGit(["config", "--local", "core.hooksPath", ".githooks"]);

const configuredPath = runGit(["config", "--local", "--get", "core.hooksPath"]);
if (configuredPath !== ".githooks") {
  throw new Error(`Expected core.hooksPath=.githooks, received ${configuredPath || "<empty>"}`);
}

console.log(`Installed VISCERIUM Git hooks from ${path.join(repositoryRoot, ".githooks")}`);
console.log("Repository baseline protection is active for native Git commits on this clone.");
