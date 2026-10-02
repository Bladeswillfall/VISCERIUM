import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const vault = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../Vault');
const article = readFileSync(path.join(vault, 'Lore/Myrkildicary/Myrkild.md'), 'utf8');
const strains = ['Gluttony', 'Envy', 'Sloth', 'Wrath', 'Lust', 'Pride', 'Greed'];

test('each Myrkild strain has exactly one accessible wrapped cell illustration', () => {
  const start = article.indexOf('## The metamorphosis of biomaterial');
  const end = article.indexOf('## A deal between kingdoms', start);
  assert.ok(start >= 0 && end > start, 'strain section boundaries must exist');
  const content = article.slice(start, end);
  const embeds = content.match(/!\[\[myrkild-[a-z]+-cell\.webp\|right\|220\|gap=16\|alt=[^\]]+\]\]/g) ?? [];
  assert.equal(embeds.length, strains.length);

  for (const strain of strains) {
    const head = '> ### ' + strain + '\n>\n';
    const fragments = content.split(head);
    assert.equal(fragments.length, 2, strain + ' subsection must be unique');
    const first = fragments[1].split('\n')[0];
    assert.ok(first.startsWith('> ![[myrkild-' + strain.toLowerCase() +
      '-cell.webp|right|220|gap=16|alt=Illustration of a ' + strain + ' Myrkild cell'),
      strain + ' image must precede subsection prose');
  }
});

test('the seven cells are valid WebP with linked attribution records', () => {
  for (const strain of strains) {
    const filename = 'myrkild-' + strain.toLowerCase() + '-cell.webp';
    const image = readFileSync(path.join(vault, 'Assets/Images', filename));
    assert.ok(image.length > 5000, filename + ' is unexpectedly small');
    assert.equal(image.toString('ascii', 0, 4), 'RIFF');
    assert.equal(image.toString('ascii', 8, 12), 'WEBP');
    assert.equal(image.readUInt32LE(4) + 8, image.length);

    const adjacent = readFileSync(path.join(vault, 'Assets/Images', filename + '.attribution.md'), 'utf8');
    const sidecar = readFileSync(path.join(vault, 'Lore/Myrkildicary/Images', strain + ' - Myrkild cell.md'), 'utf8');
    assert.ok(adjacent.includes('Lore/Myrkildicary/Images/' + strain + ' - Myrkild cell'));
    assert.match(sidecar, /^type: image$/m);
    assert.ok(sidecar.includes('asset: ' + filename));
    assert.match(sidecar, /^license: \S.+$/m);
    assert.match(sidecar, /^rights: .+$/m);
    assert.match(sidecar, /^alt: .+$/m);
  }
});
