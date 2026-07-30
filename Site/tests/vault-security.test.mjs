import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVaultNotes } from '../scripts/validate-vault-notes.mjs';

function manifest(content, data = {}) {
  return {
    records: [{
      file: '/tmp/viscerium-security-fixture.md',
      data: {
        status: 'published',
        title: 'Security fixture',
        description: 'Validation fixture.',
        ...data,
      },
      content,
    }],
  };
}

function validateQuietly(content, data) {
  const originalError = console.error;
  const errors = [];
  console.error = (...values) => errors.push(values.join(' '));
  try {
    return { valid: validateVaultNotes(manifest(content, data)), errors };
  } finally {
    console.error = originalError;
  }
}

function validEraPrimer() {
  return {
    id: 'citadel',
    number: 'Era I',
    title: 'CITADEL',
    tagline: 'Fixture tagline',
    lead: 'Fixture lead',
    traits: [],
    map: {
      src: '/fixture.webp',
      alt: 'Fixture map',
      href: '/maps/fixture/',
      eyebrow: 'Fixture',
      label: 'Fixture map',
      action: 'Open map',
    },
    worldNow: {
      eyebrow: 'World now',
      title: 'Fixture world',
      body: 'Fixture body',
    },
    essentials: [],
    terms: [],
    powersIntro: 'Fixture powers',
    powers: [],
    knowledge: [],
    record: {
      eyebrow: 'Record',
      title: 'Fixture record',
      body: 'Fixture body',
      eventsHref: '/events/',
      nextEraHref: '/next/',
      nextEraLabel: 'Next era',
    },
  };
}

test('published notes allow inert examples inside code spans and fences', () => {
  const result = validateQuietly([
    'Ordinary lore text.',
    '',
    '`<script>alert(1)</script>`',
    '',
    '```html',
    '<iframe src="https://example.com"></iframe>',
    '```',
  ].join('\n'));

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('published notes reject active HTML and unsafe URL schemes', async (t) => {
  const cases = [
    ['script tag', '<script>alert(1)</script>'],
    ['iframe tag', '<iframe src="https://example.com"></iframe>'],
    ['inline event handler', '<img src="/safe.png" onerror="alert(1)">'],
    ['HTML javascript URL', '<a href="javascript:alert(1)">Open</a>'],
    ['Markdown javascript URL', '[Open](javascript:alert(1))'],
    ['HTML data document', '<a href="data:text/html,<script>alert(1)</script>">Open</a>'],
    ['remote MDX module', "import Widget from 'https://example.com/widget.js';"],
    ['remote MDX side-effect import', "import 'https://example.com/widget.js';"],
    ['remote MDX re-export', "export { Widget } from 'https://example.com/widget.js';"],
    ['remote dynamic import', "const Widget = import('https://example.com/widget.js');"],
  ];

  for (const [name, content] of cases) {
    await t.test(name, () => {
      const result = validateQuietly(content);
      assert.equal(result.valid, false);
      assert.ok(result.errors.length > 0);
    });
  }
});

test('published note routes are derived from their file paths', () => {
  const result = validateQuietly('Ordinary lore text.', { slug: 'custom-route' });

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /routes are derived from file paths/);
});

test('Lore rejects the retired publish boolean', () => {
  const result = validateQuietly('Ordinary lore text.', { publish: true });

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /retired frontmatter "publish"/);
});

test('Lore rejects the retired canon status', () => {
  const result = validateQuietly('Ordinary lore text.', { status: 'canon' });

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /retired status: canon/);
});

test('published era primer shortcodes reject shell-only source notes', () => {
  const result = validateQuietly('[EraPrimer:citadel]');

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /Invalid Vault-owned era primer/);
});

test('published era primer shortcodes accept matching Vault-owned data', () => {
  const result = validateQuietly('[EraPrimer:citadel]', { eraPrimer: validEraPrimer() });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('published era primer data cannot drift from its shortcode id', () => {
  const result = validateQuietly('[EraPrimer:smog]', { eraPrimer: validEraPrimer() });

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /does not match shortcode "smog"/);
});

test('published era primer maps reject external destinations', () => {
  const primer = validEraPrimer();
  primer.map.href = 'https://www.worldanvil.com/w/viscerium/map/example';
  const result = validateQuietly('[EraPrimer:citadel]', { eraPrimer: primer });

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /internal Atlas route/);
});
