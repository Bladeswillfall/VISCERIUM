import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const iconPattern = /--icon:\s*url\(['"]?\/icons\/([a-z0-9-]+\.svg)['"]?\)/gi;
const brandIcons = new Set([
  'bluesky.svg',
  'discord.svg',
  'github.svg',
  'instagram.svg',
  'kofi.svg',
  'mastodon.svg',
  'patreon.svg',
  'twitter-x.svg',
]);
let iconCount = 0;
let sharpSolidCount = 0;

for await (const relativePath of fs.glob('public/icons/*.svg')) {
  const filename = path.basename(relativePath);
  if (brandIcons.has(filename)) continue;

  const svg = await fs.readFile(relativePath, 'utf8');
  if (/\bstroke(?:=|-)/i.test(svg) || /\bfill=['"]none['"]/i.test(svg)) {
    throw new Error(`Local icon must be sharp solid, not stroked or outlined: ${relativePath}`);
  }
  sharpSolidCount += 1;
}

for await (const relativePath of fs.glob('dist/**/*.html')) {
  const html = await fs.readFile(relativePath, 'utf8');
  if (/\[Icon:/i.test(html)) throw new Error(`Raw icon syntax in ${relativePath}`);

  for (const match of html.matchAll(iconPattern)) {
    await fs.access(path.join(root, 'public', 'icons', match[1]));
    iconCount += 1;
  }
}

if (sharpSolidCount === 0) throw new Error('No sharp solid local icons were found.');
if (iconCount === 0) throw new Error('No local icons were rendered.');
console.log(`Validated ${sharpSolidCount} sharp solid local icon(s) and ${iconCount} rendered reference(s).`);
