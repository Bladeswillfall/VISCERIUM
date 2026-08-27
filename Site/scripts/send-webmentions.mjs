import { pathToFileURL } from 'node:url';

const DEFAULT_SITE_URL = 'https://www.viscerium.co.uk';
const DEFAULT_ENDPOINT = 'https://webmention.app/check/';

export function buildWebmentionRequestUrl(source, options = {}) {
  const siteUrl = new URL(options.siteUrl ?? DEFAULT_SITE_URL);
  const sourceUrl = new URL(source, siteUrl);
  if (sourceUrl.origin !== siteUrl.origin) {
    throw new Error(`Refusing to send Webmentions for non-canonical origin: ${sourceUrl.origin}`);
  }

  const requestUrl = new URL(options.endpoint ?? DEFAULT_ENDPOINT);
  if (requestUrl.protocol !== 'https:') {
    throw new Error('Webmention sender endpoint must use HTTPS.');
  }

  requestUrl.searchParams.set('url', sourceUrl.href);
  if (options.token) requestUrl.searchParams.set('token', options.token);
  return requestUrl;
}

export async function sendWebmentions(source, options = {}) {
  const requestUrl = buildWebmentionRequestUrl(source, options);
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: { 'user-agent': 'VISCERIUM-Webmention-Sender/1.0' },
  });

  if (!response.ok) {
    throw new Error(`webmention.app returned HTTP ${response.status} for ${source}`);
  }

  return response;
}

async function main() {
  const sources = process.argv.slice(2);
  if (sources.length === 0) {
    throw new Error('Usage: npm run webmentions:send -- <production article or feed URL> [...]');
  }

  const options = {
    siteUrl: process.env.SITE_URL ?? DEFAULT_SITE_URL,
    endpoint: process.env.WEBMENTION_APP_ENDPOINT ?? DEFAULT_ENDPOINT,
    token: process.env.WEBMENTION_APP_TOKEN?.trim() || undefined,
  };

  for (const source of sources) {
    await sendWebmentions(source, options);
    console.log(`Sent outbound Webmentions for ${new URL(source, options.siteUrl).href}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
