import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildSitemapLastmodMap, sitemapPathname } from '../src/lib/sitemap-lastmod.mjs';

test('sitemap lastmod uses authored updated date', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-sitemap-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  await fs.mkdir(path.join(root, 'eras', 'citadel'), { recursive: true });
  await fs.writeFile(path.join(root, 'eras', 'citadel', 'example.md'), `---\nslug: eras/citadel/example\npublished: 2026-07-08\nupdated: 2026-08-03\n---\n`);

  const map = await buildSitemapLastmodMap(root);
  assert.equal(map.get('/eras/citadel/example/'), '2026-08-03T00:00:00.000Z');
});

test('sitemap lastmod falls back to publication but never to creation date', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'viscerium-sitemap-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  await fs.writeFile(path.join(root, 'published.md'), `---\nslug: published\npublished: 2026-07-08\n---\n`);
  await fs.writeFile(path.join(root, 'draft-history.md'), `---\nslug: draft-history\ncreated: 2026-06-01\n---\n`);

  const map = await buildSitemapLastmodMap(root);
  assert.equal(map.get('/published/'), '2026-07-08T00:00:00.000Z');
  assert.equal(map.has('/draft-history/'), false);
});

test('sitemap URL matching normalises trailing slashes', () => {
  assert.equal(sitemapPathname('https://www.viscerium.co.uk/eras/citadel/example'), '/eras/citadel/example/');
  assert.equal(sitemapPathname('https://www.viscerium.co.uk/'), '/');
});
