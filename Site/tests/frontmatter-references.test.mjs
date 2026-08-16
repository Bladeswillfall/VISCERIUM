import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  findInvalidFrontmatterReferences,
  resolveFrontmatterReference,
} from '../src/lib/frontmatter-reference.mjs';
import { validateVaultNotes } from '../scripts/validate-vault-notes.mjs';

function manifest(data) {
  return {
    records: [{
      file: '/tmp/viscerium-reference-fixture.md',
      data: {
        status: 'published',
        title: 'Reference fixture',
        description: 'Validation fixture.',
        ...data,
      },
      content: 'Ordinary lore text.',
    }],
  };
}

function validateQuietly(data) {
  const originalError = console.error;
  const errors = [];
  console.error = (...values) => errors.push(values.join(' '));
  try {
    return { valid: validateVaultNotes(manifest(data)), errors };
  } finally {
    console.error = originalError;
  }
}

test('reference resolution permits only approved navigation and asset forms', () => {
  const navigation = [
    ['/safe/path/', '/safe/path/'],
    ['#details', '#details'],
    ['https://example.com/path?q=1', 'https://example.com/path?q=1'],
    ['http://example.com/', 'http://example.com/'],
    ['mailto:editor@example.com', 'mailto:editor@example.com'],
    ['[[Safe page#details|Safe]]', '[[Safe page#details|Safe]]'],
  ];
  const assets = [
    ['cover.webp', '/assets/images/cover.webp'],
    ['Assets/Images/header.webp', '/assets/images/header.webp'],
    ['Assets/Maps/world.webp', '/assets/maps/world.webp'],
    ['/assets/images/header.webp', '/assets/images/header.webp'],
  ];

  for (const [input, expected] of navigation) {
    assert.equal(resolveFrontmatterReference(input), expected);
  }
  for (const [input, expected] of assets) {
    assert.equal(resolveFrontmatterReference(input, { kind: 'asset' }), expected);
  }
});

test('reference resolution rejects unsafe, unsupported, and malformed values', () => {
  const navigation = [
    '//evil.example/path',
    '/\\evil.example/path',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'ftp://example.com/file',
    'http:example.com',
    'https:///example.com',
    'https://',
    'mailto:',
    'mailto://evil.example',
    'relative/path',
    '[[   ]]',
    '[[unfinished',
  ];
  const assets = [
    '//evil.example/image.webp',
    '../outside.webp',
    'javascript:alert.webp',
    'data:image/svg+xml,<svg/>',
    'mailto:image@example.com',
    'https://example.com/image.webp',
    'image',
  ];

  for (const input of navigation) assert.equal(resolveFrontmatterReference(input), undefined, input);
  for (const input of assets) {
    assert.equal(resolveFrontmatterReference(input, { kind: 'asset' }), undefined, input);
  }
});

test('published frontmatter validates top-level and nested references', () => {
  const validData = {
    sourceUrl: 'https://example.com/source',
    image: 'cover.webp',
    headerImage: '/assets/images/header.webp',
    asset: 'Assets/Images/art.webp',
    sidebar: {
      sections: [{
        items: [
          { label: 'Internal', href: '/safe/' },
          { label: 'Fragment', href: '#details' },
          { label: 'Mail', href: 'mailto:editor@example.com' },
          { label: 'Wiki', href: '[[Safe page]]' },
        ],
        media: { src: '/assets/maps/world.webp' },
      }],
    },
  };

  assert.deepEqual(findInvalidFrontmatterReferences(validData), []);
  assert.equal(validateQuietly(validData).valid, true);

  const cases = [
    ['top-level image', { image: 'javascript:alert.webp' }],
    ['top-level source URL', { sourceUrl: 'https://' }],
    ['protocol-relative nested href', { sidebar: { items: [{ href: '//evil.example/' }] } }],
    ['nested executable href', { sidebar: { items: [{ href: 'javascript:alert(1)' }] } }],
    ['nested data src', { sidebar: { media: { src: 'data:image/svg+xml,<svg/>' } } }],
    ['unsupported nested protocol', { sidebar: { items: [{ href: 'ftp://example.com/' }] } }],
    ['malformed nested URL', { sidebar: { items: [{ href: 'http://[::1' }] } }],
  ];

  for (const [name, data] of cases) {
    const result = validateQuietly(data);
    assert.equal(result.valid, false, name);
    assert.match(result.errors.join('\n'), /Invalid frontmatter (?:asset|navigation) reference/, name);
  }
});

test('page title and sidebar rendering share fail-closed reference handling', async () => {
  const [title, sidebar] = await Promise.all([
    readFile(new URL('../src/components/CodexPageTitle.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/CodexPageSidebar.astro', import.meta.url), 'utf8'),
  ]);

  assert.match(title, /resolveFrontmatterReference\(imageSource, \{ kind: 'asset' \}\)/);
  assert.match(sidebar, /resolveFrontmatterReference\(rawImageSource, \{ kind: 'asset' \}\)/);
  assert.match(sidebar, /resolveWikilink:\s*resolveSidebarTarget/);
  assert.match(sidebar, /valueHref \?/);
});
