import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const plugins = [
  {
    id: 'viscerium-creator-tools',
    files: [['src/main.js', 'main.js'], ['manifest.json', 'manifest.json'], ['styles.css', 'styles.css']],
  },
  {
    id: 'viscerium-layout-tools',
    files: [['src/main.js', 'main.js'], ['manifest.json', 'manifest.json'], ['styles.css', 'styles.css']],
  },
  {
    id: 'viscerium-unit-cards',
    files: [['src/main.js', 'main.js'], ['manifest.json', 'manifest.json'], ['styles.css', 'styles.css']],
  },
  {
    id: 'viscerium-image-tools',
    files: [['src/main.js', 'main.js'], ['manifest.json', 'manifest.json']],
  },
  {
    id: 'viscerium-journal-tools',
    files: [['src/main.js', 'main.js'], ['manifest.json', 'manifest.json']],
  },
];

const mode = process.argv[2];
if (!['--check', '--write'].includes(mode) || process.argv.length !== 3) {
  console.error('Usage: node Tools/scripts/sync-obsidian-plugins.mjs --check|--write');
  process.exitCode = 2;
} else {
  await syncPlugins(mode === '--write');
}

async function syncPlugins(write) {
  let stale = false;

  for (const plugin of plugins) {
    const sourceRoot = path.join(repoRoot, 'Tools', `obsidian-${plugin.id}`);
    const runtimeRoot = path.join(repoRoot, 'Vault/.obsidian/plugins', plugin.id);
    if (write) await fs.mkdir(runtimeRoot, { recursive: true });

    for (const [sourceName, runtimeName] of plugin.files) {
      const source = path.join(sourceRoot, sourceName);
      const runtime = path.join(runtimeRoot, runtimeName);

      if (write) {
        await fs.copyFile(source, runtime);
        console.log(`Synced ${path.relative(repoRoot, runtime)}`);
        continue;
      }

      try {
        const [sourceBytes, runtimeBytes] = await Promise.all([fs.readFile(source), fs.readFile(runtime)]);
        if (sourceBytes.equals(runtimeBytes)) continue;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      stale = true;
      console.error(`Out of sync: ${path.relative(repoRoot, runtime)}`);
    }
  }

  if (stale) {
    console.error('Run node Tools/scripts/sync-obsidian-plugins.mjs --write and commit the updated Vault runtime files.');
    process.exitCode = 1;
  }
}
