const env = process.env;
const siteUrl = env.SITE_URL?.trim() || 'https://www.viscerium.co.uk';

const webmentionUsername = env.PUBLIC_WEBMENTION_IO_USERNAME?.trim() || 'www.viscerium.co.uk';
const webmentionEndpoint =
  env.PUBLIC_WEBMENTION_ENDPOINT?.trim() ||
  (webmentionUsername ? `https://webmention.io/${webmentionUsername}/webmention` : undefined);
const webmentionPingbackEndpoint =
  env.PUBLIC_WEBMENTION_PINGBACK_ENDPOINT?.trim() ||
  (webmentionUsername ? `https://webmention.io/${webmentionUsername}/xmlrpc` : undefined);
const webmentionMaxMentions = Number.parseInt(env.PUBLIC_WEBMENTIONS_MAX ?? '24', 10);
const feedMaxItems = Number.parseInt(env.PUBLIC_FEED_MAX_ITEMS ?? '50', 10);
const ga4MeasurementId = env.PUBLIC_GA4_MEASUREMENT_ID?.trim() ?? '';
const cloudflareAnalyticsToken = env.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN?.trim() ?? '';
const giscusRepo = env.PUBLIC_GISCUS_REPO?.trim() || 'Bladeswillfall/VISCERIUM';
const giscusRepoId = env.PUBLIC_GISCUS_REPO_ID?.trim() || 'R_kgDOTOiQ7g';
const giscusCategory = env.PUBLIC_GISCUS_CATEGORY?.trim() || 'Comments';
const giscusCategoryId = env.PUBLIC_GISCUS_CATEGORY_ID?.trim() || 'DIC_kwDOTOiQ7s4DCYjH';
const contactFormEndpoint = env.PUBLIC_CONTACT_FORM_ENDPOINT?.trim() ?? '';
const turnstileSiteKey = env.PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export default {
  title: env.SITE_TITLE ?? 'VISCERIUM',
  description: env.SITE_DESCRIPTION ?? 'The public worldbuilding codex for VISCERIUM.',
  site: siteUrl,
  loreSourceDir: env.LORE_SOURCE_DIR ?? '../Vault/Lore',
  vaultAssetDir: '../Vault/Assets',
  githubRepoUrl: 'https://github.com/Bladeswillfall/VISCERIUM',
  feeds: {
    title: env.PUBLIC_FEED_TITLE ?? 'VISCERIUM Codex',
    description: env.PUBLIC_FEED_DESCRIPTION ?? 'Latest public canon updates from the VISCERIUM codex.',
    language: env.PUBLIC_FEED_LANGUAGE ?? 'en',
    maxItems: Number.isFinite(feedMaxItems) ? feedMaxItems : 50,
  },
  webmentions: {
    enabled: env.PUBLIC_WEBMENTIONS_ENABLED === '1' && Boolean(webmentionEndpoint),
    username: webmentionUsername,
    endpoint: webmentionEndpoint,
    pingbackEndpoint: webmentionPingbackEndpoint,
    apiEndpoint: env.PUBLIC_WEBMENTION_API_ENDPOINT || 'https://webmention.io/api/mentions.jf2',
    maxMentions: Number.isFinite(webmentionMaxMentions) ? webmentionMaxMentions : 24,
  },
  analytics: {
    ga4: {
      enabled: env.PUBLIC_GA4_ENABLED === '1' && /^G-[A-Z0-9]{10}$/.test(ga4MeasurementId),
      measurementId: ga4MeasurementId,
    },
    cloudflare: {
      enabled:
        env.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED === '1'
        && /^[a-f0-9]{32}$/i.test(cloudflareAnalyticsToken),
      token: cloudflareAnalyticsToken,
    },
  },
  searchVerification: {
    google: env.PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ?? '',
  },
  giscus: {
    // Match the proven deployment behaviour from the previous Codex: the public
    // integration is available without dashboard variables, with an explicit
    // value of 0 retained as an emergency off switch.
    enabled:
      env.PUBLIC_GISCUS_ENABLED !== '0'
      && giscusRepo === 'Bladeswillfall/VISCERIUM'
      && Boolean(giscusRepoId && giscusCategory && giscusCategoryId),
    repo: giscusRepo,
    repoId: giscusRepoId,
    category: giscusCategory,
    categoryId: giscusCategoryId,
    mapping: env.PUBLIC_GISCUS_MAPPING ?? 'pathname',
    reactions: env.PUBLIC_GISCUS_REACTIONS_ENABLED !== '0',
    inputPosition: env.PUBLIC_GISCUS_INPUT_POSITION ?? 'bottom',
    theme: {
      // Keep dark mode exactly as before. For light mode, use Giscus' own
      // noborder_light counterpart instead of a VISCERIUM-coloured custom theme.
      // Auto mode uses a tiny stylesheet that switches between the two stock
      // noborder themes based on the operating-system preference.
      dark: env.PUBLIC_GISCUS_DARK_THEME ?? env.PUBLIC_GISCUS_THEME ?? 'noborder_dark',
      light: 'noborder_light',
      auto: `${siteUrl}/giscus-auto.css`,
    },
    lazy: env.PUBLIC_GISCUS_LOADING !== 'eager',
  },
  contactForm: {
    enabled:
      env.PUBLIC_CONTACT_FORM_ENABLED === '1'
      && isHttpsUrl(contactFormEndpoint)
      && Boolean(turnstileSiteKey),
    endpoint: contactFormEndpoint,
    turnstileSiteKey,
  },
};
