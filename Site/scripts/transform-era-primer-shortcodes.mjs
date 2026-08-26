import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { serialiseEraPrimerData, validateEraPrimerData } from '../src/lib/era-primer-data.mjs';
import { isMainModule } from './script-entry.mjs';

const siteRoot = process.cwd();
const docsDir = process.env.VISCERIUM_DOCS_DIR
  ? path.resolve(process.env.VISCERIUM_DOCS_DIR)
  : path.resolve(siteRoot, 'src/content/docs');
const componentPath = path.resolve(siteRoot, 'src/components/era/EraPrimer.astro');

function relativeImport(file, target) {
  let relative = path.relative(path.dirname(file), target).replace(/\\/g, '/');
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return relative;
}

function warning(message) {
  const safe = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<aside className="codex-warning"><strong>Era primer warning:</strong> ${safe}</aside>`;
}

function fenceInfo(line) {
  const match = line.match(/^\s*(`{3,}|~{3,})/);
  if (!match) return null;
  return { marker: match[1][0], length: match[1].length };
}

function isFenceClose(line, fence) {
  const expression = fence.marker === '`' ? /^\s*`{3,}\s*$/ : /^\s*~{3,}\s*$/;
  const match = line.match(expression);
  return Boolean(match && match[0].trim().length >= fence.length);
}

export async function transformEraPrimerShortcodes() {
  const files = (await Array.fromAsync(fs.glob('**/*.{md,mdx}', { cwd: docsDir })))
    .map((file) => path.resolve(docsDir, file))
    .sort();

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    if (!/^\s*\[EraPrimer:[^\]]+\]\s*$/im.test(raw)) continue;

    const parsed = matter(raw);
    const lines = parsed.content.split(/\r?\n/);
    const output = [];
    let used = false;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const openingFence = fenceInfo(line);

      if (openingFence) {
        output.push(line);
        for (index += 1; index < lines.length; index += 1) {
          output.push(lines[index]);
          if (isFenceClose(lines[index], openingFence)) break;
        }
        continue;
      }

      const match = line.match(/^\s*\[EraPrimer:([^\]\s]+)\]\s*$/i);
      if (!match) {
        output.push(line);
        continue;
      }

      const eraId = match[1].trim().toLowerCase();
      const primer = parsed.data.eraPrimer;
      const errors = validateEraPrimerData(primer, eraId);
      if (errors.length > 0) {
        output.push(warning(errors.join(' ')));
        continue;
      }

      used = true;
      output.push(`<EraPrimer primer={${serialiseEraPrimerData(primer)}} />`);
    }

    const generatedData = { ...parsed.data };
    delete generatedData.eraPrimer;

    if (!used) {
      const content = output.join('\n');
      await fs.writeFile(file, matter.stringify(content, generatedData));
      continue;
    }

    const outFile = file.replace(/\.md$/i, '.mdx');
    const importLine = `import EraPrimer from '${relativeImport(outFile, componentPath)}';`;
    const content = `${importLine}\n\n${output.join('\n')}`;
    await fs.writeFile(outFile, matter.stringify(content, generatedData));
    if (outFile !== file) await fs.rm(file, { force: true });
    console.log(`Expanded Vault-owned era primer content in ${path.relative(docsDir, outFile)}`);
  }
}

if (isMainModule(import.meta.url)) await transformEraPrimerShortcodes();
