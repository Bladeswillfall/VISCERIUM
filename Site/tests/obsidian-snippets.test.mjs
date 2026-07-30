import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const snippetsDir = path.join(repoRoot, "Vault", ".obsidian", "snippets");
const appearancePath = path.join(repoRoot, "Vault", ".obsidian", "appearance.json");

test("enabled Obsidian CSS snippets exist as files", () => {
  const appearance = JSON.parse(fs.readFileSync(appearancePath, "utf8"));
  const enabled = appearance.enabledCssSnippets ?? [];

  assert.ok(enabled.length > 0, "appearance.json should enable at least one snippet");

  for (const snippet of enabled) {
    const snippetPath = path.join(snippetsDir, `${snippet}.css`);
    assert.ok(fs.existsSync(snippetPath), `Missing enabled CSS snippet: ${snippet}.css`);
    assert.ok(fs.statSync(snippetPath).size > 0, `CSS snippet is empty: ${snippet}.css`);
  }
});

test("snippet filenames stay plain and modular", () => {
  const names = fs.readdirSync(snippetsDir).filter((name) => name.endsWith(".css"));

  for (const name of names) {
    assert.equal(
      /viscerium-codex/i.test(name),
      false,
      `Snippet filename should describe behaviour, not the project: ${name}`
    );
  }
});
