import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const AUTHORING_START = '<!-- viscerium:authoring:start -->';
export const AUTHORING_END = '<!-- viscerium:authoring:end -->';

const obsidianOnlySection = /<!--\s*obsidian-only:start\s*-->[\s\S]*?<!--\s*obsidian-only:end\s*-->\s*/gi;
const obsidianOnlyFence = /```zoommap\s*[\s\S]*?```\s*/gi;

function occurrences(content, marker) {
  return content.split(marker).length - 1;
}

export function stripObsidianOnlyContent(content, label = 'document') {
  const startCount = occurrences(content, AUTHORING_START);
  const endCount = occurrences(content, AUTHORING_END);
  let stripped = content;

  if (startCount !== 0 || endCount !== 0) {
    if (startCount !== 1 || endCount !== 1) {
      throw new Error(`${label} must contain exactly one authoring start marker and one end marker when creator guidance is present.`);
    }

    const startIndex = content.indexOf(AUTHORING_START);
    const endIndex = content.indexOf(AUTHORING_END);
    if (endIndex < startIndex) {
      throw new Error(`${label} places the authoring end marker before the start marker.`);
    }

    stripped = `${content.slice(0, startIndex)}${content.slice(endIndex + AUTHORING_END.length)}`;
  }

  return stripped
    .replace(obsidianOnlySection, '')
    .replace(obsidianOnlyFence, '');
}

export async function stripObsidianPluginBlocks({
  root = process.env.VISCERIUM_DOCS_DIR
    ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
    : path.resolve(process.cwd(), 'src/content/docs'),
} = {}) {
  const files = (await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: root })))
    .map((file) => path.resolve(root, file));

  let changed = 0;
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const stripped = stripObsidianOnlyContent(raw, path.relative(root, file));
    if (stripped === raw) continue;
    await fs.writeFile(file, stripped, 'utf8');
    changed += 1;
  }

  if (changed > 0) console.log(`Stripped Obsidian-only creator content from ${changed} published note(s).`);
  return changed;
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  stripObsidianPluginBlocks().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
