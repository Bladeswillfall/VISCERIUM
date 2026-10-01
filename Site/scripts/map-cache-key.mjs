import { createHash } from 'node:crypto';
import { loadVaultContent } from './content-manifest.mjs';
import { isMainModule } from './script-entry.mjs';

// Map membership can change without any raster asset changing.
export function mapDefinitionFingerprint(records) {
  const definitions = records
    .filter((record) => record.data?.type === 'map' || record.data?.mapId)
    .map((record) => [record.relativePath, record.raw])
    .sort(([a], [b]) => a.localeCompare(b));
  return createHash('sha256').update(JSON.stringify(definitions)).digest('hex');
}

if (isMainModule(import.meta.url)) {
  const vault = await loadVaultContent();
  console.log(`fingerprint=${mapDefinitionFingerprint(vault.records)}`);
}
