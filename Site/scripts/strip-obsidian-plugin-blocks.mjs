import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';

const docsDir = process.env.VISCERIUM_DOCS_DIR
  ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
  : path.resolve(process.cwd(), 'src/content/docs');

const obsidianOnlySection = /<!--\s*obsidian-only:start\s*-->[\s\S]*?<!--\s*obsidian-only:end\s*-->\s*/gi;
const obsidianOnlyFence = /```zoommap\s*[\s\S]*?```\s*/gi;

const files = (await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: docsDir })))
  .map((file) => path.resolve(docsDir, file));

let changed = 0;
for (const file of files) {
  const raw = await fs.readFile(file, 'utf8');
  const stripped = raw
    .replace(obsidianOnlySection, '')
    .replace(obsidianOnlyFence, '');
  if (stripped === raw) continue;
  await fs.writeFile(file, stripped, 'utf8');
  changed += 1;
}

if (changed > 0) console.log(`Stripped Obsidian-only plugin content from ${changed} published note(s).`);
