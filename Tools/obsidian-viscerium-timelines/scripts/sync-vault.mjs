import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, '..');
const distDir = path.join(pluginRoot, 'dist');
const vaultPluginDir = path.resolve(
  pluginRoot,
  '../../Vault/.obsidian/plugins/viscerium-timelines',
);

const payloadFiles = ['main.js', 'styles.css', 'manifest.json'];

await fs.mkdir(vaultPluginDir, { recursive: true });

for (const fileName of payloadFiles) {
  const source = path.join(distDir, fileName);
  const target = path.join(vaultPluginDir, fileName);

  try {
    await fs.access(source);
  } catch {
    throw new Error(
      `Missing ${path.relative(pluginRoot, source)}. Run \"npm run build\" before syncing the Vault plugin payload.`,
    );
  }

  await fs.copyFile(source, target);
  console.log(`Synced ${path.relative(pluginRoot, target)}`);
}
