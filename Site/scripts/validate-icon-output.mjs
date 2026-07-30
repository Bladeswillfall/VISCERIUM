import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const iconPattern = /--icon:\s*url\(['"]?\/icons\/([a-z0-9-]+\.svg)['"]?\)/gi;
let iconCount = 0;

for await (const relativePath of fs.glob('dist/**/*.html')) {
  const html = await fs.readFile(relativePath, 'utf8');
  if (/\[Icon:/i.test(html)) throw new Error(`Raw icon syntax in ${relativePath}`);

  for (const match of html.matchAll(iconPattern)) {
    await fs.access(path.join(root, 'public', 'icons', match[1]));
    iconCount += 1;
  }
}

if (iconCount === 0) throw new Error('No local icons were rendered.');
console.log(`Validated ${iconCount} local icon reference(s).`);
