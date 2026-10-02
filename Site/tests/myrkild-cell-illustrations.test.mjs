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
  const embeds = content.match(/!\\[\\[myrkild-[a-z]+-cell\\.webp\\|right\\|220\\|gap=16\\|alt=[^\\]]+\\]\\]/g) ?? [];
  assert.equal(embeds.length, strains.length);

  for (const strain of strains) {
    const name = strain.toLowerCase();
    const section = content.split('> ### ' + strain + '\\n')[1]?.split(/\\n\\n> \\[!vc-indent\\]|\\n\\nThe methods of infection/)[0];
    assert.ok(section, strain + ' subsection not found');
    assert.match(section, new RegExp('^>\\s*!\\[\\[myrkild-' + name +
      '-cell\\.webp\\|right\\|220\\|gap=16\\|alt=Illustration of a ' + strain +
      ' Myrkild cell', 'm'));
  }
});

test('the seven checked-in cells are valid WebP and link to draftable provenance records', () => {
  for (const strain of strains) {
    const filename = 'myrkild-' + strain.toLowerCase() + '-cell.webp';
    const buffer = readFileSync(path.join(vault, 'Assets/Images', filename));
    assert.ok(buffer.length > 5000, filename + ' is unexpectedly small');
    assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
    assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
    assert.equal(buffer.readUInt32LE(4) + 8, buffer.length);

    const companion = readFileSync(path.join(vault, 'Assets/Images', filename + '.attribution.md'), 'utf8');
    const source = readFileSync(path.join(vault, 'Lore/Myrkildicary/Images', strain + ' - Myrkild cell.md'), 'utf8');
    assert.match(companion, new RegExp('Lore/Myrkildicary/Images/' + strain + ' - Myrkild cell'));
    assert.match(source, /^type: image$/m);
    assert.match(source, new RegExp('^asset: ' + filename.replace('.', '\\.') + '$', 'm'));
    assert.match(source, /^license: Copyright$/m);
    assert.match(source, /^rights: .+$/m);
    assert.match(source, /^alt: .+$/m);
  }
});
