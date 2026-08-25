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
  'PUBLIC_COMMENTS_ENABLED',
  'PUBLIC_COMMENTS_HOST',
  'PUBLIC_COMMENTS_SITE_ID',
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

test('replacement defaults use the repository, canonical domain, comments, and webmentions', async () => {
  const config = await loadConfig();

  assert.equal(config.title, 'VISCERIUM');
  assert.equal(config.site, 'https://www.viscerium.co.uk');
  assert.equal(config.githubRepoUrl, 'https://github.com/Bladeswillfall/VISCERIUM');
  assert.equal(config.comments.host, 'https://comments.viscerium.co.uk');
  assert.equal(config.comments.siteId, 'viscerium');
  assert.equal(config.webmentions.enabled, true);
  assert.equal(config.webmentions.username, 'www.viscerium.co.uk');
  assert.equal(config.webmentions.endpoint, 'https://webmention.io/www.viscerium.co.uk/webmention');
  assert.equal(config.webmentions.pingbackEndpoint, 'https://webmention.io/www.viscerium.co.uk/xmlrpc');
});

test('private integrations remain inert while public integrations keep safe defaults', async () => {
  const config = await loadConfig({
    PUBLIC_GA4_ENABLED: '1',
    PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: '1',
    PUBLIC_COMMENTS_ENABLED: '1',
    PUBLIC_CONTACT_FORM_ENABLED: '1',
  });

  assert.equal(config.analytics.ga4.enabled, false);
  assert.equal(config.analytics.cloudflare.enabled, false);
  assert.equal(config.comments.enabled, true);
  assert.equal(config.webmentions.enabled, true);
  assert.equal(config.contactForm.enabled, false);
});

test('webmentions retain an explicit emergency off switch', async () => {
  const config = await loadConfig({
    PUBLIC_WEBMENTIONS_ENABLED: '0',
  });

  assert.equal(config.webmentions.enabled, false);
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
