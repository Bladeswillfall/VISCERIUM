import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const snippetsDir = path.join(repoRoot, "Vault", ".obsidian", "snippets");
const appearancePath = path.join(repoRoot, "Vault", ".obsidian", "appearance.json");
const setupPath = path.join(repoRoot, "Vault", "System", "Obsidian Setup.md");
const snippetsGuidePath = path.join(repoRoot, "Vault", "System", "Obsidian CSS Snippets.md");

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

test("ordinary Obsidian articles use a responsive wide lane in both Markdown modes", () => {
  const appearance = JSON.parse(fs.readFileSync(appearancePath, "utf8"));
  const css = fs.readFileSync(path.join(snippetsDir, "Article widths.css"), "utf8");

  assert.ok(appearance.enabledCssSnippets.includes("Article widths"));
  assert.match(css, /--vc-article-max-width:\s*82rem/);
  assert.match(css, /--vc-article-gutter:\s*clamp\(1rem,\s*3%,\s*2\.75rem\)/);
  assert.match(css, /markdown-preview-view:not\(\.viscerium-home\) \.markdown-preview-sizer/);
  assert.match(css, /markdown-source-view\.mod-cm6:not\(\.viscerium-home\) \.cm-sizer/);
  assert.match(css, /max-width:\s*min\(100%,\s*var\(--vc-article-max-width\)\)\s*!important/);
  assert.match(css, /\.cm-contentContainer/);
  assert.match(css, /\.cm-line/);
  assert.doesNotMatch(css, /100vw/);
});

test("Live Preview uses the same editorial chrome as Reading View", () => {
  const compactProperties = fs.readFileSync(path.join(snippetsDir, "Compact properties.css"), "utf8");
  const autohideProperties = fs.readFileSync(path.join(snippetsDir, "Autohide properties.css"), "utf8");
  const callouts = fs.readFileSync(path.join(snippetsDir, "Callout styling.css"), "utf8");
  const spacing = fs.readFileSync(path.join(snippetsDir, "Paragraph spacing.css"), "utf8");

  assert.match(compactProperties, /markdown-source-view\.mod-cm6[^\n]*metadata-container/);
  assert.doesNotMatch(autohideProperties, /Properties · hover to expand/);
  assert.match(autohideProperties, /max-height:\s*2\.45rem/);
  assert.match(callouts, /markdown-source-view\.mod-cm6[^\n]*callout\[data-callout="authoring"\]/);
  assert.match(spacing, /markdown-source-view\.mod-cm6:not\(\.viscerium-home\) \.cm-content/);
  assert.match(spacing, /line-height:\s*1\.68/);
});

test("H2 hierarchy avoids virtualized counters and decorative hairlines", () => {
  const css = fs.readFileSync(path.join(snippetsDir, "Heading hierarchy.css"), "utf8");

  assert.match(css, /markdown-rendered:not\(\.viscerium-home\) h2::before/);
  assert.doesNotMatch(css, /HyperMD-header-2::before/);
  assert.doesNotMatch(css, /HyperMD-header-2[^}]*counter-increment/s);
  assert.doesNotMatch(css, /h2::after/);
});

test("article width documentation names the snippet owner and Home exception", () => {
  const setup = fs.readFileSync(setupPath, "utf8");
  const snippetsGuide = fs.readFileSync(snippetsGuidePath, "utf8");

  for (const document of [setup, snippetsGuide]) {
    assert.match(document, /Article widths\.css/);
    assert.match(document, /Home dashboard\.css/);
    assert.doesNotMatch(document, /Ordinary note width belongs to the active Obsidian theme/);
  }

  assert.match(snippetsGuide, /Do not add competing global `markdown-preview-sizer`/);
});
