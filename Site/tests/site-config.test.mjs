import test from 'node:test';
import assert from 'node:assert/strict';

const integrationKeys = [
  'SITE_TITLE',
  'SITE_DESCRIPTION',
  'SITE_URL',
  'LORE_SOURCE_DIR',
  'PUBLIC_GITHUB_REPO_URL',
  'PUBLIC_GITHUB_PROFILE_URL',
  'PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED',
  'PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN',
  'PUBLIC_RYBBIT_ENABLED',
  'PUBLIC_RYBBIT_HOST',
  'PUBLIC_RYBBIT_SITE_ID',
  'PUBLIC_COMMENTS_ENABLED',
  'PUBLIC_COMMENTS_HOST',
  'PUBLIC_COMMENTS_SITE_ID',
  'PUBLIC_WEBMENTIONS_ENABLED',
  'PUBLIC_WEBMENTION_IO_USERNAME',
  'PUBLIC_WEBMENTION_ENDPOINT',
  'PUBLIC_WEBMENTION_PINGBACK_ENDPOINT',
  'PUBLIC_WEBMENTION_API_ENDPOINT',
  'PUBLIC_WEBMENTIONS_MAX',
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

test('replacement defaults use the canonical domain, Elias identity, comments, and webmentions', async () => {
  const config = await loadConfig();

  assert.equal(config.title, 'VISCERIUM');
  assert.equal(config.site, 'https://www.viscerium.co.uk');
  assert.equal(config.githubRepoUrl, '');
  assert.equal(config.identity.creatorName, 'Elias Vail');
  assert.equal(config.identity.githubProfileUrl, '');
  assert.equal(config.comments.host, 'https://comments.viscerium.co.uk');
  assert.equal(config.comments.siteId, 'viscerium');
  assert.equal(config.webmentions.enabled, true);
  assert.equal(config.webmentions.username, 'www.viscerium.co.uk');
  assert.equal(config.webmentions.endpoint, 'https://webmention.io/www.viscerium.co.uk/webmention');
  assert.equal(config.webmentions.pingbackEndpoint, 'https://webmention.io/www.viscerium.co.uk/xmlrpc');
  assert.equal(config.analytics.rybbit.enabled, false);
  assert.equal(config.analytics.rybbit.host, 'https://analytics.viscerium.co.uk');
});

test('optional integrations stay inert without required public values', async () => {
  const config = await loadConfig({
    PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: '1',
    PUBLIC_RYBBIT_ENABLED: '1',
    PUBLIC_COMMENTS_ENABLED: '1',
    PUBLIC_CONTACT_FORM_ENABLED: '1',
  });

  assert.equal(config.analytics.cloudflare.enabled, false);
  assert.equal(config.analytics.rybbit.enabled, false);
  assert.equal(config.comments.enabled, true);
  assert.equal(config.webmentions.enabled, true);
  assert.equal(config.contactForm.enabled, false);
});

test('Rybbit requires an HTTPS host and site ID', async () => {
  const enabled = await loadConfig({
    PUBLIC_RYBBIT_ENABLED: '1',
    PUBLIC_RYBBIT_HOST: 'https://analytics.viscerium.co.uk/',
    PUBLIC_RYBBIT_SITE_ID: 'd863318efa2f',
  });
  const insecure = await loadConfig({
    PUBLIC_RYBBIT_ENABLED: '1',
    PUBLIC_RYBBIT_HOST: 'http://analytics.viscerium.co.uk',
    PUBLIC_RYBBIT_SITE_ID: 'd863318efa2f',
  });

  assert.equal(enabled.analytics.rybbit.enabled, true);
  assert.equal(enabled.analytics.rybbit.host, 'https://analytics.viscerium.co.uk');
  assert.equal(enabled.analytics.rybbit.siteId, 'd863318efa2f');
  assert.equal(insecure.analytics.rybbit.enabled, false);
});

test('webmentions retain an explicit emergency off switch', async () => {
  const config = await loadConfig({
    PUBLIC_WEBMENTIONS_ENABLED: '0',
  });

  assert.equal(config.webmentions.enabled, false);
});

test('site identity, repository links, and lore source support environment overrides', async () => {
  const config = await loadConfig({
    SITE_TITLE: 'Test Codex',
    SITE_DESCRIPTION: 'Test description',
    LORE_SOURCE_DIR: '../Test/Lore',
    PUBLIC_GITHUB_REPO_URL: 'https://github.com/example/viscerium/',
    PUBLIC_GITHUB_PROFILE_URL: 'https://github.com/example/',
  });

  assert.equal(config.title, 'Test Codex');
  assert.equal(config.description, 'Test description');
  assert.equal(config.loreSourceDir, '../Test/Lore');
  assert.equal(config.githubRepoUrl, 'https://github.com/example/viscerium');
  assert.equal(config.identity.githubProfileUrl, 'https://github.com/example');
});
