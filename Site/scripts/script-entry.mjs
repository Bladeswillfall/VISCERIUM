import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function isMainModule(metaUrl) {
  const entry = process.argv[1];
  return Boolean(entry && path.resolve(entry) === path.resolve(fileURLToPath(metaUrl)));
}
