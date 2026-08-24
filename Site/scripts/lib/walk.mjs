import fs from 'node:fs/promises';
import path from 'node:path';

export async function walk(dir) {
  try {
    return (await Array.fromAsync(fs.glob('**/*', { cwd: dir, withFileTypes: true })))
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(entry.parentPath, entry.name));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}
