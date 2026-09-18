import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePaths = {
  'viscerium-timelines': 'Tools/obsidian-viscerium-timelines',
  'viscerium-creator-tools': 'Tools/obsidian-viscerium-creator-tools',
  'viscerium-layout-tools': 'Tools/obsidian-viscerium-layout-tools',
  'viscerium-image-tools': 'Tools/obsidian-viscerium-image-tools',
  'viscerium-journal-tools': 'Tools/obsidian-viscerium-journal-tools',
};

const plainPluginIds = Object.keys(sourcePaths).filter((id) => id !== 'viscerium-timelines');

test('plain first-party Obsidian source matches the checked-in Vault runtime', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, 'Tools/scripts/sync-obsidian-plugins.mjs'), '--check'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('plain first-party Obsidian JavaScript parses from the maintained Tools source', async () => {
  for (const id of plainPluginIds) {
    const source = await readFile(path.join(repoRoot, sourcePaths[id], 'src/main.js'), 'utf8');
    assert.doesNotThrow(() => new Function(source), `${id} source should parse`);
  }
});

test('layout-tools quote parsing avoids nested repeated regexes', async () => {
  const source = await readFile(
    path.join(repoRoot, sourcePaths['viscerium-layout-tools'], 'src/main.js'),
    'utf8',
  );

  for (const unsafePrefix of ['(?:\\s*>\\s*)+', '(?:>\\s*)+', '(?:>\\s*)*']) {
    assert.ok(!source.includes(unsafePrefix), `layout-tools must not use ${unsafePrefix}`);
  }

  const context = vm.createContext({
    module: { exports: {} },
    exports: {},
    require: (id) => {
      assert.equal(id, 'obsidian');
      return { MarkdownView: class {}, Notice: class {}, Plugin: class {} };
    },
  });
  new vm.Script(source, { filename: 'viscerium-layout-tools/main.js' }).runInContext(context);

  const deepPrefix = '> '.repeat(4096);
  const marker = '<span class="vc-layout-indent-marker" aria-hidden="true" hidden></span>';
  assert.equal(context.quoteDepth(`${deepPrefix}text`), 4096);
  assert.equal(context.isIndentHeaderLine(`${deepPrefix}[!vc-indent]`), true);
  assert.equal(context.isIndentMarkerLine(`${deepPrefix}${marker}`), true);
  assert.equal(context.isIndentHeaderLine(`${deepPrefix}not-an-indent`), false);
  assert.equal(context.compactNestedIndentBody('>> #### Nested heading').body, '#### Nested heading');
  assert.equal(context.compactNestedIndentBody('>> > Nested quotation').body, '> Nested quotation');
  assert.equal(context.compactNestedIndentBody('> > Real quotation'), null);
});


test('image-tools sidecars default to Copyright without overwriting unsupported assets', async () => {
  const source = await readFile(
    path.join(repoRoot, sourcePaths['viscerium-image-tools'], 'src/main.js'),
    'utf8',
  );

  const context = vm.createContext({
    module: { exports: {} },
    exports: {},
    console,
    require: (id) => {
      assert.equal(id, 'obsidian');
      return { Notice: class {}, Plugin: class {} };
    },
  });
  new vm.Script(source, { filename: 'viscerium-image-tools/main.js' }).runInContext(context);

  const image = context.attributionSidecarSpec({
    path: 'Assets/Images/degel-system/test-art.webp',
    extension: 'webp',
    basename: 'test-art',
    name: 'test-art.webp',
  });
  assert.equal(image.sidecarPath, 'Assets/Attribution/Images/degel-system/test-art.webp.md');
  assert.equal(image.asset, '/assets/images/degel-system/test-art.webp');
  assert.match(context.attributionSidecarMarkdown(image), /rights: "Copyright"/);

  const map = context.attributionSidecarSpec({
    path: 'Assets/Maps/Errack.svg',
    extension: 'svg',
    basename: 'Errack',
    name: 'Errack.svg',
  });
  assert.equal(map.sidecarPath, 'Assets/Attribution/Maps/Errack.svg.md');
  assert.equal(map.asset, '/assets/maps/Errack.svg');

  assert.equal(context.attributionSidecarSpec({
    path: 'Assets/Images/source.png',
    extension: 'png',
    basename: 'source',
  }), null);
  assert.equal(context.attributionSidecarSpec({
    path: 'Assets/Documents/example.webp',
    extension: 'webp',
    basename: 'example',
  }), null);
});


test('plugin profile records maintained source and Vault runtime paths', async () => {
  const profile = JSON.parse(await readFile(path.join(repoRoot, 'Vault/System/Obsidian Plugin Profile.json'), 'utf8'));

  for (const [id, sourcePath] of Object.entries(sourcePaths)) {
    const plugin = profile.plugins.find((candidate) => candidate.id === id);
    assert.equal(plugin?.source, 'first-party', `${id} should be first-party`);
    assert.equal(plugin?.sourcePath, sourcePath, `${id} should identify its maintained source`);
    assert.equal(plugin?.runtimePath, `Vault/.obsidian/plugins/${id}`, `${id} should identify its checked-in runtime`);
  }
});
