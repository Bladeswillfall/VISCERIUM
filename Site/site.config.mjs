export const DEFAULT_LOCALE = 'en-GB';

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
const commentsHost = (env.PUBLIC_COMMENTS_HOST?.trim() || 'https://comments.viscerium.co.uk').replace(/\/+$/, '');
const commentsSiteId = env.PUBLIC_COMMENTS_SITE_ID?.trim() || 'viscerium';

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
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
  },
  loreSourceDir: env.LORE_SOURCE_DIR ?? '../Vault/Lore',
  vaultAssetDir: '../Vault/Assets',
  githubRepoUrl: 'https://github.com/Bladeswillfall/VISCERIUM',
  feeds: {
    title: env.PUBLIC_FEED_TITLE ?? 'VISCERIUM Codex',
    description: env.PUBLIC_FEED_DESCRIPTION ?? 'Latest public canon updates from the VISCERIUM codex.',
    language: env.PUBLIC_FEED_LANGUAGE ?? DEFAULT_LOCALE,
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
  comments: {
    enabled: env.PUBLIC_COMMENTS_ENABLED !== '0' && isHttpsUrl(commentsHost),
    host: commentsHost,
    siteId: commentsSiteId,
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
