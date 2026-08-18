import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(siteDir, 'dist');

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }

  return files;
}

function bytesFor(files, extension) {
  return files
    .filter((file) => file.endsWith(extension))
    .reduce(async (totalPromise, file) => {
      const total = await totalPromise;
      const stat = await fs.stat(file);
      return total + stat.size;
    }, Promise.resolve(0));
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

let files;
try {
  files = await walk(distDir);
} catch (error) {
  if (error?.code === 'ENOENT') {
    console.error('Performance report requires a production build. Run `npm run build` first.');
    process.exitCode = 1;
  } else {
    throw error;
  }
}

if (files) {
  const [jsBytes, cssBytes, htmlBytes] = await Promise.all([
    bytesFor(files, '.js'),
    bytesFor(files, '.css'),
    bytesFor(files, '.html'),
  ]);

  const largest = await Promise.all(files.map(async (file) => ({
    file: path.relative(distDir, file),
    bytes: (await fs.stat(file)).size,
  })));
  largest.sort((a, b) => b.bytes - a.bytes);

  console.log('VISCERIUM production performance baseline');
  console.log(`  JavaScript: ${formatBytes(jsBytes)}`);
  console.log(`  CSS:        ${formatBytes(cssBytes)}`);
  console.log(`  HTML:       ${formatBytes(htmlBytes)}`);
  console.log('  Largest generated files:');
  for (const item of largest.slice(0, 10)) {
    console.log(`    ${formatBytes(item.bytes).padStart(10)}  ${item.file}`);
  }
  console.log('\nReport-only mode: hard byte budgets will be set after representative baselines are recorded.');
}
