import path from 'node:path';
import process from 'node:process';
import { loadGeneratedDocs } from './content-manifest.mjs';
import { isMainModule } from './script-entry.mjs';

const required = ['title', 'description', 'slug', 'type'];

export function validateGeneratedContent(manifest) {
  let failed = false;
  for (const { file, data } of manifest.records) {
    for (const field of required) {
      if (!data[field]) {
        console.error(`Missing ${field}: ${path.relative(manifest.rootDir, file)}`);
        failed = true;
      }
    }
  }
  if (!failed) console.log(`Validated ${manifest.records.length} generated public docs.`);
  return !failed;
}

if (isMainModule(import.meta.url)) {
  const valid = validateGeneratedContent(await loadGeneratedDocs());
  if (!valid) process.exitCode = 1;
}
