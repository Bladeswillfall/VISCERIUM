import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { walk } from './lib/walk.mjs';

export const STORYTELLER_START = '<!-- viscerium:storyteller:start -->';
export const STORYTELLER_END = '<!-- viscerium:storyteller:end -->';

// Use block elements so both boundaries become direct children of the article content.
// This avoids extra paragraph wrappers around the markers.
const START_BOUNDARY = '<div data-codex-storyteller-boundary="start" hidden></div>';
const END_BOUNDARY = '<div data-codex-storyteller-boundary="end" hidden></div>';

function occurrences(content, marker) {
  return content.split(marker).length - 1;
}

export function transformStorytellerMarkers(content, label = 'document') {
  const startCount = occurrences(content, STORYTELLER_START);
  const endCount = occurrences(content, STORYTELLER_END);

  if (startCount === 0 && endCount === 0) return content;
  if (startCount !== 1 || endCount !== 1) {
    throw new Error(`${label} must contain exactly one Storyteller start marker and one end marker.`);
  }

  const startIndex = content.indexOf(STORYTELLER_START);
  const endIndex = content.indexOf(STORYTELLER_END);
  if (endIndex < startIndex) {
    throw new Error(`${label} places the Storyteller end marker before the start marker.`);
  }

  return content
    .replace(STORYTELLER_START, START_BOUNDARY)
    .replace(STORYTELLER_END, END_BOUNDARY);
}

export async function prepareStorytellerMarkers({ root = path.resolve(process.cwd(), 'src/content/docs') } = {}) {
  const files = (await walk(root)).filter((file) => /\.(md|mdx)$/i.test(file));
  let prepared = 0;

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const next = transformStorytellerMarkers(raw, path.relative(root, file));
    if (next === raw) continue;
    await fs.writeFile(file, next, 'utf8');
    prepared += 1;
  }

  console.log(`Prepared Storyteller markers for ${prepared} public document${prepared === 1 ? '' : 's'}.`);
  return prepared;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  prepareStorytellerMarkers().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
