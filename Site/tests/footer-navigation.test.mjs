import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const footerUrl = new URL('../src/components/CodexFooterRail.astro', import.meta.url);
const catalogueUrl = new URL('../src/content/i18n/en-GB.json', import.meta.url);

test('footer uses the agreed navigation groups and keeps HUMAN MADE separate', async () => {
  const footer = await fs.readFile(footerUrl, 'utf8');

  for (const key of [
    'viscerium.footer.resources',
    'viscerium.footer.whoWeAre',
    'viscerium.footer.getInvolved',
    'viscerium.footer.feeds',
    'viscerium.footer.legal',
  ]) {
    assert.match(footer, new RegExp(key.replaceAll('.', '\\.')));
  }

  for (const href of [
    '/start-here/',
    '/calendar/',
    '/graph/',
    '/about/',
    '/contact/',
    '/support/',
    'https://github.com/Bladeswillfall/VISCERIUM',
    '/rss.xml',
    '/atom.xml',
    '/privacy/',
    '/accessibility/',
    '/copyright/',
  ]) {
    assert.match(footer, new RegExp(`href=["{]${href.replaceAll('/', '\\/').replaceAll('.', '\\.')}["}]`));
  }

  assert.match(footer, /class="footer-wayfinder__primary" href="\/start-here\/"/);
  assert.match(footer, /class="footer-policy"/);
  assert.match(footer, /href="\/policies\/content-production\/"/);
});

test('footer navigation copy lives in the i18n catalogue', async () => {
  const catalogue = JSON.parse(await fs.readFile(catalogueUrl, 'utf8'));

  assert.equal(catalogue['viscerium.footer.resources'], 'Resources');
  assert.equal(catalogue['viscerium.footer.whoWeAre'], 'Who we are');
  assert.equal(catalogue['viscerium.footer.getInvolved'], 'Get involved');
  assert.equal(catalogue['viscerium.footer.feeds'], 'Feeds');
  assert.equal(catalogue['viscerium.footer.legal'], 'Legal');
  assert.equal(catalogue['viscerium.footer.aboutUs'], 'About us');
  assert.equal(catalogue['viscerium.footer.supportUs'], 'Support us');
  assert.equal(catalogue['viscerium.footer.copyrightPermissions'], 'Copyright & permissions');
});
