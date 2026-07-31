import test from 'node:test';
import assert from 'node:assert/strict';

const integrationKeys = [
  'SITE_TITLE',
  'SITE_DESCRIPTION',
  'SITE_URL',
  'LORE_SOURCE_DIR',
  'PUBLIC_GA4_ENABLED',
  'PUBLIC_GA4_MEASUREMENT_ID',
  'PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED',
  'PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN',
  'PUBLIC_GISCUS_ENABLED',
  'PUBLIC_GISCUS_REPO',
  'PUBLIC_GISCUS_REPO_ID',
  'PUBLIC_GISCUS_CATEGORY',
  'PUBLIC_GISCUS_CATEGORY_ID',
  'PUBLIC_WEBMENTIONS_ENABLED',
  'PUBLIC_WEBMENTION_IO_USERNAME',
  'PUBLIC_CONTACT_FORM_ENABLED',
  'PUBLIC_CONTACT_FORM_ENDPOINT',
  'PUBLIC_TURNSTILE_SITE_KEY',
];

async function loadConfig(overrides = {}) {
  const original = Object.fromEntries(integrationKeys.map((key) => [key, process.env[key]]));

  try {
    for (const key of integrationKeys) delete process.env[key];
    Object.assign(process.env, overrides);
    const { default: config } = await import(`../site.config.mjs?test=${Date.now()}-${Math.random()}`);
    return config;
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('replacement defaults use the new repository and canonical domain', async () => {
  const config = await loadConfig();

  assert.equal(config.title, 'VISCERIUM');
  assert.equal(config.site, 'https://www.viscerium.co.uk');
  assert.equal(config.githubRepoUrl, 'https://github.com/Bladeswillfall/VISCERIUM');
  assert.equal(config.giscus.repo, 'Bladeswillfall/VISCERIUM');
  assert.equal(config.webmentions.username, 'www.viscerium.co.uk');
});

test('private integrations remain inert while Giscus uses public defaults', async () => {
  const config = await loadConfig({
    PUBLIC_GA4_ENABLED: '1',
    PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: '1',
    PUBLIC_GISCUS_ENABLED: '1',
    PUBLIC_WEBMENTIONS_ENABLED: '0',
    PUBLIC_CONTACT_FORM_ENABLED: '1',
  });

  assert.equal(config.analytics.ga4.enabled, false);
  assert.equal(config.analytics.cloudflare.enabled, false);
  assert.equal(config.giscus.enabled, true);
  assert.equal(config.webmentions.enabled, false);
  assert.equal(config.contactForm.enabled, false);
  assert.equal(config.giscus.repoId, 'R_kgDOTOiQ7g');
  assert.equal(config.giscus.categoryId, 'DIC_kwDOTOiQ7s4DCYjH');
});

test('site identity and lore source support environment overrides', async () => {
  const config = await loadConfig({
    SITE_TITLE: 'Test Codex',
    SITE_DESCRIPTION: 'Test description',
    LORE_SOURCE_DIR: '../Test/Lore',
  });

  assert.equal(config.title, 'Test Codex');
  assert.equal(config.description, 'Test description');
  assert.equal(config.loreSourceDir, '../Test/Lore');
});
