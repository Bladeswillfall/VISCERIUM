import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const changelogPath = 'Site/CHANGELOG.md';
const dependencyFile = /^(?:Site|Services\/comment-gateway|Tools\/obsidian-viscerium-timelines)\/(?:package(?:-lock)?\.json|Dockerfile)$|^\.github\/workflows\/[^/]+\.ya?ml$/;

function sections(markdown) {
  const found = new Map();
  let current;
  let category = false;

  for (const line of markdown.split(/\r?\n/)) {
    const version = line.match(/^## \[([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?\s*$/);
    if (line.startsWith('## ')) {
      current = version ? { name: version[1], dated: Boolean(version[2]), entries: new Set() } : undefined;
      if (current) found.set(current.name, current);
      category = false;
    } else if (line.startsWith('### ')) {
      category = /^### (?:Added|Changed|Deprecated|Removed|Fixed|Security)(?:\s|$)/.test(line);
    } else if (current && category && /^\s*-\s+\S/.test(line)) {
      current.entries.add(line.trim());
    }
  }
  return found;
}

function skipReason(body) {
  let inChangelog = false;
  for (const line of body.split(/\r?\n/)) {
    if (line.startsWith('## ')) inChangelog = line.trim() === '## Changelog';
    if (!inChangelog) continue;
    const match = line.match(/^- \[[xX]\] No entry needed: (.+)$/);
    const reason = match?.[1].trim() ?? '';
    if (reason.length >= 15 && !/^(?:\(|<|replace\b)/i.test(reason)) return true;
  }
  return false;
}

export function validate({ before, after, changedFiles, author, body }) {
  if (author === 'dependabot[bot]' && changedFiles.length > 0 && changedFiles.every((file) => dependencyFile.test(file))) {
    return null;
  }

  const oldSections = sections(before);
  const newSections = sections(after);
  const oldDraft = oldSections.get('Unreleased')?.entries ?? new Set();
  const newDraft = newSections.get('Unreleased')?.entries ?? new Set();
  const newDraftEntry = [...oldDraft].every((entry) => newDraft.has(entry))
    && [...newDraft].some((entry) => !oldDraft.has(entry));
  const newRelease = [...newSections].some(([name, section]) =>
    name !== 'Unreleased' && section.dated && !oldSections.has(name) && section.entries.size > 0,
  );

  if (newDraftEntry || newRelease || skipReason(body)) return null;
  return 'Add a new entry under Unreleased in Site/CHANGELOG.md (or publish a new dated version). '
    + 'If no public release note is needed, check "No entry needed" under "## Changelog" in the PR and provide a specific reason.';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const before = execFileSync('git', ['show', 'HEAD^1:' + changelogPath], { encoding: 'utf8' });
  const after = readFileSync(changelogPath, 'utf8');
  const changedFiles = execFileSync('git', ['diff', '--name-only', 'HEAD^1', 'HEAD'], { encoding: 'utf8' })
    .trim().split(/\r?\n/).filter(Boolean);
  const error = validate({
    before,
    after,
    changedFiles,
    author: process.env.PR_AUTHOR ?? '',
    body: process.env.PR_BODY ?? '',
  });
  if (error) {
    console.error('::error::' + error);
    process.exitCode = 1;
  } else {
    console.log('Changelog requirement satisfied.');
  }
}
