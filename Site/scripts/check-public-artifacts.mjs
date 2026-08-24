import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distRoot = fileURLToPath(new URL('../dist/', import.meta.url));
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.mjs', '.svg', '.txt', '.xml']);
const maxScannableTextBytes = 8 * 1024 * 1024;
const forbiddenNames = [
  /(?:^|\/)\.env(?:\.|$)/i,
  /(?:^|\/)\.dev\.vars(?:\.|$)/i,
  /\.map$/i,
  /\.(?:key|pem|p12|pfx)$/i,
];
const forbiddenText = [
  { pattern: /[#@]\s*sourceMappingURL\s*=/i, label: 'source-map reference' },
  { pattern: /\/home\/runner\/work\//, label: 'CI filesystem path' },
  { pattern: /\/Users\/[A-Za-z0-9._-]+\//, label: 'developer filesystem path' },
  { pattern: /[A-Za-z]:\\Users\\[^\\]+\\/i, label: 'developer filesystem path' },
];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

let files;
try {
  files = await walk(distRoot);
} catch (error) {
  if (error?.code === 'ENOENT') {
    console.error('Public artifact check requires Site/dist. Run it after the production build.');
    process.exit(1);
  }
  throw error;
}

const failures = [];
for (const absolute of files) {
  const relative = path.relative(distRoot, absolute).split(path.sep).join('/');
  for (const pattern of forbiddenNames) {
    if (pattern.test(relative)) failures.push(`${relative}: forbidden public artifact`);
  }

  if (!textExtensions.has(path.extname(relative).toLowerCase())) continue;
  const stat = await fs.stat(absolute);
  if (stat.size > maxScannableTextBytes) {
    failures.push(`${relative}: text artifact exceeds the 8 MiB security inspection limit`);
    continue;
  }

  const source = await fs.readFile(absolute, 'utf8');
  for (const { pattern, label } of forbiddenText) {
    if (pattern.test(source)) failures.push(`${relative}: contains ${label}`);
  }
}

if (failures.length > 0) {
  console.error('Public build artifact security check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Public artifact security check passed (${files.length} files inspected).`);
